import {roomBounds,containsPoint,insideObject,boundarySurfaces,visible,acousticPosition,geometrySummary} from './geometry.js';
import {soundSpeed} from './acoustics.js';
// Explicit 3D six-neighbour FDTD on a voxelised free-air domain, rigid Neumann walls.
// No fitted material losses, no absolute SPL, no invented Q/RT60 from this solver.
export function makeWaveGrid(project,{maxFrequency=100,cellsPerWavelength=10,maxCells=40000}={}){
  if(!Number.isFinite(cellsPerWavelength)||cellsPerWavelength<10||cellsPerWavelength>30||!Number.isInteger(maxCells)||maxCells<1||maxCells>40000)throw new Error('FDTD-Raster: 10–30 Zellen pro Wellenlänge, maximal 40.000 Zellen.');
  if(!Number.isFinite(maxFrequency)||maxFrequency<20||maxFrequency>300)throw new Error('Wellenmodell: 20–300 Hz.');
  const summary=geometrySummary(project);if(summary.unmatchedOpenings.length)throw new Error('FDTD: offene/gekoppelte Durchgänge benötigen validierte abstrahlende Ränder; diese Konfiguration wird nicht als geschlossener Raum simuliert.');
  if(summary.volume===null)throw new Error('Überlappende Zonen korrigieren.');
  const c=soundSpeed(project.room.temperature),h=c/maxFrequency/cellsPerWavelength,bounds=roomBounds(project.room);
  const counts=bounds.max.map((v,i)=>Math.max(2,Math.ceil((v-bounds.min[i])/h)));
  const step=Math.max(...bounds.max.map((v,i)=>(v-bounds.min[i])/counts[i]));
  const n=counts.reduce((a,b)=>a*b,1);if(n>maxCells)throw new Error(`Wellenmodell benötigt ${n} Zellen; maximal ${maxCells}. Frequenz reduzieren oder gröberes Raster wählen.`);
  const spacing=bounds.max.map((v,i)=>(v-bounds.min[i])/counts[i]);
  const index=(x,y,z)=>x+counts[0]*(y+counts[1]*z),positions=[],indices=new Int32Array(n).fill(-1),coords=[];
  for(let z=0;z<counts[2];z++)for(let y=0;y<counts[1];y++)for(let x=0;x<counts[0];x++){
    const p=[x,y,z].map((q,i)=>bounds.min[i]+(q+.5)*spacing[i]);
    if(containsPoint(project.room,p)&&!(project.objects||[]).some(o=>insideObject(o,p))){indices[index(x,y,z)]=positions.length;positions.push(p);coords.push([x,y,z]);}
  }
  if(positions.length<8)throw new Error('Zu wenig freie Zellen.');
  const surfaces=boundarySurfaces(project),neighbors=new Int32Array(positions.length*6).fill(-1);
  coords.forEach((coord,i)=>{for(let axis=0;axis<3;axis++)for(const [j,sign] of [-1,1].entries()){
    const v=[...coord];v[axis]+=sign;if(v[axis]<0||v[axis]>=counts[axis])continue;
    const neighbor=indices[index(...v)];if(neighbor>=0&&visible(positions[i],positions[neighbor],surfaces))neighbors[6*i+2*axis+j]=neighbor;
  }});
  const dt=.9/(c*Math.sqrt(spacing.reduce((s,v)=>s+1/v**2,0)));
  return {positions,neighbors,spacing,counts,h:step,c,dt,maxFrequency,evidence:'SIMULATED',assumptions:'3D-FDTD, starre verlustlose Neumann-Ränder, voxelisierte Geometrie und Boxhindernisse. Keine Materialabsorption, Beugungsvalidierung oder kalibrierten Pegel. Mindestens 10 Zellen pro kürzester Wellenlänge; Gitterkonvergenz gesondert prüfen.'};
}
export function waveStep(grid,current,previous,forcingIndex=-1,forcing=0){
  const next=new Float64Array(current.length),weights=grid.spacing.map(h=>(grid.c*grid.dt/h)**2);
  for(let i=0;i<current.length;i++){
    let lap=0;for(let a=0;a<3;a++)for(let j=0;j<2;j++){const k=grid.neighbors[6*i+2*a+j];if(k>=0)lap+=weights[a]*(current[k]-current[i]);}
    next[i]=2*current[i]-previous[i]+lap;
  }if(forcingIndex>=0)next[forcingIndex]+=forcing;return next;
}
export function simulateWave(project,source,receiver,options={}){
  if(!containsPoint(project.room,acousticPosition(source))||!containsPoint(project.room,receiver.position)||(project.objects||[]).some(o=>insideObject(o,acousticPosition(source))||insideObject(o,receiver.position)))throw new Error('Quelle und Empfänger müssen im freien Luftvolumen liegen.');
  const grid=makeWaveGrid(project,options),seconds=options.seconds??.25;
  if(!Number.isFinite(seconds)||seconds<.05||seconds>1)throw new Error('Simulationsdauer: 0,05–1 s.');
  const steps=Math.ceil(seconds/grid.dt);if(steps*grid.positions.length>180000000)throw new Error('Rechenbudget überschritten: Dauer oder obere Frequenz reduzieren.');
  const nearest=p=>grid.positions.reduce((best,q,i)=>q.reduce((s,v,k)=>s+(v-p[k])**2,0)<grid.positions[best].reduce((s,v,k)=>s+(v-p[k])**2,0)?i:best,0);
  const si=nearest(acousticPosition(source)),ri=nearest(receiver.position),f0=grid.maxFrequency/3,t0=3/f0+source.delayMs/1000;
  if(seconds<t0+2/f0)throw new Error(`Simulationsdauer muss den Quellpuls abdecken: mindestens ${(t0+2/f0).toFixed(3)} s wählen.`);
  let previous=new Float64Array(grid.positions.length),current=new Float64Array(grid.positions.length);const data=[],frames=[];const frameStride=Math.max(1,Math.ceil(steps/40));
  for(let n=0;n<steps;n++){
    const t=n*grid.dt,q=Math.PI*f0*(t-t0),pulse=(1-2*q*q)*Math.exp(-q*q)*source.polarity;
    const next=waveStep(grid,current,previous,si,pulse);previous=current;current=next;data.push([t,current[ri]]);if(n%frameStride===0)frames.push({timeMs:t*1000,values:Float32Array.from(current)});
  }
  const spectrum=[];for(let f=20;f<=grid.maxFrequency;f+=Math.max(1,1/seconds)){
    let re=0,im=0;for(const [t,p] of data){const w=.5-.5*Math.cos(2*Math.PI*t/seconds);re+=p*w*Math.cos(2*Math.PI*f*t);im-=p*w*Math.sin(2*Math.PI*f*t);}spectrum.push([f,Math.hypot(re,im)]);
  }
  const max=Math.max(...spectrum.map(p=>p[1]),1e-30);for(const row of spectrum)row[1]=20*Math.log10(Math.max(row[1]/max,1e-12));
  return {data,spectrum,frames,positions:grid.positions,cells:grid.positions.length,spacing:grid.spacing,dt:grid.dt,duration:seconds,frequencyResolution:1/seconds,maxFrequency:grid.maxFrequency,sourceCell:grid.positions[si],receiverCell:grid.positions[ri],sourcePulse:{kind:'Ricker',f0,centreSeconds:t0},evidence:'SIMULATED',assumptions:grid.assumptions,geometryFingerprint:geometrySummary(project).volume};
}
