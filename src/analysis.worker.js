import {correlateReflections} from './core/reflectionMatching.js';
import {isRectangular,roomBounds,acousticPosition,sub,geometrySummary,boundarySurfaces} from './core/geometry.js';
import {soundSpeed,roomModes,reflectionPaths,reverberation,matchReflections,reflectionOrderLimit} from './core/acoustics.js';
import {impulseMetrics,frequencyMetrics,impulseSpectrogram} from './core/measurement.js';
self.onmessage=({data:{project,sourceId,receiverId,frequency,measurementId}})=>{
  try{
    const source=project.sources.find(s=>s.id===sourceId)||project.sources[0],receiver=project.receivers.find(r=>r.id===receiverId)||project.receivers[0];
    const c=soundSpeed(project.room.temperature),paths=source&&receiver?reflectionPaths(project,source,receiver,frequency):[];
    const m=project.measurements.find(m=>m.id===measurementId);
    const metrics=m?.kind==='impulse'?impulseMetrics(m):null;
    const matches=metrics && m.metadata?.sourceId===source?.id && m.metadata?.receiverId===receiver?.id && !m.metadata.geometryStale ? correlateReflections(project,m,paths,frequency,metrics) : [];
    if(metrics)metrics.decay=metrics.decay.filter((_,i)=>i%Math.max(1,Math.ceil(metrics.decay.length/1400))===0);
    const b=roomBounds(project.room),rectangular=isRectangular(project.room)&&!project.objects.some(o=>o.acoustic!==false);
    self.postMessage({measurementId,c,paths,geometry:geometrySummary(project),orderLimit:reflectionOrderLimit(boundarySurfaces(project).length,project.analysisSettings?.reflectionOrder??2),modes:rectangular?roomModes(b.max.map((v,i)=>v-b.min[i]),c,200,source?sub(acousticPosition(source),b.min):undefined,receiver?sub(receiver.position,b.min):undefined).map(m=>({...m,origin:b.min,dimensions:b.max.map((v,i)=>v-b.min[i])})):[],reverb:reverberation(project.room,frequency),metrics,matches,spectrogram:m?.kind==='impulse'?impulseSpectrogram(m):null,phase:m?frequencyMetrics(m):null});
  }catch(e){self.postMessage({error:e.message});}
};
