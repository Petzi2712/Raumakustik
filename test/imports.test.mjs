import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRewText,parseWav,measurementQuality} from '../src/core/imports.js';
import {exampleProject as defaultProject,validateProject} from '../src/core/project.js';
import {impulseMetrics,frequencyMetrics} from '../src/core/measurement.js';
function wav(samples,{bits=16,format=1,channels=1,fs=48000}={}){
  const b=new ArrayBuffer(44+samples.length*bits/8),v=new DataView(b);
  const text=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
  text(0,'RIFF');v.setUint32(4,b.byteLength-8,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,format,true);v.setUint16(22,channels,true);v.setUint32(24,fs,true);v.setUint32(28,fs*channels*bits/8,true);v.setUint16(32,channels*bits/8,true);v.setUint16(34,bits,true);text(36,'data');v.setUint32(40,b.byteLength-44,true);
  samples.forEach((n,i)=>{if(format===3)v.setFloat32(44+i*4,n,true);else v.setInt16(44+i*2,Math.round(n*32767),true);});return b;
}
test('REW-Text mit Headern, Phase und Dezimalkomma',()=>{
  const m=parseRewText('* REW export\nFrequency SPL Phase\n20,0;76,3;-5,0\n40,0;80,0;-20,0');
  assert.deepEqual(m.data,[[20,76.3,-5],[40,80,-20]]);assert.equal(m.kind,'frequency');
});
test('Text-IR normalisiert Millisekunden und prüft Sample Rate',()=>{
  const m=parseRewText('0 1\n0.0208333333 0.5\n0.0416666666 0.1','impulse','milliseconds');
  assert.ok(Math.abs(m.sampleRate-48000)<0.01);assert.equal(m.data[1][1],0.5);
  assert.throws(()=>parseRewText('0 1\n0.001 0.5\n0.005 0.1','impulse'),/gleichmäßige/);
  assert.throws(()=>parseRewText('40 1\n20 2'),/aufsteigend/);
});
test('WAV PCM und Float dekodieren korrekt',()=>{
  const m=parseWav(wav([0,0.5,-0.5,1]));assert.equal(m.sampleRate,48000);assert.ok(Math.abs(m.data[1][1]-0.5)<0.0001);assert.equal(m.metadata.timingReference,false);
  const f=parseWav(wav([0,-0.75,0.25],{bits:32,format:3}));assert.equal(f.data[1][1],-0.75);
});
test('Beschädigte WAV, Mehrkanal und nicht endliche Werte werden abgewiesen',()=>{
  assert.throws(()=>parseWav(new ArrayBuffer(3)),/RIFF/);
  assert.throws(()=>parseWav(wav([0,0.1,0,0.1],{channels:2})),/Mono/);
  assert.throws(()=>parseWav(wav([NaN,0],{bits:32,format:3})),/ungültige Samples/);
  const b=wav([0,0.5]);new DataView(b).setUint32(40,100000,true);assert.throws(()=>parseWav(b),/Chunk/);
});
test('Dokumentationsscore behandelt fehlende Nachweise als unbekannt',()=>{
  const p=defaultProject(),m=parseRewText('20 80\n40 83');const q=measurementQuality(m,p);assert.equal(q.score,0);
  m.metadata={timingReference:true,micCalibration:true,splCalibration:true,sweepComplete:true,clockVerified:true,roomState:true,sourceId:'L',receiverId:'M1'};
  assert.equal(measurementQuality(m,p).score,100);
});
test('Exponentielles Decay mit bekanntem T60 wird richtig erkannt',()=>{
  const fs=8000,t60=0.6,data=Array.from({length:16000},(_,i)=>[i/fs,Math.exp(-3*Math.log(10)*i/fs/t60)]);
  const m={kind:'impulse',data,sampleRate:fs};const q=impulseMetrics(m);
  for(const key of ['edt','t20','t30'])assert.ok(Math.abs(q[key].seconds-t60)<0.003,`${key}: ${q[key]?.seconds}`);
  assert.ok(q.d50>0&&q.d50<1);assert.ok(q.c80>q.c50);assert.ok(q.centreTime>0);
});
test('IR-Analyse erkennt Peaks, Nullsignal und zu kurzen Decay',()=>{
  const data=Array.from({length:800},(_,i)=>[i/8000,0]);data[0][1]=1;data[40][1]=0.5;
  const q=impulseMetrics({kind:'impulse',data,sampleRate:8000});assert.equal(q.peaks[0].delayMs,5);assert.ok(Math.abs(q.peaks[0].relativeDb+6.020599913)<1e-6);
  assert.equal(q.t30,null);
  assert.throws(()=>impulseMetrics({kind:'impulse',data:[[0,0],[0.001,0]],sampleRate:1000}),/Nullen/);
});
test('Gruppenlaufzeit erhält konstanten bekannten Delay trotz Phasen-Wrapping',()=>{
  const delay=0.002;
  const data=Array.from({length:20},(_,i)=>{const f=100+i*100,phase=((-360*f*delay+180)%360+360)%360-180;return [f,80,phase];});
  const q=frequencyMetrics({kind:'frequency',data});q.groupDelay.forEach(p=>assert.ok(Math.abs(p[1]-2)<1e-8));
});
test('Projektimport weist ungültige Messdaten ab',()=>{
  const p=defaultProject();p.measurements=[{id:'m',name:'x',kind:'frequency',data:[[20,80],[10,81]],metadata:{}}];assert.throws(()=>validateProject(p),/aufsteigend/);
});
