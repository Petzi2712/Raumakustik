import {geometrySummary,isRectangular,measurementFingerprint} from './geometry.js';
import {impulseMetrics} from './measurement.js';
const median=a=>{const s=[...a].sort((a,b)=>a-b);return s.length?s[Math.floor(s.length/2)]:null;};
export function analyzeProblems(project,analysis,{dipDb=6,earlyReflectionDb=-12,earlyMs=15}={}){
  const problems=[],push=p=>problems.push({id:`P-${String(problems.length+1).padStart(3,'0')}`,profile:project.profile,confidence:'qualitativ / nicht probabilistisch',...p});
  for(const warning of geometrySummary(project).warnings)push({description:warning,evidence:'INFERRED',severity:'Prüfung erforderlich',causes:['Geometrische Modellprüfung'],actions:['Geometrie und Aufnahmezustand prüfen.'],uncertainty:'Keine akustische Ursache aus dieser Warnung ableitbar.'});
  for(const m of project.measurements){
    if(m.metadata.geometryStale||m.metadata.contextFingerprint&&m.metadata.contextFingerprint!==measurementFingerprint(project,m.metadata.sourceId,m.metadata.receiverId)){push({description:`${m.name}: Messung gehört zu einem anderen Aufnahmezustand.`,measurementIds:[m.id],evidence:'MEASURED',severity:'Vergleich gesperrt',causes:['Raum, Quelle, Möbel oder Empfänger wurden verändert.'],actions:['Ausgangszustand rekonstruieren oder neu messen.'],uncertainty:'Historische Daten bleiben erhalten; keine Übertragung auf neue Geometrie.'});continue;}
    if(m.kind==='frequency'){
      const data=m.data.length>1500?m.data.filter((_,i)=>i%Math.ceil(m.data.length/1500)===0):m.data;
      const candidates=[];
      for(let i=1;i<data.length-1;i++){
        const [f,v]=data[i],neighbors=data.filter(p=>p[0]>=f/Math.sqrt(2)&&p[0]<=f*Math.sqrt(2));if(neighbors.length<5)continue;
        const baseline=median(neighbors.map(p=>p[1])),deviation=v-baseline;
        if(Math.abs(deviation)<dipDb || (deviation<0?!(v<data[i-1][1]&&v<=data[i+1][1]):!(v>data[i-1][1]&&v>=data[i+1][1])))continue;
        if(candidates.some(p=>Math.abs(Math.log2(p.frequency/f))<.15))continue;
        const pathCandidates=(analysis?.paths||[]).filter(p=>p.order&&p.firstNull&&Math.abs(p.firstNull-f)/f<.1);
        candidates.push({frequency:f});push({description:`${m.name}: lokaler ${deviation<0?'Einbruch':'Peak'} bei ${f.toFixed(1)} Hz (${deviation.toFixed(1)} dB gegenüber lokalem Median).`,frequencyRange:[f/Math.sqrt(2),f*Math.sqrt(2)],measurementIds:[m.id],sourceIds:[m.metadata.sourceId],zoneId:m.metadata.receiverId,evidence:'MEASURED',severity:Math.abs(deviation)>12?'auffällig':'untersuchen',causes:[deviation<0?'Destruktive Überlagerung, Direktivität oder Messaufbau als mögliche Ursachen.':'Raumresonanz, Quellfrequenzgang oder Messaufbau als mögliche Ursachen.',...pathCandidates.map(p=>`SBIR-Kandidat ${p.id}: idealisierte Nullstelle ${p.firstNull.toFixed(1)} Hz.`)],actions:['Mit räumlich getrennten Mikrofonpositionen und kontrollierter Quellbewegung nachmessen.','Keine großen EQ-Boosts gegen destruktive Nullstellen.'],uncertainty:'Screening mit bis zu 1500 Stützstellen und lokalem Halb-Oktav-Median; Ursachen bleiben Hypothesen. Schwelle ist ein einstellbarer Arbeitswert, keine Norm.'});if(candidates.length>=10)break;
      }
    }
    if(m.kind==='impulse'&&(m.cachedMetrics||analysis?.measurementId===m.id))try{const metrics=m.cachedMetrics||analysis.metrics;if(!metrics.t20)push({description:`${m.name}: kein belastbarer T20-Fit.`,measurementIds:[m.id],evidence:'INFERRED',severity:'Messqualität prüfen',causes:['Zu wenig Decay, unzureichender Störabstand oder nichtlinearer Verlauf.'],actions:['Längere/rauschärmere Messung, Timing und Auswertefenster prüfen.'],uncertainty:metrics.notes});}catch(e){push({description:`${m.name}: ${e.message}`,evidence:'INFERRED',severity:'Fehler',causes:['Unbrauchbare Impulsantwort.'],actions:['Messung wiederholen.'],uncertainty:'Keine Auswertung möglich.'});}
  }
  for(const path of (analysis?.paths||[]).filter(p=>p.order===1&&p.delayMs<earlyMs&&p.relativeDb>earlyReflectionDb).slice(0,8))push({description:`Modell: frühe Reflexion an ${path.surfaces.join(' / ')} nach ${path.delayMs.toFixed(2)} ms.`,evidence:'SIMULATED',severity:'profilabhängig untersuchen',sourceIds:[path.sourceId],pathId:path.id,causes:['Spekulare Reflexion im geometrischen Modell.'],actions:['Reflexionspunkt mit mehreren IR-Messungen untersuchen.','Positionierung im separaten Szenario vergleichen; Absorber erst mit dokumentierten Materialdaten prognostizieren.'],uncertainty:`Pegel ${path.relativeDb.toFixed(1)} dB ist Modellwert. Keine gemessene Problemfeststellung, keine Normverletzung.`});
  const fr=project.measurements.filter(m=>m.kind==='frequency'&&!m.metadata.geometryStale).slice(0,64).map(m=>({...m,data:m.data.filter((_,i)=>i%Math.max(1,Math.ceil(m.data.length/1500))===0)}));
  for(let i=0;i<fr.length;i++)for(let j=i+1;j<fr.length;j++){
    const a=fr[i],b=fr[j];if(!a.metadata.receiverId||a.metadata.receiverId!==b.metadata.receiverId||a.metadata.sourceId===b.metadata.sourceId||a.metadata.state!==b.metadata.state)continue;
    const bm=new Map(b.data.map(p=>[p[0],p[1]])),pairs=a.data.filter(p=>bm.has(p[0]));if(pairs.length<10)continue;
    const delta=median(pairs.map(p=>p[1]-bm.get(p[0]))),rms=Math.sqrt(pairs.reduce((s,p)=>s+(p[1]-bm.get(p[0])-delta)**2,0)/pairs.length);
    if(rms>3)push({description:`Quell-Asymmetrie: ${a.name} / ${b.name}, Formabweichung ${rms.toFixed(2)} dB RMS nach konstantem Pegelabgleich.`,measurementIds:[a.id,b.id],evidence:'MEASURED',severity:'untersuchen',causes:['Asymmetrische Aufstellung, Raumgeometrie oder unterschiedliche Quellen.'],actions:['Timing, gleiche Messpunkte und Kalibrierung prüfen; L/R getrennt und wiederholt messen.'],uncertainty:'Nur identische Frequenzstützstellen verglichen; keine automatische Ursachenzuordnung.'});
  }
  return problems;
}
export const MATERIAL_LIBRARY=[
  ['Mineralwolle','Porös'],['Glaswolle','Porös'],['Polyesterfaser','Porös'],['Melaminschaum','Porös'],['Holzfaser','Porös'],['Akustikschaum','Porös'],['Mikroperforierte Platte','Resonant'],['Gelochte Holzplatte','Resonant'],['Membransystem','Resonant'],['Helmholtzresonator','Resonant'],['Kommerzielles Produkt','Herstellerdaten erforderlich']
].map(([name,kind])=>({name,kind,absorption:null,provenance:'Kein geprüfter Datensatz hinterlegt. Messwerte mit Dicke, Montage, Luftspalt und Quelle eingeben; keine erfundenen Koeffizienten.'}));
