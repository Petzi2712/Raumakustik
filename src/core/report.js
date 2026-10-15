import {soundSpeed,roomModes,reflectionPaths,reverberation} from './acoustics.js';
import {measurementQuality} from './imports.js';
import {impulseMetrics} from './measurement.js';
import {geometrySummary,isRectangular,roomBounds,acousticPosition,sub,geometryFingerprint} from './geometry.js';
import {taskSummary,planApproved} from './planning.js';
import {correlateReflections} from './reflectionMatching.js';
import {analyzeProblems} from './problems.js';
export function reportObject(project,source,receiver,frequency){
  const c=soundSpeed(project.room.temperature),geometry=geometrySummary(project),bounds=roomBounds(project.room),paths=source?.id&&receiver?.id?reflectionPaths(project,source,receiver,frequency):[],rectangular=isRectangular(project.room)&&!project.objects.some(o=>o.acoustic!==false);
  const report={application:'Raumakustik Digital Twin 0.2',project:project.name,schemaVersion:2,geometryFingerprint:geometryFingerprint(project),
    coordinates:'Meter: X rechts, Y nach hinten, Z nach oben; globaler Projektursprung. Referenzabstände beziehen sich auf echte Wandsegmente.',room:project.room,geometry,objects:project.objects.map(o=>({...o,model:o.model?{format:o.model.format,visualOnly:true}:undefined})),source,receiver,frequency,
    measurementPlan:project.measurementPlan?{...project.measurementPlan,tasks:project.measurementPlan.tasks.slice(0,60),omittedTasks:Math.max(0,project.measurementPlan.tasks.length-60),summary:taskSummary(project.measurementPlan),approved:planApproved(project)}:null,
    calculated:{soundSpeed:c,assumptions:'Punktquellen, planare bzw. facettierte Oberflächen, spekulare Reflexionen bis zur gewählten Ordnung (maximal 4; adaptives Rechenbudget, bei >96 Teilflächen nur Ordnung 1), Sichtbarkeit und Boxhindernisse. Keine validierte Beugung, Fokussierung, diffuse Energiebilanz oder Materialphase. Sabine nur als Diffusfeld-Schätzung. Analytische Moden ausschließlich im ungestörten Quader.',
      reverberation:reverberation(project.room,frequency),modes:rectangular?roomModes(bounds.max.map((v,i)=>v-bounds.min[i]),c,150,source?.id?sub(acousticPosition(source),bounds.min):undefined,receiver?.id?sub(receiver.position,bounds.min):undefined).slice(0,60):[],paths},
    measurementCoverage:{total:project.measurements.length,included:Math.min(40,project.measurements.length),omitted:Math.max(0,project.measurements.length-40)},
    measured:project.measurements.slice(0,40).map(m=>({id:m.id,name:m.name,kind:m.kind,metadata:m.metadata,quality:measurementQuality(m,project),metrics:m.kind==='impulse'?(()=>{try{const q=impulseMetrics(m);return {...q,decay:undefined};}catch(e){return {error:e.message};}})():undefined,frequencySamples:m.kind==='frequency'?m.data.filter((_,i)=>i%Math.max(1,Math.ceil(m.data.length/150))===0):undefined})),
    savedAnalyses:(project.analysisResults||[]).map(r=>({...r,geometryStale:r.geometryFingerprint!==geometryFingerprint(project)})),
    simulationRuns:(project.simulationRuns||[]).map(r=>({...r,frames:undefined,positions:undefined})),
    instruction:'Trenne MEASURED, SIMULATED und INFERRED. Keine Wahrscheinlichkeitsprozente ohne Kalibrierung, keine erfundenen Materialwerte. Zeitliche Reflexionskandidaten sind mehrdeutig. Positionierung und physische Akustik vor EQ. Keine großen Boosts für destruktive Nullstellen. Änderungen nur als freizugebendes Szenario; Originalmessungen nicht überschreiben.'};
  const selected=project.measurements.find(m=>m.kind==='impulse'&&m.metadata.sourceId===source?.id&&m.metadata.receiverId===receiver?.id&&!m.metadata.geometryStale);
  if(selected)try{report.reflectionMatches=correlateReflections(project,selected,paths,frequency);}catch(e){report.reflectionMatchingError=e.message;}
  const problems=analyzeProblems(project,{paths});report.problems=problems.slice(0,100);report.omittedProblems=Math.max(0,problems.length-100);return report;
}
export function buildReport(project,source,receiver,frequency){return JSON.stringify(reportObject(project,source,receiver,frequency),null,2);}
export function buildToolContext(project){
  const p=structuredClone(project);p.scenarios=p.scenarios.slice(0,10).map(s=>({id:s.id,name:s.name,model:{...s.model,scenarios:[],measurements:[],planHistory:[]}}));p.planHistory=[];
  for(const s of p.scenarios)for(const o of s.model.objects)delete o.model;
  for(const o of p.objects)delete o.model;
  for(const m of p.measurements){if(m.kind==='impulse'){try{m.cachedMetrics={...impulseMetrics(m),decay:undefined};}catch(e){m.cachedMetrics={error:e.message};}m.data=[];}else m.data=m.data.filter((_,i)=>i%Math.max(1,Math.ceil(m.data.length/300))===0);}
  return JSON.stringify(p);
}
