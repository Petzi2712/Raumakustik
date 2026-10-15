import {geometrySummary,roomZones,interiorPoint,verticalLimits,usablePoint,segmentDistance,length,geometryFingerprint,fingerprint,measurementFingerprint,acousticPosition,signedArea} from './geometry.js';
export const PLAN_PROFILES={quick:{label:'A · Schnellanalyse',base:3,levels:1,repeats:1},standard:{label:'B · Standardanalyse',base:9,levels:1,repeats:1},extended:{label:'C · Erweiterte Analyse',base:21,levels:3,repeats:1},professional:{label:'D · Professionelle Analyse',base:27,levels:3,repeats:3}};
export const TASK_STATUS={pending:'Nicht gemessen',ready:'Bereit',running:'Messung läuft',complete:'Abgeschlossen',error:'Fehler',repeat:'Wiederholen',quality:'Qualitätsprüfung erforderlich'};
export function defaultPlanConfig(project){return {profile:'standard',goal:'listening',system:'Stereo',sourceIds:project.sources.map(s=>s.id),seatIds:(project.listeningPositions||[]).map(s=>s.id),spacing:.2,clearance:.1,heightOffset:.25,arrangement:'grid',states:['IST'],repeats:1,minHz:20,maxHz:20000,microphone:'',timing:'',setup:'',equipment:'',accuracy:'standard'};}
export function pointReferences(project,point){
  const distances=[];
  for(const z of roomZones(project.room).filter(z=>{const h=verticalLimits(z,point.position);return h&&point.position[2]>=h.floor&&point.position[2]<=h.ceiling;}))for(let i=0;i<z.vertices.length;i++){
    const a=z.vertices[i],b=z.vertices[(i+1)%z.vertices.length];distances.push({wallId:z.edges[i].id,distance:segmentDistance(point.position.slice(0,2),[a.x,a.y],[b.x,b.y]),a:[a.x,a.y],b:[b.x,b.y]});
  }distances.sort((a,b)=>a.distance-b.distance);
  const first=distances[0],second=distances.find(d=>first&&Math.abs((first.b[0]-first.a[0])*(d.b[1]-d.a[1])-(first.b[1]-first.a[1])*(d.b[0]-d.a[0]))>1e-6)||distances[1];
  const neighbors=(project.measurementPlan?.points||[]).filter(p=>p.id!==point.id).map(p=>({id:p.id,label:p.label,distance:length(point.position,p.position)})).sort((a,b)=>a.distance-b.distance);
  return {references:[first,second].filter(Boolean),nearest:neighbors[0]||null,originDistance:Math.hypot(...point.position)};
}
export function planFingerprint(project,plan=project.measurementPlan){if(!plan)return '';return fingerprint({geometry:geometryFingerprint(project),sources:project.sources.filter(s=>plan.config.sourceIds.includes(s.id)),seats:(project.listeningPositions||[]).filter(s=>plan.config.seatIds.includes(s.id)),points:plan.points,config:plan.config,tasks:plan.tasks.map(t=>({id:t.id,sourceId:t.sourceId,pointId:t.pointId,state:t.state,repetition:t.repetition,enabled:t.enabled}))});}
export function planApproved(project){return Boolean(project.measurementPlan?.approval?.fingerprint===planFingerprint(project));}
export function generatePlan(project,config=defaultPlanConfig(project),id=crypto.randomUUID()){
  const selectedProfile=(config.goal==='validation'||config.accuracy==='high')&&['quick','standard'].includes(config.profile)?'extended':config.profile;
  const profile=PLAN_PROFILES[selectedProfile];if(!profile)throw new Error('Unbekanntes Messprofil.');
  if(!Number.isFinite(config.spacing)||config.spacing<.05||config.spacing>2||!Number.isFinite(config.clearance)||config.clearance<0||config.clearance>1||!Number.isFinite(config.heightOffset)||config.heightOffset<.05||config.heightOffset>1)throw new Error('Ungültige Punktabstände oder Messhöhen.');
  if(!config.sourceIds?.length||new Set(config.sourceIds).size!==config.sourceIds.length||config.sourceIds.some(id=>!project.sources.some(s=>s.id===id)))throw new Error('Mindestens einen gültigen Lautsprecher auswählen.');
  if(!Array.isArray(config.states)||!config.states.length||config.states.length>8||config.states.some(s=>typeof s!=='string'||!s.trim()||s.length>100)||new Set(config.states).size!==config.states.length)throw new Error('1–8 eindeutige Raumzustände erforderlich.');
  const repeats=config.profile==='professional'?Math.max(3,config.repeats):config.repeats;
  if(!Number.isInteger(repeats)||repeats<1||repeats>10)throw new Error('1–10 Wiederholungen.');
  if(!Number.isFinite(config.minHz)||!Number.isFinite(config.maxHz)||config.minHz<10||config.maxHz>96000||config.minHz>=config.maxHz)throw new Error('Frequenzbereich prüfen.');
  const summary=geometrySummary(project);if(summary.volume===null)throw new Error('Überlappende Zonen vor der Messplanung korrigieren.');
  const selected=(project.listeningPositions||[]).filter(s=>config.seatIds?.includes(s.id));
  if(!selected.length)throw new Error('Mindestens einen Hörplatz auswählen.');
  const points=[],reasons=[`${profile.label}: ${profile.base} vorgeschlagene Positionen pro primärem Hörbereich. Software-Startprofil, keine Normvorgabe.`,`${config.sourceIds.length} Quellen, ${config.states.length} Raumzustände, ${repeats} Wiederholung(en).`],rejected=[];
  const push=(p,role,zoneId)=>{
    if(points.some(q=>length(q.position,p)<.02))return;
    if(!usablePoint(project,p,config.clearance)||project.sources.some(s=>config.sourceIds.includes(s.id)&&length(acousticPosition(s),p)<.05)){rejected.push({position:p,reason:'Außerhalb des freien Raums, zu nah an Fläche/Quelle oder an einem Hindernis.'});return;}
    const n=points.length+1;points.push({id:`${id}-M${n}`,label:`M${String(n).padStart(2,'0')}`,name:role,group:zoneId,position:p});
  };
  for(const seat of selected){
    if(!usablePoint(project,seat.position,config.clearance))throw new Error(`${seat.name}: Hörplatz liegt außerhalb des nutzbaren Messvolumens. Hörplatz zuerst korrigieren.`);
    const countPerLevel=profile.base/profile.levels,levels=profile.levels===1?[0]:[0,-config.heightOffset,config.heightOffset];
    for(const dz of levels)for(let i=0;i<countPerLevel;i++){
      let dx=0,dy=0;
      if(i){
        if(config.arrangement==='circle'){const angle=(i-1)*2*Math.PI/(countPerLevel-1);dx=Math.cos(angle)*config.spacing;dy=Math.sin(angle)*config.spacing;}
        else if(config.arrangement==='cross'||config.profile==='quick'){const dirs=[[-1,0],[1,0],[0,-1],[0,1]],v=dirs[(i-1)%4],r=Math.ceil(i/4)*config.spacing;dx=v[0]*r;dy=v[1]*r;}
        else{const offsets=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[1,1],[-1,1]];const v=offsets[(i-1)%8];dx=v[0]*config.spacing;dy=v[1]*config.spacing;}
      }push([seat.position[0]+dx,seat.position[1]+dy,seat.position[2]+dz],`${seat.name}${i===0&&dz===0?' · Referenz':` · ΔZ ${dz.toFixed(2)} m`}`,seat.id);
    }
  }
  const zones=roomZones(project.room);
  for(const zone of zones){
    const primary=selected.some(s=>verticalLimits(zone,s.position));
    if(!primary){const p=interiorPoint({...project.room,zones:[zone]});push(p,`${zone.name} · zusätzliche Zone`,zone.id);push([p[0]+config.spacing,p[1],p[2]],`${zone.name} · Zonenvariation`,zone.id);push([p[0]-config.spacing,p[1],p[2]],`${zone.name} · Zonenvariation`,zone.id);reasons.push(`Zusätzliche Positionen für die getrennte/gekoppelte Zone „${zone.name}“.`);}
    const reflex=zone.vertices.filter((v,i,vs)=>{const a=vs[(i+vs.length-1)%vs.length],b=vs[(i+1)%vs.length];return ((v.x-a.x)*(b.y-v.y)-(v.y-a.y)*(b.x-v.x))*Math.sign(signedArea(vs.map(v=>[v.x,v.y])))<-1e-7;});
    if(reflex.length){const p=interiorPoint({...project.room,zones:[zone]});for(const v of reflex)push([(v.x+p[0])/2,(v.y+p[1])/2,p[2]],`${zone.name} · konkaver Bereich`,zone.id);reasons.push(`${reflex.length} einspringende Ecke(n): zusätzliche räumliche Stichproben; kein Beweis unabhängiger Information.`);}
  }
  if(summary.area>40){const extra=Math.min(12,Math.floor(summary.area/40)*2);const z=zones[0],p=interiorPoint(project.room);for(let i=0;i<extra;i++){const v=z.vertices[Math.floor(i*z.vertices.length/extra)];push([(p[0]+v.x)/2,(p[1]+v.y)/2,p[2]],'Zusatzpunkt für großen Hör-/Raumbereich',z.id);}reasons.push(`Grundfläche ${summary.area.toFixed(1)} m² >40 m²: ${extra} zusätzliche Kandidaten für räumliche Unterschiede.`);}
  if(summary.volume/summary.area>4 && profile.levels===1){const p=selected[0].position;push([p[0],p[1],p[2]+config.heightOffset],'Zusätzliche Höhe bei mittlerer Raumhöhe >4 m',selected[0].id);reasons.push('Großes Volumen je Grundfläche: zusätzliche Messhöhe.');}
  if(!points.length)throw new Error('Kein nutzbarer Messpunkt.');
  if(rejected.length)reasons.push(`${rejected.length} Kandidaten verworfen: Mindestabstand/Hindernisse. Fehlende Positionen vor Freigabe manuell ergänzen.`);
  if(selectedProfile!==config.profile)reasons.push('Modellvalidierung/hohe Genauigkeit: mindestens erweitertes Profil mit mehreren Höhen.');
  if(config.goal==='reflections')reasons.push('Reflexionszuordnung: räumlich getrennte Punkte und Wiederholungen zur Konsistenzprüfung verwenden.');
  const plan={id,createdAt:new Date().toISOString(),config:{...config,repeats},points,tasks:[],reasons,rejected,approval:null};
  rebuildTasks(plan);if(plan.tasks.length>20000)throw new Error('Messplan überschreitet 20.000 Sweeps.');return plan;
}
export function rebuildTasks(plan){
  const old=new Map((plan.tasks||[]).map(t=>[`${t.sourceId}|${t.pointId}|${t.state}|${t.repetition}`,t]));
  plan.tasks=[];
  for(const state of plan.config.states)for(const point of plan.points)for(const sourceId of plan.config.sourceIds)for(let repetition=1;repetition<=plan.config.repeats;repetition++){
    const key=`${sourceId}|${point.id}|${state}|${repetition}`;
    plan.tasks.push(old.get(key)||{id:`${plan.id}-${crypto.randomUUID()}`,sourceId,pointId:point.id,state,repetition,status:'pending',enabled:true,measurementIds:[]});
  }plan.approval=null;return plan;
}
export function installPlan(project,plan){
  if(project.measurementPlan){project.planHistory??=[];project.planHistory.push(structuredClone(project.measurementPlan));project.planHistory=project.planHistory.slice(-20);}
  project.measurementPlan=plan;
  for(const p of plan.points)if(!project.receivers.some(r=>r.id===p.id))project.receivers.push({id:p.id,name:`${p.label} · ${p.name}`,position:[...p.position],planId:plan.id});
  return project;
}
export function validatePlan(project){
  const plan=project.measurementPlan;if(!plan)throw new Error('Zuerst einen Messplan erstellen.');
  if(!plan.points.length||!plan.tasks.some(t=>t.enabled))throw new Error('Messplan enthält keine ausführbaren Sweeps.');
  for(const p of plan.points)if(!usablePoint(project,p.position,plan.config.clearance)||project.sources.some(s=>plan.config.sourceIds.includes(s.id)&&length(acousticPosition(s),p.position)<.05))throw new Error(`${p.label}: Kollision, Abstand oder Raumgrenze prüfen.`);
  return true;
}
export function approvePlan(project){validatePlan(project);const plan=project.measurementPlan;plan.approval={at:new Date().toISOString(),fingerprint:planFingerprint(project)};for(const t of plan.tasks)if(t.enabled&&t.status==='pending')t.status='ready';return plan;}
export function taskSummary(plan){const enabled=plan?.tasks.filter(t=>t.enabled)||[];return {microphones:new Set(enabled.map(t=>t.pointId)).size,sources:new Set(enabled.map(t=>t.sourceId)).size,sweeps:enabled.length,complete:enabled.filter(t=>t.status==='complete').length,repetitions:plan?.config.repeats||0,states:plan?.config.states.length||0};}
export function assignMeasurement(project,measurement,taskId){
  if(!planApproved(project))throw new Error('Messplan zuerst prüfen und freigeben.');
  const task=project.measurementPlan.tasks.find(t=>t.id===taskId&&t.enabled);if(!task)throw new Error('Eine geplante Messaufgabe auswählen.');
  const point=project.measurementPlan.points.find(p=>p.id===task.pointId);
  Object.assign(measurement.metadata,{sourceId:task.sourceId,receiverId:task.pointId,planId:project.measurementPlan.id,taskId:task.id,state:task.state,repetition:task.repetition,positionAtAcquisition:[...point.position],contextFingerprint:measurementFingerprint(project,task.sourceId,task.pointId),geometryStale:false});
  task.measurementIds=[...new Set([...task.measurementIds,measurement.id])];task.status='quality';return task;
}
