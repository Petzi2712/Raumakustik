import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultProject,validateProject,parseProject,bandValue} from '../src/core/project.js';
import {soundSpeed,roomModes,modalPressure,reflectionPaths,reverberation,distance,matchReflections} from '../src/core/acoustics.js';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('Schallgeschwindigkeit und bekannte axiale Eigenfrequenz',()=>{
  const c=soundSpeed(20);near(c,343.21462268256795,1e-6);
  const modes=roomModes([5,4,2.5],340,100,[1,1,1],[2,2,1]);
  const axial=modes.find(m=>m.indices.join() === '1,0,0');
  near(axial.frequency,34);assert.equal(axial.kind,'axial');
  assert.ok(modes.every(m=>m.frequency<=100));
  assert.ok(modes.some(m=>m.kind==='tangential'));assert.ok(modes.some(m=>m.kind==='oblique'));
});
test('Eigenfeld hat Druckknoten bei halber axialer Länge',()=>{
  near(modalPressure({indices:[1,0,0]},[2.5,2,1],[5,4,3]),0);
  near(modalPressure({indices:[1,0,0]},[0,2,1],[5,4,3]),1);
});
test('Image Source: analytischer Frontwandpfad und SBIR',()=>{
  const p=defaultProject();p.room.dimensions=[5,6,3];
  const s={id:'S',position:[2.5,1,1.5],delayMs:2,polarity:1},r={id:'M',position:[2.5,4,1.5]};
  const paths=reflectionPaths(p,s,r,125),direct=paths.find(p=>!p.order),front=paths.find(p=>p.id==='front');
  near(direct.length,3);near(front.length,5);near(front.delta,2);
  near(front.points[1][1],0);near(front.firstNull,soundSpeed(20)/4);near(front.arrivalMs,5/soundSpeed(20)*1000+2);
  assert.ok(front.relativeDb<0);near(front.incidence[0],0);
  assert.ok(paths.some(p=>p.order===2));
});
test('Reflexionsgeometrie: Weglängen, Grenzen und Reflexionsgesetz für jede Ordnung',()=>{
  const p=defaultProject(),s=p.sources[0],r=p.receivers[0];
  for(const ray of reflectionPaths(p,s,r,1000)){
    near(ray.length,ray.points.slice(1).reduce((n,v,i)=>n+distance(v,ray.points[i]),0));
    assert.ok(ray.points.every(v=>v.every((x,i)=>x>=-1e-7 && x<=p.room.dimensions[i]+1e-7)));
    for(let i=1;i<ray.points.length-1;i++){
      const id=ray.surfaces[i-1],axis=['left','right'].includes(id)?0:['front','back'].includes(id)?1:2;
      const incoming=ray.points[i].map((x,k)=>(x-ray.points[i-1][k])/distance(ray.points[i],ray.points[i-1]));
      const outgoing=ray.points[i+1].map((x,k)=>(x-ray.points[i][k])/distance(ray.points[i+1],ray.points[i]));
      incoming.forEach((v,k)=>near(outgoing[k],k===axis?-v:v,1e-7));
    }
  }
});
test('Volle Absorption entfernt spekulare Reflexionsenergie',()=>{
  const p=defaultProject();p.room.surfaces.front.absorption.fill(1);
  const paths=reflectionPaths(p,p.sources[0],p.receivers[0],500);
  assert.equal(paths.find(p=>p.id==='front').relativeDb,-120);
  assert.equal(paths.find(p=>p.id==='direct').relativeDb,0);
});
test('Sabine und Schroeder stimmen mit analytischer Rechnung überein',()=>{
  const p=defaultProject();p.room.dimensions=[5,4,3];
  Object.values(p.room.surfaces).forEach(s=>s.absorption.fill(0.2));
  const result=reverberation(p.room,1000);near(result.absorptionArea,18.8);near(result.t60,0.161*60/18.8);near(result.schroeder,2000*Math.sqrt(result.t60/60));
  Object.values(p.room.surfaces).forEach(s=>s.absorption.fill(0));assert.equal(reverberation(p.room,1000).t60,null);
});
test('Bandinterpolation logarithmisch, Projektvalidierung schützt Grenzen',()=>{
  near(bandValue([0,1,1,1,1,1],Math.sqrt(125*250)),0.5);
  const p=defaultProject();assert.deepEqual(parseProject(JSON.stringify(p)),p);
  p.room.dimensions[0]=0;assert.throws(()=>validateProject(p),/Raumabmessung/);
  const p2=defaultProject();p2.room.surfaces.left.transmission.fill(1);assert.throws(()=>validateProject(p2),/Transmission/);
});
test('Qualitative Reflexionszuordnung hält Mehrdeutigkeit ohne Wahrscheinlichkeitsprozente',()=>{
  const matches=matchReflections([{delayMs:5,relativeDb:-8}],[{id:'a',order:1,delayMs:5},{id:'b',order:1,delayMs:5.2}]);
  assert.equal(matches[0].evidence,'INFERRED');assert.equal(matches[0].candidates.length,2);assert.equal(matches[0].candidates[0].timeErrorMs,0);assert.equal(matches[0].candidates[0].confidenceLevel,'zeitlich passend');assert.equal('confidence' in matches[0].candidates[0],false);
});
test('Koinzidente Quell- und Empfängerpositionen werden nicht berechnet',()=>{
  const p=defaultProject();assert.throws(()=>reflectionPaths(p,p.sources[0],{id:'M',position:p.sources[0].position},100),/Abstand/);
});
