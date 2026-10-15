import {validateZone,geometryFingerprint,measurementFingerprint,roomBounds} from './geometry.js';
export const BANDS = [125, 250, 500, 1000, 2000, 4000];
export const SURFACES = [
  { id: 'left', label: 'Linke Wand', axis: 0, side: 0 },
  { id: 'right', label: 'Rechte Wand', axis: 0, side: 1 },
  { id: 'front', label: 'Vorderwand', axis: 1, side: 0 },
  { id: 'back', label: 'Rückwand', axis: 1, side: 1 },
  { id: 'floor', label: 'Boden', axis: 2, side: 0 },
  { id: 'ceiling', label: 'Decke', axis: 2, side: 1 },
];
export function exampleProject() {
  return {
    schemaVersion: 2, analysisSettings:{reflectionOrder:2}, simulationRuns:[], units:'m', coordinates:'X right, Y rear, Z up', objects:[], scenarios:[], planHistory:[], listeningPositions:[{id:'seat-1',name:'Haupt-Hörplatz',position:[2.4,3.7,1.2]}], name: 'Mein Hörraum',
    room: { dimensions: [4.8, 6.2, 2.7], temperature: 20, humidity: 50, pressure: 101325,
      surfaces: Object.fromEntries(SURFACES.map(s => [s.id, {
        absorption: s.id === 'floor' ? [0.08, 0.12, 0.2, 0.3, 0.4, 0.45] : [0.08, 0.07, 0.06, 0.05, 0.05, 0.05],
        scattering: [0.05, 0.05, 0.1, 0.1, 0.15, 0.15], transmission: [0, 0, 0, 0, 0, 0],
        label: s.id === 'floor' ? 'Teppich · Schätzung' : 'Putz · Schätzung',
      }])),
    },
    sources: [
      { id: 'L', name: 'Links', position: [1.2, 1.1, 1.2], delayMs: 0, polarity: 1 },
      { id: 'R', name: 'Rechts', position: [3.6, 1.1, 1.2], delayMs: 0, polarity: 1 },
    ],
    receivers: [{ id: 'M1', name: 'Hörplatz', position: [2.4, 3.7, 1.2] }],
    measurements: [], profile: 'critical', notes: '',
  };
}
export function defaultProject() {
  const p=exampleProject();
  p.name='Neuer Raum';p.sources=[];p.receivers=[];p.listeningPositions=[];
  return p;
}
function finiteRange(n, min, max, label) {
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${label}: Wert muss zwischen ${min} und ${max} liegen.`);
}
export function validateProject(p) {
  if (!p || p.schemaVersion !== 2) throw new Error('Unbekanntes Projektformat (Schema 1 oder 2 öffnen).');
  if(p.units!=='m')throw new Error('Interne Projekteinheit muss Meter sein.');
  if (typeof p.name !== 'string' || p.name.length > 200) throw new Error('Ungültiger Projektname.');
  if (!Array.isArray(p.room?.dimensions) || p.room.dimensions.length !== 3) throw new Error('Drei Raumabmessungen benötigt.');
  p.room.dimensions.forEach(v => finiteRange(v, 0.2, 200, 'Raumabmessung'));
  if(p.analysisSettings&&(!Number.isInteger(p.analysisSettings.reflectionOrder)||p.analysisSettings.reflectionOrder<0||p.analysisSettings.reflectionOrder>4))throw new Error('Reflexionsordnung: ganzzahlig 0–4.');
  if(p.simulationRuns&&(!Array.isArray(p.simulationRuns)||p.simulationRuns.length>50))throw new Error('Maximal 50 gespeicherte Simulationsläufe.');
  if(p.room.zones){if(!Array.isArray(p.room.zones)||p.room.zones.length<1||p.room.zones.length>16)throw new Error('1–16 Raumzonen erforderlich.');const ids=new Set();for(const z of p.room.zones){validateZone(z);if(ids.has(z.id))throw new Error('Doppelte Zonen-ID.');ids.add(z.id);}}
  if(p.room.zones){const edgeIds=new Set();for(const z of p.room.zones)for(const e of z.edges){if(edgeIds.has(e.id))throw new Error('Wand-IDs müssen projektweit eindeutig sein.');edgeIds.add(e.id);}}
  finiteRange(p.room.temperature, -10, 40, 'Temperatur');
  finiteRange(p.room.humidity, 0, 100, 'Luftfeuchte');
  finiteRange(p.room.pressure, 80000, 110000, 'Luftdruck');
  for (const surface of SURFACES) {
    const material = p.room.surfaces?.[surface.id];
    for (const field of ['absorption', 'scattering', 'transmission']) {
      if (!Array.isArray(material?.[field]) || material[field].length !== BANDS.length) throw new Error(`Material ${surface.label}: sechs Oktavwerte benötigt.`);
      material[field].forEach(v => finiteRange(v, 0, 1, field));
    }
    material.absorption.forEach((v, i) => { if (v + material.transmission[i] > 1) throw new Error('Absorption + Transmission darf 1 nicht überschreiten.'); });
  }
  for (const key of ['sources', 'receivers']) {
    if (!Array.isArray(p[key]) || p[key].length > (key==='sources'?64:2048)) throw new Error(`${key}: Maximale Positionszahl überschritten.`);
    const ids = new Set();
    for (const item of p[key]) {
      if (typeof item.id !== 'string' || ids.has(item.id)) throw new Error('Positions-IDs müssen eindeutig sein.');
      ids.add(item.id);
      if (typeof item.name !== 'string' || item.name.length > 200 || !Array.isArray(item.position) || item.position.length !== 3) throw new Error('Ungültige Position.');
      item.position.forEach((v, i) => finiteRange(v, p.room.zones?-100:0.001, p.room.zones?100:p.room.dimensions[i]-0.001, item.name));
      if(key==='sources'){if(item.acousticCenter && (!Array.isArray(item.acousticCenter)||item.acousticCenter.length!==3||!item.acousticCenter.every(v=>Number.isFinite(v)&&Math.abs(v)<=10)))throw new Error('Ungültiges akustisches Zentrum.');for(const v of [item.yaw??0,item.pitch??0])finiteRange(v,-360,360,'Ausrichtung');}
      if (key === 'sources') { finiteRange(item.delayMs, 0, 1000, 'Delay'); if (![1, -1].includes(item.polarity)) throw new Error('Ungültige Polarität.'); }
    }
  }
  if (!['critical','control','home','hifi','cinema','atmos','speech','hall'].includes(p.profile)) throw new Error('Unbekanntes Referenzprofil.');
  if (!Array.isArray(p.measurements) || p.measurements.length > 2048) throw new Error('Ungültige Messliste.');
  for (const m of p.measurements) {
    if (typeof m.id !== 'string' || typeof m.name !== 'string' || !['frequency', 'impulse'].includes(m.kind)) throw new Error('Ungültige Messung.');
    if (!Array.isArray(m.data) || m.data.length < 2 || m.data.length > 2000000) throw new Error('Ungültige Messdatenmenge.');
    let previous = -Infinity;
    for (const row of m.data) {
      if (!Array.isArray(row) || row.length < 2 || row.length > 3 || !row.every(Number.isFinite) || row[0] <= previous) throw new Error('Messdaten müssen endlich und streng aufsteigend sein.');
      if (m.kind === 'frequency' && row[0] <= 0) throw new Error('Frequenz muss positiv sein.');
      previous = row[0];
    }
    if (m.kind === 'impulse') finiteRange(m.sampleRate, 1000, 768000, 'Sample Rate');
    if (!m.metadata || typeof m.metadata !== 'object' || Array.isArray(m.metadata)) throw new Error('Messmetadaten fehlen.');
    for (const key of ['sourceId','receiverId','notes']) if (m.metadata[key] !== undefined && (typeof m.metadata[key] !== 'string' || m.metadata[key].length > 20000)) throw new Error('Ungültige Messmetadaten.');
    for (const key of ['timingReference','micCalibration','splCalibration','sweepComplete','clockVerified','roomState']) if (m.metadata[key] !== undefined && typeof m.metadata[key] !== 'boolean') throw new Error('Ungültige Qualitätsangabe.');
  }
  if(!Array.isArray(p.objects)||p.objects.length>100)throw new Error('Maximal 100 Raumobjekte.');
  for(const o of p.objects){
    if(typeof o.id!=='string'||typeof o.name!=='string'||!Array.isArray(o.position)||o.position.length!==3||!o.position.every(v=>Number.isFinite(v)&&Math.abs(v)<=100)||!Array.isArray(o.size)||o.size.length!==3||!o.size.every(v=>Number.isFinite(v)&&v>=.01&&v<=100)||!Number.isFinite(o.rotation??0))throw new Error('Ungültiges Raumobjekt.');
    if(o.model && (typeof o.model.data!=='string'||o.model.data.length>8000000||!['glb','gltf','obj'].includes(o.model.format)))throw new Error('Ungültiges 3D-Modell.');
  }
  const materials=[...(p.room.zones||[]).flatMap(z=>[...Object.values(z.materials||{}),...z.edges.flatMap(e=>[e.material,e.opening?.material]).filter(Boolean)]),...p.objects.map(o=>o.material).filter(Boolean)];
  for(const m of materials){for(const field of ['absorption','scattering','transmission']){if(!Array.isArray(m[field])||m[field].length!==BANDS.length)throw new Error('Material benötigt sechs Oktavwerte.');m[field].forEach(v=>finiteRange(v,0,1,'Materialkoeffizient'));}if(m.absorption.some((v,i)=>v+m.transmission[i]>1))throw new Error('Absorption + Transmission darf 1 nicht überschreiten.');}
  if(!Array.isArray(p.listeningPositions)||p.listeningPositions.length>32)throw new Error('Maximal 32 Hörplätze.');
  for(const r of p.listeningPositions)if(typeof r.id!=='string'||typeof r.name!=='string'||!Array.isArray(r.position)||r.position.length!==3||!r.position.every(v=>Number.isFinite(v)&&Math.abs(v)<=100))throw new Error('Ungültiger Hörplatz.');
  if(!Array.isArray(p.scenarios)||p.scenarios.length>30)throw new Error('Maximal 30 Szenarien.');
  for(const s of p.scenarios){if(typeof s.id!=='string'||typeof s.name!=='string'||!s.model||s.model.schemaVersion!==2||s.model.scenarios?.length)throw new Error('Ungültiges Szenario.');validateProject(s.model);}
  if(p.measurementPlan){const plan=p.measurementPlan,c=plan.config;
    if(!c||!['quick','standard','extended','professional'].includes(c.profile)||!Array.isArray(c.sourceIds)||!c.sourceIds.length||new Set(c.sourceIds).size!==c.sourceIds.length||!c.sourceIds.every(id=>p.sources.some(s=>s.id===id))||!Array.isArray(c.seatIds)||!c.seatIds.length||!Array.isArray(c.states)||!c.states.length||!c.states.every(s=>typeof s==='string'&&s.length<=100)||!Number.isInteger(c.repeats)||c.repeats<1||c.repeats>10||!Number.isFinite(c.clearance)||c.clearance<0||c.clearance>1||!Number.isFinite(c.spacing)||c.spacing<.05||c.spacing>2)throw new Error('Ungültige Messplan-Konfiguration.');
    if(!Array.isArray(plan.reasons)||!plan.reasons.every(s=>typeof s==='string')||typeof plan.id!=='string')throw new Error('Ungültige Messplan-Dokumentation.');
if(!Array.isArray(plan.points)||plan.points.length>500||!Array.isArray(plan.tasks)||plan.tasks.length>20000)throw new Error('Messplan zu groß.');const ids=new Set();for(const point of plan.points){if(typeof point.id!=='string'||typeof point.name!=='string'||typeof point.label!=='string'||typeof point.group!=='string'||ids.has(point.id)||!Array.isArray(point.position)||point.position.length!==3||!point.position.every(Number.isFinite))throw new Error('Ungültiger Messplanpunkt.');ids.add(point.id);const receiver=p.receivers.find(r=>r.id===point.id);if(!receiver||receiver.position.some((v,i)=>Math.abs(v-point.position[i])>1e-7))throw new Error('Geplante Mikrofonposition im Messplan bearbeiten; Empfängerbezug muss erhalten bleiben.');}for(const t of plan.tasks)if(!Array.isArray(t.measurementIds)||t.measurementIds.length>100||typeof t.id!=='string'||typeof t.enabled!=='boolean'||!ids.has(t.pointId)||!p.sources.some(s=>s.id===t.sourceId)||!['pending','ready','running','complete','error','repeat','quality'].includes(t.status))throw new Error('Ungültige Messaufgabe.');}
  return p;
}
export function migrateProject(input){
  const p=structuredClone(input);
  if(p?.schemaVersion===1){
    p.schemaVersion=2;p.units='m';p.coordinates='X right, Y rear, Z up';p.objects=[];p.scenarios=[];p.planHistory=[];
    p.listeningPositions=p.receivers.map(r=>({...structuredClone(r),id:`seat-${r.id}`}));
    p.analysisSettings={reflectionOrder:2};p.simulationRuns=[];
    p.migration={from:1,note:'Messdaten unverändert übernommen. Historische Messungen ohne freigegebenen Plan bleiben als ungeprüfte Bestandsdaten erhalten.'};
    for(const m of p.measurements||[])if(m.metadata){m.metadata.legacy=true;m.metadata.contextFingerprint=measurementFingerprint(p,m.metadata.sourceId,m.metadata.receiverId);}
  }
  return p;
}
export function updateProvenance(before,next){
  if(next.room.zones){const b=roomBounds(next.room);next.room.dimensions=b.max.map((v,i)=>v-b.min[i]);}
  for(const m of next.measurements)if(m.metadata.contextFingerprint)m.metadata.geometryStale=m.metadata.contextFingerprint!==measurementFingerprint(next,m.metadata.sourceId,m.metadata.receiverId);
  if(next.measurementPlan && geometryFingerprint(before)!==geometryFingerprint(next))next.measurementPlan.approval=null;
  return next;
}
export function parseProject(text) {
  if (text.length > 150_000_000) throw new Error('Projektdatei zu groß.');
  return validateProject(migrateProject(JSON.parse(text)));
}
export function bandValue(values, frequency) {
  if (frequency <= BANDS[0]) return values[0];
  if (frequency >= BANDS.at(-1)) return values.at(-1);
  const i = BANDS.findIndex(v => v >= frequency);
  const t = Math.log(frequency / BANDS[i-1]) / Math.log(BANDS[i] / BANDS[i-1]);
  return values[i-1] * (1-t) + values[i] * t;
}
