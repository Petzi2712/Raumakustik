class RoomCapture extends AudioWorkletProcessor {
  constructor(){super();this.active=false;this.buffers=[];this.index=0;this.port.onmessage=({data})=>{if(data==='start'){this.active=true;this.buffers=[];this.index=0;}if(data==='stop'){this.flush();this.active=false;this.port.postMessage({done:true});}};}
  flush(){if(this.index){this.port.postMessage({channels:this.buffers.map(b=>b.slice(0,this.index))});this.index=0;}}
  process(inputs){const channels=inputs[0];if(!this.active||!channels?.length)return true;if(this.buffers.length!==channels.length){this.flush();this.buffers=channels.map(()=>new Float32Array(2048));}for(let i=0;i<channels[0].length;i++){for(let c=0;c<channels.length;c++)this.buffers[c][this.index]=channels[c][i];this.index++;if(this.index===2048)this.flush();}return true;}
}
registerProcessor('room-capture',RoomCapture);
