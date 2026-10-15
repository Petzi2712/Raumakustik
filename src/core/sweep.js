// Logarithmic sweep and regularized frequency-domain deconvolution.
// Raw samples are dimensionless digital full scale; this module never invents SPL.
export function fft(real,imag,inverse=false){
  const n=real.length;if(n<2||(n&(n-1))||imag.length!==n)throw new Error('FFT benötigt eine Zweierpotenz.');
  for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[real[i],real[j]]=[real[j],real[i]];[imag[i],imag[j]]=[imag[j],imag[i]];}}
  for(let size=2;size<=n;size*=2){const angle=(inverse?2:-2)*Math.PI/size,cr=Math.cos(angle),ci=Math.sin(angle);for(let start=0;start<n;start+=size){let wr=1,wi=0;for(let j=0;j<size/2;j++){const a=start+j,b=a+size/2,tr=wr*real[b]-wi*imag[b],ti=wr*imag[b]+wi*real[b];real[b]=real[a]-tr;imag[b]=imag[a]-ti;real[a]+=tr;imag[a]+=ti;const next=wr*cr-wi*ci;wi=wr*ci+wi*cr;wr=next;}}}
  if(inverse)for(let i=0;i<n;i++){real[i]/=n;imag[i]/=n;}
}
export function logSweep({sampleRate=48000,seconds=5,minHz=20,maxHz=20000,levelDb=-30}={}){
  if(![sampleRate,seconds,minHz,maxHz,levelDb].every(Number.isFinite)||!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000||!Number.isFinite(seconds)||seconds<.1||seconds>15||minHz<10||maxHz>sampleRate*.475||minHz>=maxHz||!Number.isFinite(levelDb)||levelDb> -3||levelDb< -80)throw new Error('Sweep: Frequenzen, Dauer oder Ausgangspegel ungültig (maximal −3 dBFS).');
  const n=Math.round(seconds*sampleRate);if(n>2000000)throw new Error('Sweep zu lang für diese Abtastrate.');
  const data=new Float32Array(n),T=n/sampleRate,K=T/Math.log(maxHz/minHz),amplitude=10**(levelDb/20),fade=Math.min(.02,T*.04);
  for(let i=0;i<n;i++){const t=i/sampleRate,edge=Math.min(1,t/fade,(T-t)/fade),window=.5-.5*Math.cos(Math.PI*Math.max(0,edge));data[i]=amplitude*window*Math.sin(2*Math.PI*minHz*K*Math.expm1(t/K));}
  return data;
}
export function levelMetrics(samples){let peak=0,sum=0;for(const v of samples){peak=Math.max(peak,Math.abs(v));sum+=v*v;}return {peakDb:20*Math.log10(Math.max(1e-12,peak)),rmsDb:10*Math.log10(Math.max(1e-24,sum/Math.max(1,samples.length))),clipped:peak>=.999};}
export function deconvolveSweep({recording,reference,sampleRate,minHz,maxHz,irSeconds=1,regularization=1e-8}){
  if(!recording?.length||!reference?.length||recording.length>2000000||reference.length>2000000||!Number.isFinite(sampleRate)||sampleRate<8000||!Number.isFinite(regularization)||regularization<=0)throw new Error('Ungültige Aufnahme.');
  let n=2;while(n<recording.length+reference.length)n*=2;
  const yr=new Float64Array(n),yi=new Float64Array(n),xr=new Float64Array(n),xi=new Float64Array(n);yr.set(recording);xr.set(reference);fft(yr,yi);fft(xr,xi);
  let maxPower=0;for(let i=0;i<n;i++)maxPower=Math.max(maxPower,xr[i]*xr[i]+xi[i]*xi[i]);if(maxPower<1e-16)throw new Error('Referenzsignal fehlt.');
  const floor=maxPower*regularization,frequency=[];let peak=0;
  for(const v of recording){if(!Number.isFinite(v))throw new Error('Nicht endliche Audiodaten.');peak=Math.max(peak,Math.abs(v));}
  const total=levelMetrics(recording);if(total.rmsDb< -100)throw new Error('Kein auswertbares Mikrofonsignal. Eingangsgerät und Kanal prüfen.');
  for(let i=0;i<n;i++){const power=xr[i]*xr[i]+xi[i]*xi[i],den=power+floor,re=(yr[i]*xr[i]+yi[i]*xi[i])/den,im=(yi[i]*xr[i]-yr[i]*xi[i])/den;yr[i]=re;yi[i]=im;}
  // Log-spaced response bins retain complex phase; values are transfer gain, not SPL.
  let last=-1;for(let f=minHz;f<=maxHz;f*=2**(1/96)){const k=Math.round(f*n/sampleRate);if(k<1||k>=n/2||k===last)continue;last=k;frequency.push([k*sampleRate/n,20*Math.log10(Math.max(1e-12,Math.hypot(yr[k],yi[k]))),Math.atan2(yi[k],yr[k])*180/Math.PI]);}
  fft(yr,yi,true);
  const count=Math.min(recording.length,Math.round(irSeconds*sampleRate),2000000);if(count<2)throw new Error('Impulsantwort zu kurz.');
  const impulse=Array.from({length:count},(_,i)=>[i/sampleRate,yr[i]]);
  return {impulse,frequency,quality:{...total,clipped:peak>=.999,frequencyResolution:sampleRate/n,regularization,notes:'Regularisierte Dekonvolution. Bandbegrenzte IR; Geräte-Latenz bleibt ohne Loopback unbekannt. Frequenzgang ist digitale Übertragungsverstärkung, kein SPL.'}};
}
