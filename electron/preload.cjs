const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',Object.freeze({
  info:()=>ipcRenderer.invoke('app:info'),
  openProject:()=>ipcRenderer.invoke('project:open'),
  saveProject:content=>ipcRenderer.invoke('project:save',content),
  openChat:report=>ipcRenderer.invoke('chat:browser',report),
  aiStatus:()=>ipcRenderer.invoke('ai:status'),
  setKey:(key,remember)=>ipcRenderer.invoke('ai:key',key,remember),
  analyze:(report,question,model)=>ipcRenderer.invoke('ai:analyze',report,question,model),
  rewList:port=>ipcRenderer.invoke('rew:list',port),
  updateState:()=>ipcRenderer.invoke('updates:state'),
  checkUpdates:()=>ipcRenderer.invoke('updates:check'),
  downloadUpdate:()=>ipcRenderer.invoke('updates:download'),
  installUpdate:()=>ipcRenderer.invoke('updates:install'),
  onUpdate:callback=>{const listener=(_event,state)=>callback(state);ipcRenderer.on('updates:state',listener);return()=>ipcRenderer.removeListener('updates:state',listener);},
}));
