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
    evidence:'MEASURED',derived:true, notes:'Breitbandige Auswertung aus Messdaten; IR-Maximum dient als vermuteter Direktschall. Kein bandbegrenztes RT60, keine automatische Timing-Korrektur. Schroeder-Integration ohne Rauschkompensation: nur belastbare Fits werden angezeigt.'};
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
  return {unwrapped,groupDelay,evidence:'MEASURED',derived:true,notes:'Numerische Phasenableitung; Auflösung und Timing der Messung bestimmen die Aussagekraft.'};
}
// Hann-windowed STFT of the imported linear impulse response. Relative dB only.
export function impulseSpectrogram(m,{windowSize=4096,maxFrames=48}={}){
  if(m.kind!=='impulse'||m.data.length<256)return null;
  const size=2**Math.floor(Math.log2(Math.min(windowSize,m.data.length))),fs=m.sampleRate;
  function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}for(let len=2;len<=n;len<<=1){const angle=-2*Math.PI/len;for(let start=0;start<n;start+=len)for(let j=0;j<len/2;j++){const c=Math.cos(angle*j),s=Math.sin(angle*j),a=start+j,b=a+len/2,tr=re[b]*c-im[b]*s,ti=re[b]*s+im[b]*c;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;}}}
  const bins=[];for(let f=Math.max(20,fs/size);f<Math.min(20000,fs/2);f*=2**(1/12)){const index=Math.round(f*size/fs);if(!bins.some(b=>b.index===index))bins.push({index,frequency:f,low:Math.max(1,Math.ceil(f/2**(1/24)*size/fs)),high:Math.min(size/2-1,Math.floor(f*2**(1/24)*size/fs))});}
  const frames=[],last=m.data.length-size,hop=Math.max(size/4,Math.ceil(last/Math.max(1,maxFrames-1)));let max=0;
  for(let start=0;start<=last;start+=hop){const re=new Float64Array(size),im=new Float64Array(size);for(let i=0;i<size;i++)re[i]=m.data[start+i][1]*(.5-.5*Math.cos(2*Math.PI*i/(size-1)));fft(re,im);const amplitudes=bins.map(b=>{let power=0;const low=b.low<=b.high?b.low:b.index,high=b.low<=b.high?b.high:b.index;for(let i=low;i<=high;i++)power+=re[i]**2+im[i]**2;return Math.sqrt(power);});max=Math.max(max,...amplitudes);frames.push({time:(m.data[start][0]+m.data[start+size-1][0])/2,values:amplitudes});}
  for(const frame of frames)frame.values=frame.values.map(v=>20*Math.log10(Math.max(v/Math.max(max,1e-30),1e-6)));
  return {bins:bins.map(b=>b.frequency),bands:bins.map(b=>({lowHz:Math.min(b.low,b.high)*fs/size,highHz:Math.max(b.low,b.high)*fs/size})),frames,windowSize:size,frequencyResolution:fs/size,evidence:'MEASURED',notes:'Hann-STFT mit 1/12-Oktav-Leistungssummen (mindestens ein FFT-Bin); dB relativ zum globalen Spektrogrammmaximum. Zeit ist die Fenstermitte im unveränderten IR-Zeitbezug, keine automatische Timing-Korrektur.'};
}
