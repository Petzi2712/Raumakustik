import {geometrySummary,isRectangular,roomBounds,acousticPosition,sub} from './geometry.js';
import {reflectionPaths,roomModes,soundSpeed} from './acoustics.js';
import {taskSummary} from './planning.js';
import {analyzeProblems} from './problems.js';
import {scenarioAnalysis,movementProposal,compareScenarios,scenarioCopy} from './scenarios.js';
const definition=(name,description,properties={},required=[])=>({type:'function',name,description,parameters:{type:'object',properties,required,additionalProperties:false},strict:false});
const str={type:'string'},num={type:'number'},position={type:'array',items:num,minItems:3,maxItems:3};
export const ACOUSTIC_TOOLS=[
  definition('get_room_geometry','Liest reale Boundary-Geometrie, Volumen, Zonen, Materialien und Modellgrenzen.'),
  definition('get_measurement_plan','Liest geplante Positionen und tatsächlich aktivierte Sweep-Aufgaben.'),
  definition('get_measurement_data','Liest Metadaten, reduzierte FR-Daten oder aus Rohdaten berechnete IR-Kennwerte.',{measurementId:str},['measurementId']),
  definition('analyze_frequency_response','Erkennt messbasierte lokale Peaks/Einbrüche mit expliziten Screening-Schwellen.'),
  definition('analyze_impulse_response','Liest vorab numerisch berechnete IR-Kennwerte, keine neu erfundenen Zahlen.',{measurementId:str},['measurementId']),
  definition('calculate_room_modes','Berechnet analytische Eigenmoden ausschließlich im ungestörten Quader.',{maxHz:num}),
  definition('trace_reflections','Berechnet geometrische Pfade mit Sichtbarkeitsprüfung; keine Beugungs- oder Fokussierungsbehauptungen.',{frequency:num,sourceId:str,receiverId:str}),
  definition('identify_problem_surfaces','Liefert modellierte frühe Reflexionspunkte und mehrdeutige Ursachen.'),
  definition('simulate_object_movement','Berechnet eine separate Modellkopie. Ändert das Projekt nicht. Vorschlag braucht Benutzerfreigabe.',{entity:{type:'string',enum:['source','receiver','object']},id:str,position},['entity','id','position']),
  definition('simulate_acoustic_treatment','Vergleicht ausschließlich vom Nutzer dokumentierte Absorptionswerte einer ganzen Boundary-Fläche. Keine pauschalen Bauteilabmessungen oder unbekannten Materialwerte.',{surfaceId:str,absorption:{type:'array',items:num,minItems:6,maxItems:6},dataSource:str},['surfaceId','absorption','dataSource']),
  definition('compare_scenarios','Vergleicht ein im Kontext vorhandenes freigegebenes Szenario bei identischen Analyseparametern.',{scenarioId:str,frequency:num},['scenarioId']),
  definition('generate_acoustic_report','Liefert Problemdatensätze und Modellberechnungen als Grundlage eines nachvollziehbaren Berichts.')
];
export function executeAcousticTool(project,name,args={},context={}){
  if(!ACOUSTIC_TOOLS.some(t=>t.name===name))throw new Error('Unbekanntes KI-Werkzeug.');
  const frequency=args.frequency??context.frequency??125;if(!Number.isFinite(frequency)||frequency<20||frequency>20000)throw new Error('Analysefrequenz 20–20000 Hz.');
  const source=project.sources.find(s=>s.id===(args.sourceId||context.sourceId))||project.sources[0],receiver=project.receivers.find(s=>s.id===(args.receiverId||context.receiverId))||project.receivers[0];
  const analysis=()=>scenarioAnalysis(project,source.id,receiver.id,frequency);
  if(name==='get_room_geometry')return {room:project.room,objects:project.objects,summary:geometrySummary(project),evidence:'SIMULATED'};
  if(name==='get_measurement_plan')return {plan:project.measurementPlan||null,summary:taskSummary(project.measurementPlan)};
  if(['get_measurement_data','analyze_impulse_response'].includes(name)){const m=project.measurements.find(m=>m.id===args.measurementId);if(!m)throw new Error('Unbekannte Messung.');return {id:m.id,name:m.name,metadata:m.metadata,kind:m.kind,data:m.kind==='frequency'?m.data:undefined,metrics:m.cachedMetrics,evidence:'MEASURED',note:'IR-Kennwerte wurden lokal vor der KI-Anfrage berechnet; keine Roh-WAV-Übertragung.'};}
  if(name==='calculate_room_modes'){
    if(!isRectangular(project.room)||project.objects.some(o=>o.acoustic!==false))return {available:false,reason:'Keine analytischen Rechteck-Moden für freie Geometrie oder Hindernisse. Numerisches Wellenmodell im Analysebereich verwenden.'};
    const hz=args.maxHz??150;if(!Number.isFinite(hz)||hz<20||hz>300)throw new Error('Modenbereich 20–300 Hz.');const b=roomBounds(project.room);return {modes:roomModes(b.max.map((v,i)=>v-b.min[i]),soundSpeed(project.room.temperature),hz,sub(acousticPosition(source),b.min),sub(receiver.position,b.min)).slice(0,250),evidence:'SIMULATED'};
  }
  if(name==='trace_reflections')return analysis();
  if(name==='simulate_object_movement'){const proposal=movementProposal(project,args);return {proposal,result:compareScenarios(project,proposal.model,source.id,receiver.id,frequency),requiresUserApproval:true};}
  if(name==='simulate_acoustic_treatment'){
    if(!args.dataSource?.trim()||!Array.isArray(args.absorption)||args.absorption.length!==6||!args.absorption.every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw new Error('Dokumentierte Datenquelle und sechs gültige Absorptionswerte erforderlich.');
    const known=[...Object.values(project.room.surfaces),...(project.room.zones||[]).flatMap(z=>z.edges.map(e=>e.material).filter(Boolean)),...project.objects.map(o=>o.material).filter(Boolean)];
    if(!known.some(m=>args.absorption.every((v,i)=>v===m.absorption[i])&&args.dataSource===(m.provenance||m.label)))throw new Error('Diese Materialwerte sind im Nutzerprojekt nicht mit dieser Herkunft dokumentiert. Keine KI-erfundenen Koeffizienten.');
    const proposal=scenarioCopy(project,'KI-Vorschlag: Flächenmaterial');let material=proposal.model.room.surfaces[args.surfaceId];
    if(!material)for(const zone of proposal.model.room.zones||[]){const edge=zone.edges.find(e=>e.id===args.surfaceId);if(edge){edge.material??=structuredClone(proposal.model.room.surfaces[edge.materialKey||'front']);material=edge.material;}}
    if(!material)throw new Error('Unbekannte Boundary-Fläche.');
    if(args.absorption.some((v,i)=>v+material.transmission[i]>1))throw new Error('Absorption und Transmission überschreiten 1.');
    material.absorption=[...args.absorption];material.provenance=args.dataSource;proposal.acceptedByUser=false;proposal.description=`Änderung der ganzen Fläche ${args.surfaceId}, Materialquelle: ${args.dataSource}. Keine Prognose für eine unbekannte Teilabsorberfläche.`;
    return {proposal,result:compareScenarios(project,proposal.model,source.id,receiver.id,frequency),requiresUserApproval:true};
  }
  if(name==='compare_scenarios'){const scenario=project.scenarios?.find(s=>s.id===args.scenarioId);if(!scenario)throw new Error('Kein solches Szenario im freigegebenen Kontext.');return compareScenarios(project,scenario.model,source.id,receiver.id,frequency);}
  const a=analysis();return {problems:analyzeProblems({...project,measurements:project.measurements.filter(m=>m.kind==='frequency')},a),calculated:a,evidence:'INFERRED',note:'IR-Auswertungen separat mit analyze_impulse_response lesen; keine statistisch kalibrierte Ursachenwahrscheinlichkeit.'};
}
