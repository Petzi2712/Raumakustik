import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {defaultProject} from '../src/core/project.js';
import {buildToolContext} from '../src/core/report.js';
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'raumakustik-packaged-'));
let app;
try{
  app=await electron.launch({executablePath:process.env.PACKAGED_EXECUTABLE||path.resolve('release/linux-unpacked/raumakustik-digital-twin'),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,XDG_CONFIG_HOME:directory,XDG_CACHE_HOME:directory}});
  const window=await app.firstWindow();await window.getByText('Modell · keine Messung',{exact:false}).waitFor();
  const info=await window.evaluate(()=>window.desktop.info());assert.equal(info.packaged,true);assert.equal(info.version,JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url))).version);
  await app.evaluate(()=>{let round=0;globalThis.fetch=async()=>{round++;return new Response(JSON.stringify(round===1?{output:[{type:'function_call',call_id:'packaged-fixture-call',name:'calculate_room_modes',arguments:'{}'}]}:{status:'completed',output:[{content:[{type:'output_text',text:'Paket: Moden lokal berechnet.'}]}]}),{status:200,headers:{'Content-Type':'application/json'}});};});
  await window.evaluate(()=>window.desktop.setKey('packaged-fixture-key',false));
  const result=await window.evaluate(context=>window.desktop.analyze('{}','Berechne die Moden','gpt-4.1',context),buildToolContext(defaultProject()));
  assert.equal(result.toolTrace[0].name,'calculate_room_modes');assert.equal(result.toolTrace[0].status,'calculated');assert.match(result.text,/lokal berechnet/);
  await window.evaluate(()=>window.desktop.setKey('',false));
  console.log('Packaged smoke passed: ASAR production renderer and dynamic ES-module acoustic tools; simulated Responses transport only.');
}finally{if(app)await app.close();await fs.rm(directory,{recursive:true,force:true});}
