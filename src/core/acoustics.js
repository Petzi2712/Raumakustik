import { SURFACES, bandValue } from './project.js';
export const distance = (a, b) => Math.hypot(...a.map((v, i) => v-b[i]));
// Dry-air approximation. Humidity and pressure are stored, not applied in v0.1.
export const soundSpeed = temperature => 331.3 * Math.sqrt(1 + temperature / 273.15);
export function modalPressure(mode, position, dimensions) {
  return mode.indices.reduce((v, n, i) => v * Math.cos(Math.PI*n*position[i]/dimensions[i]), 1);
}
export function roomModes(dimensions, c, maxHz, source, receiver) {
  const limits = dimensions.map(l => Math.floor(2 * maxHz * l / c));
  const result = [];
  for (let p=0; p<=limits[0]; p++) for (let q=0; q<=limits[1]; q++) for (let r=0; r<=limits[2]; r++) {
    const indices = [p,q,r];
    const count = indices.filter(Boolean).length;
    if (!count) continue;
    const frequency = c/2 * Math.hypot(...indices.map((n,i) => n/dimensions[i]));
    if (frequency > maxHz + 1e-9) continue;
    const mode = { indices, frequency, kind: ['','axial','tangential','oblique'][count], evidence: 'Calculated' };
    mode.coupling = modalPressure(mode,source,dimensions) * modalPressure(mode,receiver,dimensions);
    result.push(mode);
  }
  return result.sort((a,b)=>a.frequency-b.frequency);
}
export function reverberation(room, frequency) {
  const [x,y,z] = room.dimensions;
  const areas = [y*z,y*z,x*z,x*z,x*y,x*y];
  const absorptionArea = SURFACES.reduce((a,s,i) => a + areas[i]*bandValue(room.surfaces[s.id].absorption,frequency),0);
  const volume=x*y*z;
  const t60=absorptionArea > 0 ? 0.161*volume/absorptionArea : null;
  return { volume, absorptionArea, t60, schroeder: t60 ? 2000*Math.sqrt(t60/volume) : null, evidence: 'Calculated' };
}
function reflect(point, surface, dimensions) {
  const p = [...point];
  p[surface.axis] = 2 * surface.side * dimensions[surface.axis] - p[surface.axis];
  return p;
}
function reconstruct(source, receiver, sequence, dimensions) {
  const images = [[...source]];
  for (const s of sequence) images.push(reflect(images.at(-1),s,dimensions));
  let end=[...receiver];
  const reversed=[];
  for (let i=sequence.length-1; i>=0; i--) {
    const s=sequence[i], image=images[i+1], plane=s.side*dimensions[s.axis];
    const denom=image[s.axis]-end[s.axis];
    if (Math.abs(denom)<1e-10) return null;
    const t=(plane-end[s.axis])/denom;
    if (t<=1e-8 || t>=1-1e-8) return null;
    const hit=end.map((v,k)=>v+t*(image[k]-v));
    if (hit.some((v,k)=>v < -1e-7 || v > dimensions[k]+1e-7)) return null;
    reversed.push(hit); end=hit;
  }
  return [source,...reversed.reverse(),receiver];
}
export function reflectionPaths(project, source, receiver, frequency, order=2) {
  const c=soundSpeed(project.room.temperature), dims=project.room.dimensions;
  const directDistance=distance(source.position,receiver.position);
  if (directDistance < 0.01) throw new Error('Quelle und Empfänger müssen mindestens 1 cm Abstand haben.');
  const sequences=[[]];
  for (const a of SURFACES) { sequences.push([a]); if(order>=2) for(const b of SURFACES) if(a.id!==b.id) sequences.push([a,b]); }
  const result=[];
  for(const seq of sequences) {
    const points=reconstruct(source.position,receiver.position,seq,dims);
    if (!points) continue;
    const length=points.slice(1).reduce((n,p,i)=>n+distance(points[i],p),0);
    const delta=length-directDistance;
    let pressure=directDistance/length;
    const incidence=[];
    for(let i=0;i<seq.length;i++) {
      const material=project.room.surfaces[seq[i].id];
      pressure*=Math.sqrt(Math.max(0,1-bandValue(material.absorption,frequency)-bandValue(material.transmission,frequency))) * Math.sqrt(1-bandValue(material.scattering,frequency));
      const before=points[i], hit=points[i+1];
      incidence.push(Math.acos(Math.min(1,Math.abs(hit[seq[i].axis]-before[seq[i].axis])/distance(hit,before)))*180/Math.PI);
    }
    result.push({ id: seq.map(s=>s.id).join('>') || 'direct', sourceId:source.id, receiverId:receiver.id,
      order:seq.length, surfaces:seq.map(s=>s.id), points, length, delta,
      arrivalMs:length/c*1000+source.delayMs, delayMs:delta/c*1000,
      relativeDb:pressure>0 ? 20*Math.log10(pressure) : -120, incidence,
      phaseDegrees: ((-360*frequency*(length/c+source.delayMs/1000)+(source.polarity===-1?180:0))%360+360)%360,
      firstNull: delta>1e-6 ? c/(2*delta) : null, evidence:'Calculated',
    });
  }
  return result.sort((a,b)=>a.arrivalMs-b.arrivalMs);
}
export function matchReflections(peaks, paths, toleranceMs=0.5) {
  return peaks.map(peak => ({ ...peak, evidence:'Inferred', candidates:paths.filter(p=>p.order>0 && Math.abs(p.delayMs-peak.delayMs)<=toleranceMs)
    .map(p=>({pathId:p.id, timeErrorMs:Math.abs(p.delayMs-peak.delayMs), confidence:Math.round(60*(1-Math.abs(p.delayMs-peak.delayMs)/toleranceMs))}))
    .sort((a,b)=>b.confidence-a.confidence),
    explanation:'Nur Laufzeitvergleich; kein Nachweis einer räumlichen Reflexionsquelle. Confidence ist eine heuristische Rangfolge, keine Wahrscheinlichkeit.' }));
}
export function positionMap(project, source, modes) {
  const [x,y]=project.room.dimensions, z=project.receivers[0].position[2];
  const result=[];
  for(let i=1;i<20;i++) for(let j=1;j<20;j++) {
    const position=[x*i/20,y*j/20,z];
    if(distance(position,source.position)<0.3) continue;
    const energy=modes.reduce((a,m)=>a+(modalPressure(m,source.position,project.room.dimensions)*modalPressure(m,position,project.room.dimensions))**2,0)/Math.max(1,modes.length);
    result.push({position,score:energy});
  }
  return result; // Modal coupling only; not a predicted frequency-response quality.
}
