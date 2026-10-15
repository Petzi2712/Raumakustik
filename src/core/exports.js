import {impulseMetrics,impulseSpectrogram} from './measurement.js';
import {downsampleSeries} from './series.js';
import {roomZones,roomBounds,geometrySummary,acousticPosition} from './geometry.js';
import {pointReferences,taskSummary} from './planning.js';
export const escapeXml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number.isFinite(v)?v.toFixed(3):'—';
export function planSvg(project){
  const b=roomBounds(project.room),margin=.65,w=b.max[0]-b.min[0]+2*margin,h=b.max[1]-b.min[1]+2*margin,scale=Math.max(w/.18,h/.18),points=project.measurementPlan?.points||[];
  const line=(a,b,attrs='')=>`<line x1="${a[0]}" y1="${-a[1]}" x2="${b[0]}" y2="${-b[1]}" stroke="#284759" stroke-width=".025" ${attrs}/>`;
  const text=(p,s,color='#173347',size=.12)=>`<text x="${p[0]}" y="${-p[1]}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}">${escapeXml(s)}</text>`;
  let content='';
  for(const z of roomZones(project.room))for(let i=0;i<z.vertices.length;i++){
    const a=z.vertices[i],b=z.vertices[(i+1)%z.vertices.length],e=z.edges[i],p=[a.x,a.y],q=[b.x,b.y];
    content+=line(p,q,e.opening?.open!==false&&e.opening?'stroke-dasharray=".05 .05"':'');
    if(z.vertices.length<=32)content+=text([(a.x+b.x)/2,(a.y+b.y)/2+.08],`${Math.hypot(b.x-a.x,b.y-a.y).toFixed(2)} m`);
  }
  for(const o of project.objects||[])content+=`<rect x="${o.position[0]-o.size[0]/2}" y="${-o.position[1]-o.size[1]/2}" width="${o.size[0]}" height="${o.size[1]}" transform="rotate(${-o.rotation||0},${o.position[0]},${-o.position[1]})" fill="#e1d4bf" stroke="#94734f" stroke-width=".01"/>`+text([o.position[0],o.position[1]],o.name,'#77542d',.1);
  for(const s of project.sources){const p=acousticPosition(s);content+=`<rect x="${p[0]-.06}" y="${-p[1]-.06}" width=".12" height=".12" fill="#b97217"/>`+text([p[0]+.1,p[1]],s.name,'#8a4d06');}
  for(const s of project.listeningPositions||[])content+=text([s.position[0]-.05,s.position[1]],'✚ '+s.name,'#303b46');
  for(const p of points)content+=`<circle cx="${p.position[0]}" cy="${-p.position[1]}" r=".045" fill="#00876f"/>`+text([p.position[0]+.06,p.position[1]+.06],`${p.label} · Z ${p.position[2].toFixed(2)} m`,'#006f60',.1);
  content+=text([b.min[0]-margin+.1,b.min[1]-margin+.12],`X → / Y ↑ · Meter · Maßstab 1:${scale.toFixed(1)} bei 100 % Druck`,'#173347',.11);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${(w/scale*1000).toFixed(2)}mm" height="${(h/scale*1000).toFixed(2)}mm" viewBox="${b.min[0]-margin} ${-b.max[1]-margin} ${w} ${h}" role="img" aria-label="Maßstäblicher Messplan"><rect x="${b.min[0]-margin}" y="${-b.max[1]-margin}" width="${w}" height="${h}" fill="white"/>${content}</svg>`;
}
export function planCsv(project){
  const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';
  const rows=[['ID','Name','Gruppe','X_m','Y_m','Z_m','Referenz_1','Abstand_1_m','Referenz_2','Abstand_2_m','Nachbar','Nachbarabstand_m','Reihenfolge']];
  (project.measurementPlan?.points||[]).forEach((p,i)=>{const refs=pointReferences(project,p);rows.push([p.label,p.name,p.group,...p.position,...refs.references.flatMap(r=>[r.wallId,n(r.distance)]),refs.nearest?.label,n(refs.nearest?.distance),i+1]);});
  return '\ufeff'+rows.map(r=>r.map(quote).join(';')).join('\r\n');
}
export function reportHtml(project,report,{planOnly=false,sceneImage}={}){
  const plan=project.measurementPlan,summary=taskSummary(plan),geometry=geometrySummary(project),escape=escapeXml;
  const rows=(plan?.points||[]).map(p=>{const r=pointReferences(project,p);return `<tr><td>${escape(p.label)} ${escape(p.name)}</td><td>${p.position.map(n).join(' / ')}</td><td>${r.references.map(v=>escape(v.wallId)+': '+n(v.distance)+' m').join('<br/>')}</td><td>${escape(r.nearest?.label)}: ${n(r.nearest?.distance)} m</td></tr>`;}).join('');
  const section=(title,content)=>`<section><h2>${title}</h2>${content}</section>`;
  const list=items=>`<ul>${items.map(s=>`<li>${escape(s)}</li>`).join('')}</ul>`;
  let body=`<h1>${escape(project.name)}</h1><p>${planOnly?'Messplan':'Akustischer Analysebericht'} · ${new Date().toLocaleString('de-DE',{timeZone:'Europe/Berlin'})} · Schema ${project.schemaVersion}</p><p>Profil: ${escape(project.profile)}. Koordinaten in Metern: X rechts, Y nach hinten, Z nach oben; Ursprung des Projektkoordinatensystems. Freie Geometrie, keine imaginären Rechteck-Wandabstände.</p>`;
  body+=section('Raumgeometrie & maßstäblicher Messplan',planSvg(project)+`<p>Grundfläche ${n(geometry.area)} m² · Volumen ${n(geometry.volume)} m³ · Oberfläche ${n(geometry.surfaceArea)} m²</p>`+list(geometry.warnings));
  if(sceneImage&&/^data:image\/png;base64,/.test(sceneImage))body+=`<img alt="3D-Ansicht" src="${sceneImage}" style="width:180mm"/>`;
  body+=section('Messaufbau und Planungsgrundlage',`<p>${summary.microphones} Mikrofonpositionen · ${summary.sources} Quellen · ${summary.sweeps} geplante Sweeps · ${summary.complete} abgeschlossene Aufgaben. Status: ${plan?.approval?'freigegeben':'nicht freigegeben'}</p><p>Mikrofon: ${escape(plan?.config.microphone||'nicht dokumentiert')} · Timing: ${escape(plan?.config.timing||'nicht dokumentiert')} · Aufbau: ${escape(plan?.config.setup||'nicht dokumentiert')}</p>`+list(plan?.reasons||['Noch kein Messplan erstellt.'])+`<table><thead><tr><th>Punkt / Reihenfolge</th><th>X / Y / Z (m)</th><th>Zwei reale Wandreferenzen</th><th>Nächster Punkt</th></tr></thead><tbody>${rows}</tbody></table>`);
  if(!planOnly){
    body+=section('Datenherkunft und Grenzen',list(['MEASURED: reale importierte Messdaten. SIMULATED: numerisches oder geometrisches Modell. INFERRED: unbestätigte Hypothese.','Reflexionszuordnung aus Laufzeit ist mehrdeutig. Keine normierte Qualitätszertifizierung, keine kalibrierten Wahrscheinlichkeiten.','FDTD: starre verlustlose Wände und voxelisiertes Volumen. Geometrische Reflexionen: keine validierte Beugung, diffuse Energie oder Materialphase.']));
    body+=section('Messauswertung',project.measurements.length?project.measurements.map(m=>`<h3>${escape(m.name)}</h3><p>${escape(m.kind)} · ${m.data.length} Datenpunkte · Quelle ${escape(m.metadata.sourceId)} / Punkt ${escape(m.metadata.receiverId)} · ${m.metadata.geometryStale?'GEOMETRIEBEZUG VERALTET':'Aufnahmezustand dokumentiert oder ungeprüfter Bestand'}</p>`+measurementFigures(m)).join(''):'<p>Keine Messung vorhanden. Es werden keine Messbeweise erfunden.</p>');
    if(report){
      const data=typeof report==='string'?JSON.parse(report):report;
      body+=section('Simulation und Reflexionsschemata',`<p>Analysefrequenz ${escape(data.frequency)} Hz. ${escape(data.calculated?.assumptions)}</p><table><thead><tr><th>Pfad</th><th>Weg m</th><th>Δ Zeit ms</th><th>Δ Pegel dB</th><th>Einfallswinkel °</th></tr></thead><tbody>${(data.calculated?.paths||[]).map(p=>`<tr><td>${escape(p.id)}</td><td>${n(p.length)}</td><td>${n(p.delayMs)}</td><td>${n(p.relativeDb)}</td><td>${p.incidence.map(n).join(' / ')}</td></tr>`).join('')}</tbody></table>`);
      body+=section('Reflexionsschemata (Draufsicht und exakte 3D-Koordinaten)',(data.calculated?.paths||[]).filter(p=>p.order===1).slice(0,8).map(p=>reflectionSvg(p)).join(''));
      body+=section('Messkennwerte / Nachvollziehbarkeit',`<pre>${escape(JSON.stringify(data.measured,null,2))}</pre>`);
      body+=section('Probleme / Ursachen / weitere Untersuchungen',data.problems?.length?data.problems.map(p=>`<h3>${escape(p.id)} · ${escape(p.description)}</h3><p>${escape(p.evidence)} · ${escape(p.severity)} · ${escape(p.uncertainty)}</p>`+list(p.causes||[])+list(p.actions||[])).join(''):'<p>Keine belastbare Problemaussage aus den vorhandenen Daten. Weitere Messungen können erforderlich sein.</p>');
      body+=section('Maßnahmen und Vorher-Nachher-Szenarien',`<p>Ausgangszustand bleibt erhalten. Prognosen gelten ausschließlich für das eingesetzte Modell und sind nicht als gemessene Verbesserung zu lesen. Fehlende Materialwerte oder Preise werden nicht ergänzt.</p>`+list(project.scenarios.map(s=>`${s.name}: ${s.description||'separate Modellkopie'}; noch nicht durch Nachmessung bestätigt.`)));
      body+=section('Reproduzierbare Eingangsparameter',`<pre>${escape(JSON.stringify({...data,measured:undefined,calculated:{...data.calculated,paths:undefined}},null,2))}</pre>`);
    }
    body+=section('Abschlussbewertung',`<p>Wichtigste nächste Schritte: Messqualität und Timing dokumentieren, mehrdeutige Ursachen mit räumlich getrennten Punkten untersuchen, Änderungen zuerst im separaten Szenario und anschließend durch Nachmessung prüfen. Die Anwendung ersetzt keine Fachplanung oder Laborvalidierung.</p>`);
  }
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><title>${escape(project.name)}</title><style>@page{size:A4;margin:15mm}body{font:10pt Arial,sans-serif;color:#172e3d}h1{font-size:23pt}h2{font-size:15pt;border-bottom:1px solid #889ca6;padding-bottom:5px}section{margin-top:20px}table{width:100%;border-collapse:collapse;font-size:8pt}thead{display:table-header-group}tr{break-inside:avoid}td,th{border:1px solid #adbfc7;text-align:left;padding:5px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:7pt}svg{display:block;max-width:100%;height:auto}li{margin:4px 0}img{max-width:100%}</style></head><body>${body}</body></html>`;
}
export function downloadFile(content,name,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
export async function exportPlan(project,format,report){
  if(format==='svg')return downloadFile(planSvg(project),'Messplan.svg','image/svg+xml');
  if(format==='csv')return downloadFile(planCsv(project),'Messpunkte.csv','text/csv;charset=utf-8');
  if(format==='json')return downloadFile(JSON.stringify(project.measurementPlan,null,2),'Messplan.json');
  if(format==='png'){const svg=planSvg(project),img=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=Math.round(1800*img.height/img.width);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));return downloadFile(blob,'Messplan.png','image/png');}finally{URL.revokeObjectURL(url);}}
  const html=reportHtml(project,report,{planOnly:format==='pdf-plan'});
  if(window.desktop?.printPdf)return window.desktop.printPdf(html,format==='pdf-plan'?'Messplan.pdf':'Akustikbericht.pdf');
  downloadFile(html,'Messplan-zum-Drucken.html','text/html');
}

export function seriesSvg(data,label,{logX=false,xLabel='Zeit / ms',yLabel='relativer Pegel / dB'}={}){
  const valid=data.filter(p=>p.every(Number.isFinite)&&(!logX||p[0]>0));if(valid.length<2)return '<p>Keine auswertbaren Diagrammdaten.</p>';
  const sampled=downsampleSeries(valid,1000),tx=x=>logX?Math.log10(x):x,x0=tx(valid[0][0]),x1=tx(valid.at(-1)[0]),lo=valid.reduce((n,p)=>Math.min(n,p[1]),Infinity),hi=valid.reduce((n,p)=>Math.max(n,p[1]),-Infinity);
  const path=sampled.map((p,i)=>`${i?'L':'M'}${(45+(tx(p[0])-x0)/Math.max(1e-9,x1-x0)*700).toFixed(2)},${(190-(p[1]-lo)/Math.max(1e-9,hi-lo)*150).toFixed(2)}`).join(' ');
  return `<figure><figcaption>${escapeXml(label)}</figcaption><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 245"><path d="M45 35V190H750" fill="none" stroke="#8098a4"/><path d="${path}" fill="none" stroke="#00745f" stroke-width="1.2"/><g font-family="Arial" font-size="11" fill="#173347"><text x="45" y="22">${escapeXml(yLabel)} · ${lo.toFixed(2)} … ${hi.toFixed(2)}</text><text x="45" y="213">${valid[0][0].toFixed(2)}</text><text x="700" y="213">${valid.at(-1)[0].toFixed(2)}</text><text x="300" y="235">${escapeXml(xLabel)}</text></g></svg></figure>`;
}
function measurementFigures(m){
  if(m.kind==='frequency')return seriesSvg(m.data.map(p=>p.slice(0,2)),m.name,{logX:true,xLabel:'Frequenz / Hz (logarithmisch)',yLabel:'Pegel / dB; SPL nur bei Kalibrierung'})+(m.data[0]?.length===3?seriesSvg(m.data.map(p=>[p[0],p[2]]),'Exportierte Phase',{logX:true,xLabel:'Frequenz / Hz',yLabel:'Phase / Grad'}):'');
  let result=seriesSvg(m.data.map(p=>[p[0]*1000,p[1]]),'Lineare Impulsantwort',{yLabel:'Lineare Amplitude'});
  try{const metrics=impulseMetrics(m);result+=seriesSvg(metrics.decay.map(p=>[p[0]*1000,p[1]]),'Schroeder-Decay',{yLabel:'Integrierte Energie / dB'});const s=impulseSpectrogram(m);if(s?.frames.length){const rows=s.frames.length,cols=s.bins.length;result+='<h4>STFT-Spektrogramm</h4><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 250">';for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const v=Math.max(0,Math.min(1,(s.frames[i].values[j]+60)/60));result+=`<rect x="${50+j*700/cols}" y="${10+i*200/rows}" width="${700/cols+1}" height="${200/rows+1}" fill="hsl(${230-v*210},78%,${15+v*45}%)"/>`;}result+=`<text x="50" y="235" font-size="12">Frequenz ${s.bins[0].toFixed(0)}–${s.bins.at(-1).toFixed(0)} Hz / Zeit ${s.frames[0].time.toFixed(3)}–${s.frames.at(-1).time.toFixed(3)} s</text></svg><p>${escapeXml(s.notes)}</p>`;}}
  catch(e){result+=`<p>Auswertung: ${escapeXml(e.message)}</p>`;}return result;
}
export function reflectionSvg(path){
  const xs=path.points.map(p=>p[0]),ys=path.points.map(p=>p[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),scale=Math.min(600/Math.max(.2,xmax-xmin),150/Math.max(.2,ymax-ymin));
  const points=path.points.map(p=>[70+(p[0]-xmin)*scale,200-(p[1]-ymin)*scale]);
  return `<figure><figcaption>${escapeXml(path.id)} · ${path.length.toFixed(3)} m · Δt ${path.delayMs.toFixed(3)} ms · ${path.relativeDb.toFixed(2)} dB · Winkel ${path.incidence.map(n=>n.toFixed(1)).join(' / ')}°</figcaption><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260"><polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#00745f" stroke-width="2"/>${points.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#a36a14"/><text x="${p[0]+8}" y="${p[1]-8}" font-family="Arial" font-size="11">${i===0?'Quelle':i===points.length-1?'Mikrofon':'Reflexion '+i}: ${path.points[i].map(n=>n.toFixed(3)).join(' / ')} m</text>`).join('')}<text x="50" y="245" font-family="Arial" font-size="11">XY-Draufsicht; Z-Koordinaten sind an jedem Punkt angegeben. Prognose, kein Einfallsrichtungsnachweis.</text></svg></figure>`;
}
