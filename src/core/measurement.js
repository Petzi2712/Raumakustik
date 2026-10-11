function regression(points) {
  if(points.length<10) return null;
  const n=points.length, sx=points.reduce((a,p)=>a+p[0],0), sy=points.reduce((a,p)=>a+p[1],0);
  const xx=points.reduce((a,p)=>a+p[0]**2,0), xy=points.reduce((a,p)=>a+p[0]*p[1],0), yy=points.reduce((a,p)=>a+p[1]**2,0);
  const denominator=n*xx-sx*sx;
  if(denominator<=0) return null;
  const slope=(n*xy-sx*sy)/denominator;
  const corr=(n*xy-sx*sy)**2/(denominator*(n*yy-sy*sy));
  return slope<0 ? {seconds:-60/slope,r2:corr} : null;
}
export function impulseMetrics(m) {
  if(m.kind!=='impulse') return null;
  const a=m.data.map(row=>row[1]), fs=m.sampleRate;
  let peakIndex=0;
  for(let i=1;i<a.length;i++) if(Math.abs(a[i])>Math.abs(a[peakIndex])) peakIndex=i;
  const peak=Math.abs(a[peakIndex]);
  if(peak===0) throw new Error('Impulsantwort enthält nur Nullen.');
  const tail=a.slice(Math.max(peakIndex,Math.floor(a.length*0.9)));
  const noisePower=tail.reduce((s,v)=>s+v*v,0)/Math.max(1,tail.length);
  const snrDb=noisePower>0?10*Math.log10(peak*peak/noisePower):null;
  const energy=new Float64Array(a.length-peakIndex);
  let sum=0;
  for(let i=a.length-1;i>=peakIndex;i--) { sum+=a[i]*a[i]; energy[i-peakIndex]=sum; }
  const total=sum;
  const decay=Array.from(energy,(e,i)=>[i/fs,10*Math.log10(Math.max(e/total,1e-12))]);
  const fit=(low,high,minSnr)=>{
    if(snrDb!==null && snrDb<minSnr) return null;
    const points=decay.filter(p=>p[1]<=low && p[1]>=high);
    if(!points.length || decay.at(-1)[1]>high) return null;
    const result=regression(points);
    return result && result.r2>=0.95 && points.at(-1)[0] < (a.length-peakIndex)/fs*0.9 ? result : null;
  };
  const early=ms=>{ const n=Math.min(energy.length,Math.ceil(ms/1000*fs)); return total-(energy[n] || 0); };
  const e50=early(50),e80=early(80);
  const clarity=e=>total-e>0 && e>0?10*Math.log10(e/(total-e)):null;
  const centre=a.slice(peakIndex).reduce((s,v,i)=>s+i/fs*v*v,0)/total;
  const peaks=[];
  const minSpacing=Math.max(1,Math.round(fs*0.0005));
  for(let i=peakIndex+minSpacing;i<a.length-1 && (i-peakIndex)/fs<0.1;i++) {
    const amp=Math.abs(a[i]);
    if(amp>peak*0.03 && amp>Math.abs(a[i-1]) && amp>=Math.abs(a[i+1])) {
      const delayMs=(i-peakIndex)/fs*1000, relativeDb=20*Math.log10(amp/peak);
      if(peaks.length && delayMs-peaks.at(-1).delayMs<0.5) { if(relativeDb>peaks.at(-1).relativeDb) peaks[peaks.length-1]={delayMs,relativeDb}; }
      else peaks.push({delayMs,relativeDb});
    }
  }
  return {peakIndex, timeOrigin:m.data[peakIndex][0],snrDb,decay,peaks:peaks.slice(0,100),
    edt:fit(0,-10,20),t20:fit(-5,-25,35),t30:fit(-5,-35,45),c50:clarity(e50),c80:clarity(e80),d50:e50/total,centreTime:centre,
    evidence:'Calculated', notes:'Breitbandige Auswertung aus Messdaten; IR-Maximum dient als vermuteter Direktschall. Kein bandbegrenztes RT60, keine automatische Timing-Korrektur. Schroeder-Integration ohne Rauschkompensation: nur belastbare Fits werden angezeigt.'};
}
export function frequencyMetrics(m) {
  if(m.kind!=='frequency' || !m.data.every(row=>row.length===3)) return null;
  let previous=m.data[0][2];
  const unwrapped=m.data.map((row,i)=>{
    let angle=row[2];
    if(i) { while(angle-previous>180) angle-=360; while(angle-previous < -180) angle+=360; }
    previous=angle; return [row[0],angle];
  });
  const groupDelay=unwrapped.map((row,i)=>{
    const left=unwrapped[Math.max(0,i-1)],right=unwrapped[Math.min(unwrapped.length-1,i+1)];
    return [row[0],-(right[1]-left[1])/360/(right[0]-left[0])*1000];
  });
  return {unwrapped,groupDelay,evidence:'Calculated',notes:'Numerische Phasenableitung; Auflösung und Timing der Messung bestimmen die Aussagekraft.'};
}
