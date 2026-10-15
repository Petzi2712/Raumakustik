import {reflectionPaths,reverberation,soundSpeed,roomModes} from './acoustics.js';
import {geometryFingerprint,isRectangular,roomBounds,acousticPosition,sub,usablePoint} from './geometry.js';
import {validateProject} from './project.js';
export function scenarioCopy(project,name='Neues Szenario'){
  const model=structuredClone(project);model.scenarios=[];model.planHistory=[];model.measurements=[];delete model.measurementPlan;
  return {id:crypto.randomUUID(),name,createdAt:new Date().toISOString(),baselineFingerprint:geometryFingerprint(project),baselineModel:{room:structuredClone(project.room),objects:structuredClone(project.objects),sources:structuredClone(project.sources),receivers:structuredClone(project.receivers)},model,description:'Geometrische Modellprognose; keine gemessene Verbesserung.',acceptedByUser:true};
}
export function scenarioAnalysis(project,sourceId,receiverId,frequency=125){
  const source=project.sources.find(s=>s.id===sourceId)||project.sources[0],receiver=project.receivers.find(s=>s.id===receiverId)||project.receivers[0],paths=reflectionPaths(project,source,receiver,frequency),b=roomBounds(project.room);
  return {frequency,sourceId:source.id,receiverId:receiver.id,paths,reverberation:reverberation(project.room,frequency),modes:isRectangular(project.room)&&!project.objects.some(o=>o.acoustic!==false)?roomModes(b.max.map((v,i)=>v-b.min[i]),soundSpeed(project.room.temperature),150,sub(acousticPosition(source),b.min),sub(receiver.position,b.min)):[],evidence:'SIMULATED',limits:'Identische Analysefrequenz und Positions-IDs; keine vollständige Frequenzgang-, ETC- oder Decay-Prognose. Starre Eigenmoden besitzen keine materialabhängigen Q-Faktoren.'};
}
export function compareScenarios(before,after,sourceId,receiverId,frequency){
  const a=scenarioAnalysis(before,sourceId,receiverId,frequency),b=scenarioAnalysis(after,sourceId,receiverId,frequency),map=new Map(a.paths.map(p=>[p.id,p]));
  return {before:a,after:b,difference:b.paths.map(p=>({id:p.id,beforeDb:map.get(p.id)?.relativeDb??null,afterDb:p.relativeDb,deltaDb:map.has(p.id)?p.relativeDb-map.get(p.id).relativeDb:null,beforeDelayMs:map.get(p.id)?.delayMs??null,afterDelayMs:p.delayMs})),evidence:'SIMULATED',note:'Differenzen sind nur Änderungen des Modells; keine bereits gemessene Verbesserung.'};
}
export function movementProposal(project,{entity='source',id,position,name}){
  if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))throw new Error('Drei endliche Positionskoordinaten erforderlich.');
  const scenario=scenarioCopy(project,name||'KI-Vorschlag: Positionsänderung'),list=entity==='source'?scenario.model.sources:entity==='receiver'?scenario.model.receivers:entity==='object'?scenario.model.objects:null;
  const item=list?.find(v=>v.id===id);if(!item)throw new Error('Unbekannte Entität.');
  item.position=[...position];if(!usablePoint(scenario.model,position,entity==='object'?0:.01))throw new Error('Vorgeschlagene Position liegt außerhalb des freien Raums.');
  scenario.acceptedByUser=false;scenario.description=`Vorschlag: ${item.name} auf ${position.join(' / ')} m. Erst nach Benutzerfreigabe als separates Szenario übernehmen.`;validateProject(scenario.model);return scenario;
}
