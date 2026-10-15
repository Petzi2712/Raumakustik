import {simulateWave} from './core/wave.js';
self.onmessage=({data})=>{try{self.postMessage(simulateWave(data.project,data.source,data.receiver,data.options));}catch(e){self.postMessage({error:e.message});}};
