import {matchReflections,reflectionPaths} from './acoustics.js';
import {impulseMetrics} from './measurement.js';
import {measurementFingerprint} from './geometry.js';
export function correlateReflections(project,measurement,paths,frequency,knownMetrics){
  const metrics=knownMetrics||impulseMetrics(measurement),matches=matchReflections(metrics.peaks,paths);
  const current=m=>!m.metadata.geometryStale&&(!m.metadata.contextFingerprint||m.metadata.contextFingerprint===measurementFingerprint(project,m.metadata.sourceId,m.metadata.receiverId));
  if(!current(measurement))return [];
  const source=project.sources.find(s=>s.id===measurement.metadata.sourceId);if(!source)return [];
  const other=project.measurements.filter(m=>m.id!==measurement.id&&m.kind==='impulse'&&current(m)&&m.metadata.sourceId===source.id&&m.metadata.receiverId!==measurement.metadata.receiverId&&m.metadata.state===measurement.metadata.state&&m.metadata.timingReference===true).slice(0,16);
  const evidence=[];
  if(measurement.metadata.timingReference===true)for(const m of other){const receiver=project.receivers.find(r=>r.id===m.metadata.receiverId);if(!receiver)continue;try{const q=impulseMetrics(m),predicted=reflectionPaths(project,source,receiver,frequency);evidence.push({measurementId:m.id,receiverId:receiver.id,peaks:q.peaks,paths:predicted});}catch{/* Bad or incompatible measurements do not become supporting evidence. */}}
  for(const match of matches)for(const candidate of match.candidates){
    candidate.support=[];
    for(const e of evidence){const prediction=e.paths.find(p=>p.id===candidate.pathId);if(!prediction)continue;const peak=e.peaks.find(p=>Math.abs(p.delayMs-prediction.delayMs)<=.5);if(peak)candidate.support.push({measurementId:e.measurementId,receiverId:e.receiverId,observedMs:peak.delayMs,predictedMs:prediction.delayMs,timeErrorMs:Math.abs(peak.delayMs-prediction.delayMs)});}
    const receivers=new Set([measurement.metadata.receiverId,...candidate.support.map(s=>s.receiverId)]);candidate.consistentPositions=receivers.size;candidate.confidenceLevel=receivers.size>1?`zeitlich konsistent an ${receivers.size} Positionen`:'nur ein zeitlich passender Kandidat';
  }
  for(const match of matches)match.explanation+=' Mehrpunktprüfung nutzt dokumentierte Timing-Referenzen und passende Aufnahmezustände. Pegel-/Spektralkonsistenz und Einfallsrichtung sind damit nicht bewiesen.';
  return matches;
}
