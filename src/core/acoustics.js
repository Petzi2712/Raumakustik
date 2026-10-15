import {boundarySurfaces,geometrySummary,acousticPosition,containsPoint,usablePoint,pointOnSurface,visible,add,sub,mul,dot,norm} from './geometry.js';
import { SURFACES, bandValue } from './project.js';
export const distance = (a, b) => Math.hypot(...a.map((v, i) => v-b[i]));
// Dry-air approximation. Humidity and pressure are stored, not applied in v0.1.
export const soundSpeed = temperature => 331.3 * Math.sqrt(1 + temperature / 273.15);
export function modalPressure(mode, position, dimensions) {
  return mode.indices.reduce((v, n, i) => v * Math.cos(Math.PI*n*position[i]/dimensions[i]), 1);
}
export function roomModes(dimensions, c, maxHz, source, receiver) {
  const limits = dimensions.map(l => Math.floor(2 * maxHz * l / c));
  const result = [];
  for (let p=0; p<=limits[0]; p++) for (let q=0; q<=limits[1]; q++) for (let r=0; r<=limits[2]; r++) {
    const indices = [p,q,r];
    const count = indices.filter(Boolean).length;
    if (!count) continue;
    const frequency = c/2 * Math.hypot(...indices.map((n,i) => n/dimensions[i]));
    if (frequency > maxHz + 1e-9) continue;
    const mode = { indices, frequency, kind: ['','axial','tangential','oblique'][count], evidence: 'SIMULATED' };
    mode.coupling = source&&receiver?modalPressure(mode,source,dimensions) * modalPressure(mode,receiver,dimensions):null;
    result.push(mode);
  }
  return result.sort((a,b)=>a.frequency-b.frequency);
}
export function reverberation(room, frequency) {
  if(room.zones){
    const project={room,sources:[],receivers:[],objects:[]},summary=geometrySummary(project);
    const absorptionArea=boundarySurfaces(project,false).reduce((sum,s)=>sum+s.area*bandValue(s.material.absorption,frequency),0);
    const t60=summary.volume && !summary.unmatchedOpenings.length && absorptionArea>0?.161*summary.volume/absorptionArea:null;
    return {volume:summary.volume,absorptionArea,t60,schroeder:t60?2000*Math.sqrt(t60/summary.volume):null,evidence:'SIMULATED',notes:summary.warnings};
  }
  const [x,y,z] = room.dimensions;
  const areas = [y*z,y*z,x*z,x*z,x*y,x*y];
  const absorptionArea = SURFACES.reduce((a,s,i) => a + areas[i]*bandValue(room.surfaces[s.id].absorption,frequency),0);
  const volume=x*y*z;
  const t60=absorptionArea > 0 ? 0.161*volume/absorptionArea : null;
  return { volume, absorptionArea, t60, schroeder: t60 ? 2000*Math.sqrt(t60/volume) : null, evidence: 'SIMULATED' };
}
function reflect(point, surface, dimensions) {
  const p = [...point];
  p[surface.axis] = 2 * surface.side * dimensions[surface.axis] - p[surface.axis];
  return p;
}
function reconstruct(source, receiver, sequence, dimensions) {
  const images = [[...source]];
  for (const s of sequence) images.push(reflect(images.at(-1),s,dimensions));
  let end=[...receiver];
  const reversed=[];
  for (let i=sequence.length-1; i>=0; i--) {
    const s=sequence[i], image=images[i+1], plane=s.side*dimensions[s.axis];
    const denom=image[s.axis]-end[s.axis];
    if (Math.abs(denom)<1e-10) return null;
    const t=(plane-end[s.axis])/denom;
    if (t<=1e-8 || t>=1-1e-8) return null;
    const hit=end.map((v,k)=>v+t*(image[k]-v));
    if (hit.some((v,k)=>v < -1e-7 || v > dimensions[k]+1e-7)) return null;
    reversed.push(hit); end=hit;
  }
  return [source,...reversed.reverse(),receiver];
}
export function reflectionPaths(project, source, receiver, frequency, order=project.analysisSettings?.reflectionOrder??2) {
  if(project.room.zones || project.objects?.some(o=>o.acoustic!==false) || source.acousticCenter?.some(Boolean))return generalReflectionPaths(project,source,receiver,frequency,order);
  const c=soundSpeed(project.room.temperature), dims=project.room.dimensions;
  const directDistance=distance(source.position,receiver.position);
  if (directDistance < 0.01) throw new Error('Quelle und Empfänger müssen mindestens 1 cm Abstand haben.');
  const sequences=[[]];
  const expand=seq=>{if(seq.length>=Math.min(4,order))return;for(const surface of SURFACES)if(surface.id!==seq.at(-1)?.id){const next=[...seq,surface];sequences.push(next);expand(next);}};expand([]);
  const result=[];
  for(const seq of sequences) {
    const points=reconstruct(source.position,receiver.position,seq,dims);
    if (!points) continue;
    const length=points.slice(1).reduce((n,p,i)=>n+distance(points[i],p),0);
    const delta=length-directDistance;
    let pressure=directDistance/length;
    const incidence=[];
    for(let i=0;i<seq.length;i++) {
      const material=project.room.surfaces[seq[i].id];
      pressure*=Math.sqrt(Math.max(0,1-bandValue(material.absorption,frequency)-bandValue(material.transmission,frequency))) * Math.sqrt(1-bandValue(material.scattering,frequency));
      const before=points[i], hit=points[i+1];
      incidence.push(Math.acos(Math.min(1,Math.abs(hit[seq[i].axis]-before[seq[i].axis])/distance(hit,before)))*180/Math.PI);
    }
    result.push({ id: seq.map(s=>s.id).join('>') || 'direct', sourceId:source.id, receiverId:receiver.id,
      order:seq.length, surfaces:seq.map(s=>s.id), points, length, delta,
      arrivalMs:length/c*1000+source.delayMs, delayMs:delta/c*1000,
      relativeDb:pressure>0 ? 20*Math.log10(pressure) : -120, incidence,
      phaseDegrees: ((-360*frequency*(length/c+source.delayMs/1000)+(source.polarity===-1?180:0))%360+360)%360,
      firstNull: delta>1e-6 ? c/(2*delta) : null, evidence:'SIMULATED',
    });
  }
  return result.sort((a,b)=>a.arrivalMs-b.arrivalMs);
}
export function matchReflections(peaks, paths, toleranceMs=0.5) {
  return peaks.map(peak => ({ ...peak, evidence:'INFERRED', candidates:paths.filter(p=>p.order>0 && Math.abs(p.delayMs-peak.delayMs)<=toleranceMs)
    .map(p=>({pathId:p.id, timeErrorMs:Math.abs(p.delayMs-peak.delayMs), confidenceLevel:'zeitlich passend',evidence:'INFERRED'}))
    .sort((a,b)=>a.timeErrorMs-b.timeErrorMs),
    explanation:'Nur Laufzeitvergleich; kein Nachweis einer räumlichen Reflexionsquelle. Übereinstimmung wird ausschließlich durch den Zeitfehler beschrieben, ohne Wahrscheinlichkeitswert.' }));
}
export function positionMap(project, source, modes) {
  const [x,y]=project.room.dimensions, z=project.receivers[0].position[2];
  const result=[];
  for(let i=1;i<20;i++) for(let j=1;j<20;j++) {
    const position=[x*i/20,y*j/20,z];
    if(distance(position,source.position)<0.3) continue;
    const energy=modes.reduce((a,m)=>a+(modalPressure(m,source.position,project.room.dimensions)*modalPressure(m,position,project.room.dimensions))**2,0)/Math.max(1,modes.length);
    result.push({position,score:energy});
  }
  return result; // Modal coupling only; not a predicted frequency-response quality.
}

export function airAbsorption(room,frequency){
  const t=room.temperature+273.15,tr=t/293.15,pr=room.pressure/101325;
  const h=room.humidity/100*Math.pow(10,-6.8346*Math.pow(273.16/t,1.261)+4.6151)/pr;
  const fo=pr*(24+4.04e4*h*(.02+h)/(.391+h));
  const fn=pr*Math.pow(tr,-.5)*(9+280*h*Math.exp(-4.17*(Math.pow(tr,-1/3)-1)));
  return 8.686*frequency*frequency*(1.84e-11/pr*Math.sqrt(tr)+Math.pow(tr,-2.5)*(.01275*Math.exp(-2239.1/t)/(fo+frequency*frequency/fo)+.1068*Math.exp(-3352/t)/(fn+frequency*frequency/fn)));
}
export function generalReflectionPaths(project,source,receiver,frequency,order=2){
  const summary=geometrySummary(project);if(summary.volume===null)throw new Error('Überlappende Raumzonen vor der Simulation korrigieren.');
  for(const zone of project.room.zones||[])if(zone.curveApproximation?.maxChordError>soundSpeed(project.room.temperature)/(12*frequency))throw new Error('Kurvenauflösung für diese Frequenz zu grob. Geometrie mit höherer Grenzfrequenz neu tessellieren.');
  const start=acousticPosition(source),end=receiver.position,c=soundSpeed(project.room.temperature);
  if(!usablePoint(project,start,0)||!usablePoint(project,end,0))throw new Error('Quelle oder Mikrofon liegt außerhalb des tatsächlichen Raumvolumens.');
  const directDistance=distance(start,end);if(directDistance<.01)throw new Error('Quelle und Empfänger müssen mindestens 1 cm Abstand haben.');
  const surfaces=boundarySurfaces(project),sequences=[[]],result=[],keys=new Set();
  const limit=reflectionOrderLimit(surfaces.length,order);
  const expand=seq=>{if(seq.length>=limit)return;for(const surface of surfaces)if(surface.boundaryId!==seq.at(-1)?.boundaryId){const next=[...seq,surface];sequences.push(next);expand(next);}};expand([]);
  for(const seq of sequences){
    const images=[start];for(const surface of seq){const p=images.at(-1);images.push(sub(p,mul(surface.normal,2*dot(sub(p,surface.points[0]),surface.normal))));}
    let target=end,invalid=false;const reverse=[];
    for(let i=seq.length-1;i>=0;i--){const s=seq[i],ray=sub(images[i+1],target),denom=dot(ray,s.normal);if(Math.abs(denom)<1e-9){invalid=true;break;}const t=dot(sub(s.points[0],target),s.normal)/denom;if(t<=1e-7||t>=1-1e-7){invalid=true;break;}const hit=add(target,mul(ray,t));if(!pointOnSurface(hit,s)){invalid=true;break;}reverse.push(hit);target=hit;}
    if(invalid)continue;
    const points=[start,...reverse.reverse(),end];
    if(seq.some((surface,i)=>dot(sub(points[i],points[i+1]),surface.normal)<=1e-7||dot(sub(points[i+2],points[i+1]),surface.normal)<=1e-7))continue;
    if(points.slice(1).some((b,i)=>!visible(points[i],b,surfaces,project.room)))continue;
    const signature=points.map(p=>p.map(v=>v.toFixed(5)).join(',')).join(';');if(keys.has(signature))continue;keys.add(signature);
    const pathLength=points.slice(1).reduce((sum,b,i)=>sum+distance(points[i],b),0),delta=pathLength-directDistance;
    let pressure=directDistance/pathLength*Math.pow(10,-airAbsorption(project.room,frequency)*delta/20);
    const incidence=[];for(let i=0;i<seq.length;i++){const s=seq[i],m=s.material;pressure*=Math.sqrt(Math.max(0,1-bandValue(m.absorption,frequency)-bandValue(m.transmission,frequency)))*Math.sqrt(1-bandValue(m.scattering,frequency));incidence.push(Math.acos(Math.min(1,Math.abs(dot(sub(points[i+1],points[i]),s.normal))/distance(points[i+1],points[i])))*180/Math.PI);}
    result.push({id:seq.map(s=>s.boundaryId).join('>')||'direct',sourceId:source.id,receiverId:receiver.id,order:seq.length,surfaces:seq.map(s=>s.boundaryId),points,length:pathLength,delta,arrivalMs:pathLength/c*1000+source.delayMs,delayMs:delta/c*1000,relativeDb:pressure>0?20*Math.log10(pressure):-120,incidence,phaseDegrees:((-360*frequency*(pathLength/c+source.delayMs/1000)+(source.polarity===-1?180:0))%360+360)%360,firstNull:delta>1e-6?c/(2*delta):null,evidence:'SIMULATED'});
  }return result.sort((a,b)=>a.arrivalMs-b.arrivalMs);
}

export function reflectionOrderLimit(surfaceCount,requested=2){
  let order=Math.min(4,requested);if(surfaceCount>96)order=1;
  const count=o=>Array.from({length:o},(_,i)=>surfaceCount*Math.max(1,surfaceCount-1)**i).reduce((a,b)=>a+b,0);
  while(order>1&&count(order)>20000)order--;return order;
}
