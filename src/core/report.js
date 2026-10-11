import {soundSpeed,roomModes,reflectionPaths,reverberation} from './acoustics.js';
import {measurementQuality} from './imports.js';
import {impulseMetrics} from './measurement.js';
export function buildReport(project, source, receiver, frequency) {
  const c=soundSpeed(project.room.temperature),paths=reflectionPaths(project,source,receiver,frequency);
  return JSON.stringify({application:'Raumakustik Digital Twin 0.1',project:project.name,
    coordinates:'Meter: X rechts, Y von Vorderwand zur Rückwand, Z nach oben. Ursprung vorn links am Boden.',
    room:project.room,source,receiver,frequency,
    calculated:{soundSpeed:c,assumptions:'Rechteckraum, starre Modenränder, trockene Luft, omnidirektionale Quelle, keine Beugung oder Hindernisse, keine komplexe Materialphase.',
      reverberation:reverberation(project.room,frequency),modes:roomModes(project.room.dimensions,c,150,source.position,receiver.position).slice(0,60),paths},
    measured:project.measurements.map(m=>({name:m.name,kind:m.kind,metadata:m.metadata,quality:measurementQuality(m,project),
      metrics:m.kind==='impulse'?(()=>{const q=impulseMetrics(m);return {...q,decay:undefined};})():undefined,
      frequencySamples:m.kind==='frequency'?m.data.filter((_,i)=>i%Math.max(1,Math.ceil(m.data.length/150))===0):undefined})),
    instruction:'Trenne Measured, Calculated und Inferred. Nenne Unsicherheit und fehlende Nachweise. Ordne Reflexionen nicht allein aus ihrer Laufzeit eindeutig zu. Bevorzuge Positionierung und physische Akustik vor EQ. Keine großen Boosts für destruktive Nullstellen. Verwende keine KI-generierten Zahlen als Ersatz für einen physikalischen Solver.'},null,2);
}
