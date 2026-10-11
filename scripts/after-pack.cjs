const fs=require('node:fs/promises');
const path=require('node:path');
module.exports=async(context)=>{
  if(context.electronPlatformName!=='win32')return;
  const files=[],directories=[];
  async function walk(dir,relative=''){
    for(const entry of await fs.readdir(dir,{withFileTypes:true})){
      const item=path.join(relative,entry.name);
      if(entry.isDirectory()){directories.push(item);await walk(path.join(dir,entry.name),item);}
      else if(entry.isFile())files.push(item);
      else throw new Error(`Unsupported packaged entry: ${item}`);
    }
  }
  await walk(context.appOutDir);
  const escape=s=>s.replaceAll('$','$$').replaceAll('"','$\\"');
  const source=escape(context.appOutDir.replaceAll('\\','/'));
  const lines=[`!define ROOM_APP_DIR "${source}"`,'!macro DeleteInstalledApplication'];
  for(const f of files)lines.push(`  Delete "$INSTDIR\\${escape(f.replaceAll('/', '\\'))}"`);
  for(const d of directories.sort((a,b)=>b.split(path.sep).length-a.split(path.sep).length))lines.push(`  RMDir "$INSTDIR\\${escape(d.replaceAll('/', '\\'))}"`);
  lines.push('!macroend','');
  const target=path.join(context.packager.projectDir,'build');await fs.mkdir(target,{recursive:true});
  await fs.writeFile(path.join(target,'app-files.nsh'),lines.join('\n'),'utf8');
};
