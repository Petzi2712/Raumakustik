import test from 'node:test';
import assert from 'node:assert/strict';
import {exampleProject as defaultProject,validateProject,parseProject,updateProvenance} from '../src/core/project.js';
import {geometryPreset,geometrySummary,boundarySurfaces,containsPoint,visible,insideObject,zoneFromPoints,triangulate,roomBounds,measurementFingerprint,isRectangular,sub,dot,unit} from '../src/core/geometry.js';
import {reflectionPaths,soundSpeed,airAbsorption} from '../src/core/acoustics.js';
import {defaultPlanConfig,generatePlan,installPlan,approvePlan,planApproved,taskSummary,assignMeasurement,rebuildTasks,pointReferences} from '../src/core/planning.js';
import {makeWaveGrid,waveStep,simulateWave} from '../src/core/wave.js';
import {planCsv,planSvg,reportHtml} from '../src/core/exports.js';
import {executeAcousticTool} from '../src/core/tools.js';
import {scenarioCopy,compareScenarios} from '../src/core/scenarios.js';
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
function room(kind='rectangle',dims=[4,6,3]){const p=defaultProject();p.room.dimensions=dims;p.room.zones=[geometryPreset(kind,dims)];return p;}
test('Boundary-Modell: analytische Quaderfläche, Volumen und 2D/3D-Bounds',()=>{
  const p=room(),s=geometrySummary(p);near(s.volume,72);near(s.area,24);near(s.surfaceArea,108);assert.deepEqual(roomBounds(p.room),{min:[0,0,0],max:[4,6,3]});assert.equal(isRectangular(p.room),true);
});
test('L-, U- und T-Grundrisse: echte konkave Volumina statt Bounding Box',()=>{
  for(const [kind,area] of [['L',18.06],['U',18.24],['T',13.08]]){const p=room(kind);near(geometrySummary(p).volume,area*3);assert.equal(isRectangular(p.room),false);}
  const p=room('L');assert.equal(containsPoint(p.room,[3.5,5,1]),false);assert.equal(containsPoint(p.room,[1,5,1]),true);
});
test('Nische, Dachschräge und variabler Boden: integrierte Höhen und Flächen',()=>{
  near(geometrySummary(room('niche')).volume,68.4);near(geometrySummary(room('roof')).volume,72*.775);near(geometrySummary(room('levels')).volume,24*2.8);
  assert.equal(containsPoint(room('roof').room,[.1,1,2.9]),false);assert.equal(containsPoint(room('levels').room,[3.9,1,.1]),false);
});
test('Runde/elliptische Räume: Polygonfläche und frequenzabhängige Sehnenauflösung',()=>{
  const p=room('circle');const n=p.room.zones[0].vertices.length;near(geometrySummary(p).volume,n*4*Math.sin(2*Math.PI/n)/2*3);
  const a=geometryPreset('ellipse',[6,8,3],200),b=geometryPreset('ellipse',[6,8,3],20000);assert.ok(b.vertices.length>a.vertices.length);assert.ok(b.curveApproximation.maxChordError<343/(12*20000)+1e-8);
});
test('Ungültige, selbstschneidende und doppelte Polygonpunkte werden abgelehnt',()=>{
  assert.throws(()=>triangulate([[0,0],[4,4],[0,4],[4,0]]));const p=room();p.room.zones[0].vertices[1].ceiling=-1;assert.throws(()=>validateProject(p),/Höhe/);
});
test('Offener Durchgang reflektiert nicht; die übrige Wand bleibt ein Hindernis',()=>{
  const p=room();p.room.zones[0].edges[0].opening={start:.25,end:.75,bottom:0,top:2,open:true};validateProject(p);
  const surfaces=boundarySurfaces(p);assert.equal(visible([2,1,1],[2,-1,1],surfaces),true);assert.equal(visible([.2,1,1],[.2,-1,1],surfaces),false);assert.equal(geometrySummary(p).openings.length,1);assert.throws(()=>makeWaveGrid(p),/Durchgänge/);
});
test('Rotierte Box: Geometrie, Kollision und Sichtbarkeit sind konsistent',()=>{
  const p=room();const o={id:'box',name:'Schrank',position:[2,3,1.5],size:[1,1,3],rotation:45,acoustic:true};p.objects=[o];assert.equal(insideObject(o,[2,3,1]),true);assert.equal(visible([2,1,1],[2,5,1],boundarySurfaces(p),p.room),false);o.acoustic=false;assert.equal(visible([2,1,1],[2,5,1],boundarySurfaces(p),p.room),true);
});
test('Allgemeines ISM stimmt mit analytischem Frontwandpfad überein und erfüllt Reflexionsgesetz',()=>{
  const p=room();const source={id:'s',position:[2,1,1.5],delayMs:0,polarity:1},receiver={id:'r',position:[2,4,1.5]};const paths=reflectionPaths(p,source,receiver,1000);
  near(paths.find(p=>p.order===0).length,3);const front=paths.find(p=>p.order===1&&Math.abs(p.points[1][1])<1e-8);near(front.length,5);
  const surfaces=boundarySurfaces(p);for(const ray of paths)for(let i=0;i<ray.surfaces.length;i++){const face=surfaces.find(s=>s.boundaryId===ray.surfaces[i]);const a=unit(sub(ray.points[i+1],ray.points[i])),b=unit(sub(ray.points[i+2],ray.points[i+1]));near(dot(a,face.normal),-dot(b,face.normal),1e-6);}
});
test('L-Raum: abgeschatteter Direktschall darf nicht durch eine imaginäre Raumhülle laufen',()=>{
  const p=room('L'),s={id:'s',position:[3.5,1,1],delayMs:0,polarity:1},r={id:'r',position:[1,5,1]};assert.equal(reflectionPaths(p,s,r,500).some(p=>p.order===0),false);
});
test('Luftabsorption: plausible ISO-9613-Näherung, positive frequenzabhängige Dämpfung',()=>{const p=defaultProject();assert.ok(airAbsorption(p.room,1000)>.002&&airAbsorption(p.room,1000)<.01);assert.ok(airAbsorption(p.room,8000)>airAbsorption(p.room,1000));});
test('Schema-1-Migration erhält Messdaten und importiert ohne Dateiveränderung',()=>{
  const legacy=defaultProject();legacy.schemaVersion=1;delete legacy.objects;delete legacy.scenarios;delete legacy.planHistory;delete legacy.listeningPositions;
  legacy.measurements=[{id:'legacy',name:'Bestand',kind:'frequency',data:[[20,80],[30,81]],metadata:{sourceId:'L',receiverId:'M1'}}];const original=JSON.stringify(legacy),p=parseProject(original);assert.equal(p.schemaVersion,2);assert.deepEqual(p.measurements[0].data,legacy.measurements[0].data);assert.equal(p.measurements[0].metadata.legacy,true);assert.equal(JSON.stringify(legacy),original);
});
test('Standardplan: neun Positionen und genau 18 Sweeps; deaktivierte Kombinationen zählen nicht',()=>{
  const p=defaultProject(),plan=generatePlan(p,defaultPlanConfig(p),'plan');installPlan(p,plan);assert.equal(plan.points.length,9);assert.equal(taskSummary(plan).sweeps,18);plan.tasks[0].enabled=false;assert.equal(taskSummary(plan).sweeps,17);approvePlan(p);assert.equal(planApproved(p),true);validateProject(p);
});
test('Professioneller Plan zählt Zustände und echte Wiederholungen getrennt',()=>{
  const p=defaultProject(),config={...defaultPlanConfig(p),profile:'professional',states:['IST','SOLL']},plan=generatePlan(p,config);assert.equal(plan.points.length,27);assert.equal(taskSummary(plan).sweeps,27*2*2*3);
});
test('Punktverschiebung aktualisiert Referenzen und entzieht Freigabe; Kollision verhindert Freigabe',()=>{
  const p=defaultProject();installPlan(p,generatePlan(p,defaultPlanConfig(p)));approvePlan(p);const point=p.measurementPlan.points[0],old=pointReferences(p,point);point.position[0]+=.1;assert.equal(planApproved(p),false);const next=pointReferences(p,point);assert.notEqual(next.references[0].distance,old.references[0].distance);point.position[0]=100;assert.throws(()=>approvePlan(p),/Kollision/);
});
test('Import erfordert freigegebenen Plan; Aufnahme-Fingerprint wird bei Raumänderung veraltet',()=>{
  const p=defaultProject(),m={id:'m',name:'Messung',kind:'frequency',data:[[20,80],[40,81]],metadata:{}};
  assert.throws(()=>assignMeasurement(p,m,'x'),/Messplan/);installPlan(p,generatePlan(p,defaultPlanConfig(p)));approvePlan(p);assignMeasurement(p,m,p.measurementPlan.tasks[0].id);p.measurements.push(m);assert.equal(m.metadata.geometryStale,false);
  const next=structuredClone(p);next.room.dimensions[0]+=.1;updateProvenance(p,next);assert.equal(next.measurements[0].metadata.geometryStale,true);assert.equal(planApproved(next),false);assert.deepEqual(next.measurements[0].data,m.data);
});
test('Sweeps behalten Status bei Ergänzung und besitzen eindeutige IDs',()=>{
  const p=defaultProject(),plan=generatePlan(p,defaultPlanConfig(p));plan.tasks[0].status='complete';plan.points.push({id:'extra',label:'M10',name:'Manuell',position:[1,1,1]});rebuildTasks(plan);assert.equal(plan.tasks[0].status,'complete');assert.equal(new Set(plan.tasks.map(t=>t.id)).size,plan.tasks.length);
});
test('Planexporte enthalten echte Maße, Sweepdaten und gegen HTML-Injektion geschützte Namen',()=>{
  const p=defaultProject();p.name='<script>bad()</script>';installPlan(p,generatePlan(p,defaultPlanConfig(p)));const csv=planCsv(p),svg=planSvg(p),html=reportHtml(p,null,{planOnly:true});assert.match(csv,/M01/);assert.match(svg,/Maßstab 1:/);assert.match(html,/18 geplante Sweeps/);assert.ok(!html.includes('<script>bad()'));assert.match(html,/&lt;script&gt;/);
});
test('FDTD: starres Quader-Eigenfeld folgt diskreter Wellendispersion und physikalischer Eigenfrequenz',()=>{
  const p=room('rectangle',[2,2,2]),grid=makeWaveGrid(p,{maxFrequency:100}),nx=grid.counts[0],h=grid.spacing[0];
  const omega=2/grid.dt*Math.asin(grid.c*grid.dt/h*Math.sin(Math.PI/(2*nx)));assert.ok(Math.abs(omega/(2*Math.PI)-grid.c/4)/(grid.c/4)<.02);
  const initial=Float64Array.from(grid.positions,p=>Math.cos(Math.PI*p[0]/2));let current=initial,previous=Float64Array.from(initial,v=>v*Math.cos(omega*grid.dt));
  for(let n=1;n<=100;n++){const next=waveStep(grid,current,previous);previous=current;current=next;}
  for(let i=0;i<current.length;i++)near(current[i],initial[i]*Math.cos(omega*grid.dt*100),1e-9);
});
test('FDTD in L-Raum ist endlich, begrenzt und verwendet keine Rechteck-Moden',()=>{
  const p=room('L',[3,4,2.5]);p.sources[0].position=[.7,.7,1];p.receivers[0].position=[.7,3,1];const q=simulateWave(p,p.sources[0],p.receivers[0],{maxFrequency:80,seconds:.25});assert.equal(typeof q.geometryFingerprint,'string');assert.match(q.geometryFingerprint,/^[a-f0-9]{8}$/);assert.ok(q.data.length>10);assert.ok(q.data.every(r=>r.every(Number.isFinite)));assert.equal(executeAcousticTool(p,'calculate_room_modes').available,false);assert.throws(()=>makeWaveGrid(p,{maxFrequency:300,maxCells:10}),/Zellen/);
});
test('KI-Werkzeuge ändern niemals Originalprojekt; unbekannte Materialwerte werden abgelehnt',()=>{
  const p=defaultProject(),before=JSON.stringify(p),result=executeAcousticTool(p,'simulate_object_movement',{entity:'source',id:'L',position:[1.4,1.1,1.2]});assert.equal(JSON.stringify(p),before);assert.equal(result.requiresUserApproval,true);assert.equal(result.proposal.acceptedByUser,false);assert.equal(result.proposal.model.sources[0].position[0],1.4);
  assert.throws(()=>executeAcousticTool(p,'simulate_acoustic_treatment',{surfaceId:'front',absorption:[.9,.9,.9,.9,.9,.9],dataSource:'Erfundene Laborprüfung'}),/nicht.*dokumentiert/);
  assert.throws(()=>executeAcousticTool(p,'write_file',{}),/Unbekanntes/);
});
test('Szenario-Kopie und Vergleich erhalten Baseline und Messungen',()=>{
  const p=defaultProject(),s=scenarioCopy(p);s.model.sources[0].position[0]+=.2;const result=compareScenarios(p,s.model,'L','M1',125);assert.equal(p.sources[0].position[0],1.2);assert.equal(result.evidence,'SIMULATED');assert.ok(result.difference.some(p=>p.deltaDb!==0));assert.equal(s.model.measurements.length,0);
});
test('Kreisbogen: Radius, Mittelpunkt und frequenzabhängiger Sehnenfehler sind konsistent',async()=>{
  const {arcPoints}=await import('../src/core/geometry.js');const a={x:0,y:0,floor:0,ceiling:3},b={x:4,y:0,floor:0,ceiling:3},arc=arcPoints(a,b,3,{frequency:20000});assert.ok(arc.points.length>5);for(const p of arc.points)near(Math.hypot(p.x-arc.center[0],p.y-arc.center[1]),3);assert.ok(arc.maxChordError<=343/(12*20000));assert.throws(()=>arcPoints(a,b,1),/radius/i);
});
test('Geometrieprüfung erkennt schmale Zonenüberlappungen und getrennte Höhen',()=>{
  const p=room();p.room.zones.push(zoneFromPoints([[3.9,0],[5,0],[5,6],[3.9,6]],3,'z2'));assert.equal(geometrySummary(p).volume,null);
  const q=room();const z=zoneFromPoints([[0,0],[4,0],[4,6],[0,6]],6,'z2');z.vertices.forEach(v=>v.floor=3);q.room.zones.push(z);near(geometrySummary(q).volume,144);
});
test('Höhere Reflexionsordnung bleibt geometrisch gültig und budgetbegrenzt',()=>{const p=defaultProject();p.analysisSettings.reflectionOrder=3;const paths=reflectionPaths(p,p.sources[0],p.receivers[0],1000);assert.ok(paths.some(p=>p.order===3));assert.ok(paths.every(p=>p.delayMs>=-1e-8));});
test('STFT: Frequenz einer synthetischen IR-Schwingung liegt im erwarteten FFT-Bin',async()=>{
  const {impulseSpectrogram}=await import('../src/core/measurement.js');const fs=8000,m={kind:'impulse',sampleRate:fs,data:Array.from({length:8192},(_,i)=>[i/fs,Math.sin(2*Math.PI*1000*i/fs)*Math.exp(-i/fs)])};const s=impulseSpectrogram(m);const peak=s.frames[0].values.indexOf(Math.max(...s.frames[0].values));assert.ok(s.bands[peak].lowHz<=1000&&s.bands[peak].highHz>=1000);assert.equal(s.frequencyResolution,fs/4096);assert.ok(s.frames.every(f=>f.values.every(Number.isFinite)));
});
test('Gekoppelte Zonen: gepaarte Öffnung überträgt direkten Schall und ist kein Außenrand',()=>{
  const p=room('rectangle',[4,6,3]),z=zoneFromPoints([[4,0],[8,0],[8,6],[4,6]],3,'z2');p.room.zones.push(z);
  p.room.zones[0].edges[1].opening={start:.3,end:.7,bottom:0,top:2,open:true};z.edges[3].opening={start:.3,end:.7,bottom:0,top:2,open:true};
  const summary=geometrySummary(p);near(summary.volume,144);assert.equal(summary.unmatchedOpenings.length,0);assert.equal(summary.connectedPortals.length,1);
  const source={id:'s',position:[2,3,1],delayMs:0,polarity:1},receiver={id:'r',position:[6,3,1]};assert.ok(reflectionPaths(p,source,receiver,100).some(p=>p.order===0));assert.ok(makeWaveGrid(p,{maxFrequency:60}).positions.length>0);
});
test('Mehrpunkt-Reflexionsabgleich bleibt eine qualitative Hypothese mit messbarer Konsistenz',async()=>{
  const {correlateReflections}=await import('../src/core/reflectionMatching.js');const p=defaultProject();p.receivers.push({id:'M2',name:'Zusatzpunkt',position:[2.6,3.7,1.2]});const source=p.sources[0],path1=reflectionPaths(p,source,p.receivers[0],1000).find(q=>q.id==='front'),path2=reflectionPaths(p,source,p.receivers[1],1000).find(q=>q.id==='front');
  const m=(id,receiverId,delayMs)=>({id,name:id,kind:'impulse',sampleRate:48000,data:Array.from({length:2400},(_,i)=>[i/48000,i===0?1:i===Math.round(delayMs*48)?.5:0]),metadata:{sourceId:'L',receiverId,state:'IST',timingReference:true}});
  const a=m('a','M1',path1.delayMs),b=m('b','M2',path2.delayMs);p.measurements=[a,b];const result=correlateReflections(p,a,reflectionPaths(p,source,p.receivers[0],1000),1000);const candidate=result.flatMap(p=>p.candidates).find(c=>c.pathId==='front');assert.equal(candidate.consistentPositions,2);assert.equal(candidate.support[0].receiverId,'M2');assert.equal('confidence' in candidate,false);
});
