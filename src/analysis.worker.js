import {soundSpeed,roomModes,reflectionPaths,reverberation,matchReflections} from './core/acoustics.js';
import {impulseMetrics,frequencyMetrics} from './core/measurement.js';
self.onmessage=({data:{project,sourceId,receiverId,frequency,measurementId}})=>{
  try{
    const source=project.sources.find(s=>s.id===sourceId)||project.sources[0],receiver=project.receivers.find(r=>r.id===receiverId)||project.receivers[0];
    const c=soundSpeed(project.room.temperature),paths=reflectionPaths(project,source,receiver,frequency);
    const m=project.measurements.find(m=>m.id===measurementId);
    const metrics=m?.kind==='impulse'?impulseMetrics(m):null;
    const matches=metrics && m.metadata?.sourceId===source.id && m.metadata?.receiverId===receiver.id ? matchReflections(metrics.peaks,paths) : [];
    if(metrics)metrics.decay=metrics.decay.filter((_,i)=>i%Math.max(1,Math.ceil(metrics.decay.length/1400))===0);
    self.postMessage({c,paths,modes:roomModes(project.room.dimensions,c,200,source.position,receiver.position),reverb:reverberation(project.room,frequency),metrics,matches,phase:m?frequencyMetrics(m):null});
  }catch(e){self.postMessage({error:e.message});}
};
