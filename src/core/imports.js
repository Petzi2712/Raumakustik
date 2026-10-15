function numericLine(line) {
  const cleaned=line.trim();
  if(!cleaned || /^[*#;]/.test(cleaned)) return null;
  let parts=cleaned.split(/[\t; ]+/);
  if(parts.length===1 && cleaned.includes(',')) parts=cleaned.split(',');
  if(parts.length<2) return null;
  const nums=parts.map(p=>Number(p.replace(',','.')));
  return nums.every(Number.isFinite) ? nums : null;
}
export function parseRewText(text, kind='frequency', timeUnit='seconds') {
  if(!['frequency','impulse'].includes(kind)) throw new Error('Importtyp muss Frequenzgang oder Impulsantwort sein.');
  const data=[];
  for(const line of text.split(/\r?\n/)) {
    const row=numericLine(line);
    if(!row) continue;
    const x=kind==='impulse' && timeUnit==='milliseconds' ? row[0]/1000 : row[0];
    if(kind==='frequency' && x<=0) continue;
    data.push([x,row[1],...(kind==='frequency' && row.length>2?[row[2]]:[])]);
  }
  if(data.length<2) throw new Error('Keine gültigen REW-Daten. Erwartet: Hz, dB, optional Grad; oder Zeit, lineare IR-Amplitude.');
  if(data.length>2000000) throw new Error('Maximal 2 Millionen Datenpunkte.');
  for(let i=1;i<data.length;i++) if(data[i][0]<=data[i-1][0]) throw new Error('X-Werte müssen streng aufsteigend sein.');
  let sampleRate;
  if(kind==='impulse') {
    const dt=data[1][0]-data[0][0];
    sampleRate=1/dt;
    if(sampleRate<1000 || sampleRate>768000) throw new Error('Unplausible Sample Rate. Prüfe Sekunden/Millisekunden und lineare Amplitude.');
    for(let i=2;i<data.length;i++) if(Math.abs(data[i][0]-data[i-1][0]-dt)>dt*0.01) throw new Error('Impulsantwort benötigt gleichmäßige Zeitabstände.');
  }
  return {kind,data,sampleRate, amplitudeUnit:kind==='impulse'?'linear':'dB', format:'REW text', metadata:{}};
}
export function parseWav(buffer) {
  const v=new DataView(buffer);
  const text=(o,n)=>String.fromCharCode(...new Uint8Array(buffer,o,n));
  if(buffer.byteLength<44 || text(0,4)!=='RIFF' || text(8,4)!=='WAVE') throw new Error('Keine RIFF/WAVE-Datei.');
  if(v.getUint32(4,true)+8>buffer.byteLength) throw new Error('Unvollständige WAV-Datei.');
  let format,channels,sampleRate,bits,align,dataOffset,dataSize;
  for(let o=12;o+8<=v.byteLength;) {
    const id=text(o,4), size=v.getUint32(o+4,true), start=o+8;
    if(start+size>v.byteLength) throw new Error('Beschädigter WAV-Chunk.');
    if(id==='fmt ') {
      if(size<16) throw new Error('Ungültiger WAV-Header.');
      format=v.getUint16(start,true); channels=v.getUint16(start+2,true); sampleRate=v.getUint32(start+4,true); align=v.getUint16(start+12,true); bits=v.getUint16(start+14,true);
      if(format===65534 && size>=40) { if(v.getUint16(start+16,true)<22) throw new Error('Ungültiger Extensible-WAV-Header.'); format=v.getUint16(start+24,true); }
    }
    if(id==='data') { dataOffset=start; dataSize=size; }
    o=start+size+(size%2);
  }
  if(channels!==1) throw new Error('Bitte eine Mono-Impulsantwort aus REW exportieren. Mehrkanaldateien werden nicht stillschweigend gemischt.');
  if(!sampleRate || sampleRate<1000 || sampleRate>768000 || dataOffset===undefined) throw new Error('Sample Rate oder Audiodaten fehlen.');
  if(!((format===1 && [16,24,32].includes(bits)) || (format===3 && [32,64].includes(bits)))) throw new Error('Unterstützt: PCM 16/24/32 Bit, Float 32/64 Bit.');
  const bytes=bits/8;
  if(align!==bytes || dataSize%bytes!==0) throw new Error('Ungültige WAV-Blockgröße.');
  const count=dataSize/bytes;
  if(count<2 || count>2000000) throw new Error('WAV benötigt 2 bis 2 Millionen Samples.');
  const data=[];
  for(let i=0;i<count;i++) {
    const o=dataOffset+i*bytes;
    let a;
    if(format===3) a=bits===32?v.getFloat32(o,true):v.getFloat64(o,true);
    else if(bits===16) a=v.getInt16(o,true)/32768;
    else if(bits===32) a=v.getInt32(o,true)/2147483648;
    else { let n=v.getUint8(o)|v.getUint8(o+1)<<8|v.getUint8(o+2)<<16; if(n&0x800000) n-=0x1000000; a=n/8388608; }
    if(!Number.isFinite(a)) throw new Error('WAV enthält ungültige Samples.');
    data.push([i/sampleRate,a]);
  }
  return {kind:'impulse',data,sampleRate,amplitudeUnit:'linear',format:`WAV ${bits} bit`,metadata:{timingReference:false}};
}
export const QUALITY_FIELDS = [
  ['timingReference','Timing-Referenz'],['micCalibration','Mikrofonkalibrierung'],['splCalibration','SPL-Kalibrierung'],
  ['sweepComplete','Vollständiger Sweep'],['clockVerified','Clock Drift geprüft'],['roomState','Raumzustand dokumentiert'],
];
export function measurementQuality(m, project) {
  const checks=QUALITY_FIELDS.map(([key,label])=>({label,ok:m.metadata?.[key]===true}));
  checks.push({label:'Lautsprecher zugeordnet',ok:project.sources.some(s=>s.id===m.metadata?.sourceId)});
  checks.push({label:'Mikrofonposition zugeordnet',ok:project.receivers.some(r=>r.id===m.metadata?.receiverId)});
  if(m.kind==='impulse') {
    const samples=m.data.map(row=>Math.abs(row[1]));
    const peak=samples.reduce((a,b)=>Math.max(a,b),0);
    // Text export amplitude scale can be normalized; clipping cannot be inferred.
    checks.push({label:'Keine digitale Vollaussteuerung (nur WAV-Indiz)',ok:m.format?.startsWith('WAV') && peak<0.999});
    checks.push({label:'Sample Rate plausibel',ok:m.sampleRate>=1000 && m.sampleRate<=768000});
  }
  return {score:Math.round(100*checks.filter(c=>c.ok).length/checks.length),checks,
    evidence:'INFERRED', note:'Dokumentationsscore, keine Zertifizierung der Messung. Unbekannte Angaben zählen als ungeprüft; SNR wird separat aus der IR geschätzt.'};
}
