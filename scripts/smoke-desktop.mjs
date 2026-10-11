import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {defaultProject} from '../src/core/project.js';
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'raumakustik-smoke-'));
const server=http.createServer((req,res)=>{if(req.url==='/measurements'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify([{id:'test-1',title:'Fixture measurement'}]));}else{res.statusCode=404;res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let app;
try{
  app=await electron.launch({args:['.','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,XDG_CONFIG_HOME:directory,XDG_CACHE_HOME:directory}});
  const window=await app.firstWindow();const errors=[];window.on('pageerror',e=>errors.push(e.message));
  await window.getByText('Modell · keine Messung',{exact:false}).waitFor();
  const info=await window.evaluate(()=>window.desktop.info());assert.equal(info.packaged,false);assert.equal(info.version,'0.1.0');
  assert.equal(await window.evaluate(()=>typeof window.require),'undefined');assert.equal(await window.evaluate(()=>typeof window.process),'undefined');
  const target=path.join(directory,'saved.raum');
  const contents=JSON.stringify(defaultProject());await fs.writeFile(target,contents);
  await app.evaluate(({dialog,shell},target)=>{
    dialog.showSaveDialog=async()=>({canceled:false,filePath:target});
    dialog.showOpenDialog=async()=>({canceled:false,filePaths:[target]});
    shell.openExternal=async url=>{globalThis.testExternalUrl=url;};
    const realFetch=globalThis.fetch;
    globalThis.fetch=async(url,opts)=>{
      if(url==='https://api.openai.com/v1/responses'){
        globalThis.testAiBody=JSON.parse(opts.body);
        return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:'Fixture: überprüfbare Akustik-Einschätzung.'}]}],usage:{output_tokens:8}}),{status:200,headers:{'Content-Type':'application/json'}});
      }return realFetch(url,opts);
    };
  },target);
  assert.equal(await window.evaluate(text=>window.desktop.saveProject(text),contents),true);
  assert.equal(await fs.readFile(target,'utf8'),contents);
  assert.equal(await window.evaluate(()=>window.desktop.openProject()),contents);
  await window.evaluate(()=>window.desktop.openChat('{"room":"fixture"}'));
  assert.equal(await app.evaluate(()=>globalThis.testExternalUrl),'https://chatgpt.com/');
  const clipboard=await app.evaluate(({clipboard})=>clipboard.readText());assert.ok(clipboard.includes('fixture'));
  const summary=await window.evaluate(port=>window.desktop.rewList(port),server.address().port);assert.equal(summary[0].id,'test-1');
  await window.evaluate(()=>window.desktop.setKey('fixture-key-for-transport-test',false));
  const status=await window.evaluate(()=>window.desktop.aiStatus());assert.equal(status.hasKey,true);
  const result=await window.evaluate(()=>window.desktop.analyze('{"Calculated":true}','Prüfe Modellgrenzen','gpt-4.1'));assert.match(result.text,/Fixture/);
  const body=await app.evaluate(()=>globalThis.testAiBody);assert.equal(body.store,false);assert.equal(body.model,'gpt-4.1');assert.equal(body.max_output_tokens,3000);
  assert.ok(body.instructions.includes('du ersetzt ihn nicht'));
  await window.evaluate(()=>window.desktop.setKey('',false));assert.equal((await window.evaluate(()=>window.desktop.aiStatus())).hasKey,false);
  const error=await window.evaluate(async()=>{try{await window.desktop.analyze('{}','x','gpt-4.1');return '';}catch(e){return e.message;}});assert.match(error,/API-Schlüssel/);
  const updateError=await window.evaluate(async()=>{try{await window.desktop.checkUpdates();return '';}catch(e){return e.message;}});assert.match(updateError,/installierten Programm/);
  assert.deepEqual(errors,[]);
  console.log('Electron-Smoke erfolgreich: produktive file://-Oberfläche, sandbox/contextIsolation, IPC, Projekt speichern/laden, ChatGPT-Clipboard/Browserübergabe, REW-HTTP-Fixture, API-Vertrag mit simuliertem Transport, Schlüssel löschen, Update-Entwicklungsmodus. Keine Live-API oder Windows-DPAPI behauptet.');
}finally{if(app)await app.close();await new Promise(resolve=>server.close(resolve));await fs.rm(directory,{recursive:true,force:true});}
