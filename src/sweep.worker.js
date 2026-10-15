import {deconvolveSweep} from './core/sweep.js';
self.onmessage=({data})=>{try{self.postMessage(deconvolveSweep(data));}catch(e){self.postMessage({error:e.message});}};
