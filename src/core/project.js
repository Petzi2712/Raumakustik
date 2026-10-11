export const BANDS = [125, 250, 500, 1000, 2000, 4000];
export const SURFACES = [
  { id: 'left', label: 'Linke Wand', axis: 0, side: 0 },
  { id: 'right', label: 'Rechte Wand', axis: 0, side: 1 },
  { id: 'front', label: 'Vorderwand', axis: 1, side: 0 },
  { id: 'back', label: 'Rückwand', axis: 1, side: 1 },
  { id: 'floor', label: 'Boden', axis: 2, side: 0 },
  { id: 'ceiling', label: 'Decke', axis: 2, side: 1 },
];
export function defaultProject() {
  return {
    schemaVersion: 1, name: 'Mein Hörraum',
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
function finiteRange(n, min, max, label) {
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${label}: Wert muss zwischen ${min} und ${max} liegen.`);
}
export function validateProject(p) {
  if (!p || p.schemaVersion !== 1) throw new Error('Unbekanntes Projektformat (schemaVersion 1 benötigt).');
  if (typeof p.name !== 'string' || p.name.length > 200) throw new Error('Ungültiger Projektname.');
  if (!Array.isArray(p.room?.dimensions) || p.room.dimensions.length !== 3) throw new Error('Drei Raumabmessungen benötigt.');
  p.room.dimensions.forEach(v => finiteRange(v, 1, 30, 'Raumabmessung'));
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
    if (!Array.isArray(p[key]) || p[key].length < 1 || p[key].length > 32) throw new Error(`${key}: 1–32 Positionen benötigt.`);
    const ids = new Set();
    for (const item of p[key]) {
      if (typeof item.id !== 'string' || ids.has(item.id)) throw new Error('Positions-IDs müssen eindeutig sein.');
      ids.add(item.id);
      if (typeof item.name !== 'string' || item.name.length > 200 || !Array.isArray(item.position) || item.position.length !== 3) throw new Error('Ungültige Position.');
      item.position.forEach((v, i) => finiteRange(v, 0.001, p.room.dimensions[i] - 0.001, item.name));
      if (key === 'sources') { finiteRange(item.delayMs, 0, 1000, 'Delay'); if (![1, -1].includes(item.polarity)) throw new Error('Ungültige Polarität.'); }
    }
  }
  if (!['critical','control','home','hifi','cinema','atmos','speech','hall'].includes(p.profile)) throw new Error('Unbekanntes Referenzprofil.');
  if (!Array.isArray(p.measurements) || p.measurements.length > 100) throw new Error('Ungültige Messliste.');
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
  return p;
}
export function parseProject(text) {
  if (text.length > 150_000_000) throw new Error('Projektdatei zu groß.');
  return validateProject(JSON.parse(text));
}
export function bandValue(values, frequency) {
  if (frequency <= BANDS[0]) return values[0];
  if (frequency >= BANDS.at(-1)) return values.at(-1);
  const i = BANDS.findIndex(v => v >= frequency);
  const t = Math.log(frequency / BANDS[i-1]) / Math.log(BANDS[i] / BANDS[i-1]);
  return values[i-1] * (1-t) + values[i] * t;
}
