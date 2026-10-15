import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {boundarySurfaces,roomBounds,containsPoint,acousticPosition} from '../core/geometry.js';
import {modalPressure} from '../core/acoustics.js';
const xyz=p=>new THREE.Vector3(p[0],p[2],-p[1]);
export default function Scene({project,paths,mode,showPaths,showField,time,view,waveField,cameraState,onMove,source=project.sources[0],receiver=project.receivers[0]}) {
  const localCamera=useRef(null),moveRef=useRef(onMove),container=useRef(null), timeRef=useRef(time), [error,setError]=useState('');
  timeRef.current=time;moveRef.current=onMove;const savedCamera=cameraState||localCamera;
  useEffect(()=>{
    const el=container.current;
    let renderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}catch{setError('WebGL nicht verfügbar. Tabellen und Berechnungen bleiben nutzbar.');return;}
    setError('');renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setClearColor('#101b25',1);el.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),bounds=roomBounds(project.room),[w,d,h]=bounds.max.map((v,i)=>v-bounds.min[i]),center=bounds.max.map((v,i)=>(v+bounds.min[i])/2);
    let disposed=false;
    scene.add(new THREE.AmbientLight(0xffffff,2));
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(0,12,4);scene.add(light);
    const camera=new THREE.PerspectiveCamera(42,1,0.01,2000);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(xyz(center));controls.enableDamping=false;
    const size=Math.max(w,d,h);
    if(view==='top') camera.position.set(w/2,h+size*1.6,-d/2+0.001);
    else if(view==='front') camera.position.set(w/2,h/2,size*1.5);
    else if(view==='side') camera.position.set(w+size*1.8,h/2,-d/2);
    else if(view==='speaker'&&source?.id&&receiver?.id){camera.position.copy(xyz(acousticPosition(source)));controls.target.copy(xyz(receiver.position));}
    else if(view==='firstperson'&&receiver?.id){camera.position.copy(xyz(receiver.position));controls.target.copy(xyz([center[0],bounds.min[1],receiver.position[2]]));}
    else if(view==='listener'&&receiver?.id){camera.position.copy(xyz(receiver.position));controls.target.set(w/2,1,-0.1);}
    else camera.position.set(w+size*0.55,h+size*0.45,size*0.65);
    if(!['listener','speaker','firstperson'].includes(view))camera.position.add(xyz(bounds.min));
    if(savedCamera.current?.view===view){camera.position.fromArray(savedCamera.current.position);controls.target.fromArray(savedCamera.current.target);camera.zoom=savedCamera.current.zoom;camera.updateProjectionMatrix();}
    function remember(){savedCamera.current={view,position:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom};renderer.domElement.dataset.camera=JSON.stringify(savedCamera.current);}
    controls.addEventListener('end',remember);remember();
    const wheel=e=>{if(!e.ctrlKey){e.preventDefault();e.stopImmediatePropagation();}};renderer.domElement.addEventListener('wheel',wheel,{capture:true,passive:false});
    const draggables=[];
    for(const surface of boundarySurfaces(project)){
      const coords=[];for(let i=1;i<surface.points.length-1;i++)for(const p of [surface.points[0],surface.points[i],surface.points[i+1]])coords.push(p[0],p[2],-p[1]);
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.computeVertexNormals();
      const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:surface.kind==='object'?'#a67f52':surface.kind==='floor'?'#294758':'#78929e',side:THREE.DoubleSide,transparent:true,opacity:surface.kind==='floor'?.8:surface.kind==='object'?.6:.12,depthWrite:surface.kind==='floor'}));scene.add(mesh);
      scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:surface.kind==='object'?'#c59a69':'#536f80',transparent:true,opacity:.6})));
    }
    for(const object of project.objects||[]){if(!object.model)continue;
      try{
        const bytes=Uint8Array.from(atob(object.model.data),c=>c.charCodeAt(0));
        const attach=model=>{if(disposed)return;const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),middle=box.getCenter(new THREE.Vector3());model.position.sub(middle);const group=new THREE.Group();group.add(model);group.scale.set(object.size[0]/Math.max(.001,size.x),object.size[2]/Math.max(.001,size.y),object.size[1]/Math.max(.001,size.z));group.rotation.y=(object.rotation||0)*Math.PI/180;group.position.copy(xyz(object.position));scene.add(group);};
        if(object.model.format==='obj')attach(new OBJLoader().parse(new TextDecoder().decode(bytes)));
        else{const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(!/^(data:|blob:)/.test(url))throw new Error('Externe Modellressourcen nicht erlaubt.');return url;});new GLTFLoader(manager).parse(object.model.format==='gltf'?new TextDecoder().decode(bytes):bytes.buffer,'',result=>attach(result.scene),()=>setError('Importiertes Modell konnte nicht dargestellt werden; Box und Berechnungen bleiben verfügbar.'));}
      }catch{setError('3D-Import ungültig oder enthält externe Ressourcen.');}
    }
    const grid=new THREE.GridHelper(Math.ceil(size*2),Math.ceil(size*2)*2,0x446174,0x233947);grid.position.copy(xyz([center[0],center[1],bounds.min[2]-.005]));scene.add(grid);
    const axes=new THREE.AxesHelper(0.8);axes.position.set(0,0,0);scene.add(axes);
    function label(text,position,color){
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const c=canvas.getContext('2d');c.fillStyle=color;c.font='bold 28px sans-serif';c.textAlign='center';c.fillText(text,128,40);
      const map=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false}));sprite.position.copy(position);sprite.scale.set(1.1,0.275,1);scene.add(sprite);
    }
    project.sources.forEach(s=>{const obj=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.38,0.22),new THREE.MeshStandardMaterial({color:'#f9b55c'}));obj.position.copy(xyz(acousticPosition(s)));scene.add(obj);obj.userData={key:'sources',id:s.id,position:s.position};draggables.push(obj);label(s.id,obj.position.clone().add(new THREE.Vector3(0,0.4,0)),'#ffc979');});
    project.receivers.forEach(r=>{const obj=new THREE.Mesh(new THREE.SphereGeometry(0.105,16,16),new THREE.MeshStandardMaterial({color:'#5fdbc4'}));obj.position.copy(xyz(r.position));scene.add(obj);obj.userData={key:'receivers',id:r.id,position:r.position};draggables.push(obj);label(r.name,obj.position.clone().add(new THREE.Vector3(0,0.35,0)),'#5fdbc4');});
    for(const seat of project.listeningPositions){if(project.receivers.some(r=>r.id===(seat.receiverId||seat.id)))continue;const obj=new THREE.Mesh(new THREE.SphereGeometry(.14,16,12),new THREE.MeshStandardMaterial({color:'#edf1ff',wireframe:true}));obj.position.copy(xyz(seat.position));obj.userData={key:'listeningPositions',id:seat.id,position:seat.position};scene.add(obj);draggables.push(obj);label(seat.name,obj.position.clone().add(new THREE.Vector3(0,.6,0)),'#edf1ff');}
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let dragging=null;
    function ray(e){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);}
    function pointerDown(e){if(e.button!==0||!moveRef.current)return;ray(e);const hit=raycaster.intersectObjects(draggables)[0];if(!hit)return;e.stopImmediatePropagation();const obj=hit.object,plane=new THREE.Plane(new THREE.Vector3(0,1,0),-obj.position.y),point=new THREE.Vector3();raycaster.ray.intersectPlane(plane,point);dragging={obj,plane,start:obj.position.clone(),offset:obj.position.clone().sub(point)};controls.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);}
    function pointerMove(e){if(!dragging)return;e.stopImmediatePropagation();ray(e);const p=new THREE.Vector3();if(raycaster.ray.intersectPlane(dragging.plane,p))dragging.obj.position.copy(p.add(dragging.offset));}
    function pointerUp(e){if(!dragging)return;e.stopImmediatePropagation();const d=dragging;dragging=null;controls.enabled=true;const delta=d.obj.position.clone().sub(d.start),pos=[d.obj.userData.position[0]+delta.x,d.obj.userData.position[1]-delta.z,d.obj.userData.position[2]].map(v=>Math.round(v*100)/100);d.obj.position.copy(d.start);if(delta.length()>.005&&e.type!=='pointercancel')moveRef.current?.(d.obj.userData.key,d.obj.userData.id,pos);}
    const canvas=renderer.domElement;canvas.addEventListener('pointerdown',pointerDown,true);canvas.addEventListener('pointermove',pointerMove,true);canvas.addEventListener('pointerup',pointerUp,true);canvas.addEventListener('pointercancel',pointerUp,true);
    let numericalPoints=null,lastFrame=-1;const waveScale=waveField?.frames?.reduce((m,f)=>f.values.reduce((s,v)=>Math.max(s,Math.abs(v)),m),1e-15)||1;
    if(showField&&waveField?.frames?.length){const geo=new THREE.BufferGeometry(),coords=waveField.positions.flatMap(p=>[p[0],p[2],-p[1]]);geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(coords.length),3));numericalPoints=new THREE.Points(geo,new THREE.PointsMaterial({vertexColors:true,size:.09,transparent:true,opacity:.65}));scene.add(numericalPoints);}
    const beads=[];
    if(showPaths)for(const p of paths){
      const points=p.points.map(xyz),material=new THREE.LineBasicMaterial({color:p.order===0?'#5fdbc4':p.order===1?'#ffc979':'#8195df',transparent:true,opacity:p.order>1?0.28:0.8});
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material));
      const bead=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,8),new THREE.MeshBasicMaterial({color:p.order===0?'#ffffff':'#ffc979'}));
      scene.add(bead);beads.push({p,points,bead,source:project.sources.find(s=>s.id===p.sourceId)});
    }
    if(showField && mode && !waveField){
      const coords=[],colors=[];
      for(let i=1;i<21;i++)for(let j=1;j<25;j++)for(let k=1;k<10;k++){
        const p=[w*i/21,d*j/25,h*k/10].map((v,k)=>v+bounds.min[k]),v=modalPressure(mode,p.map((v,k)=>v-bounds.min[k]),[w,d,h]);
        coords.push(p[0],p[2],-p[1]);const color=new THREE.Color(v>=0?'#f4a55f':'#67b3e0');color.multiplyScalar(0.2+0.8*Math.abs(v));colors.push(color.r,color.g,color.b);
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
      scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:0.07,vertexColors:true,transparent:true,opacity:0.55})));
    }
    label('X →',new THREE.Vector3(w/2,0.05,0.5),'#becdd9');label('Y →',new THREE.Vector3(-0.6,0.05,-d/2),'#becdd9');label('Z ↑',new THREE.Vector3(-0.4,h/2,0),'#becdd9');
    const keys=new Set();const keyDown=e=>{if(view==='firstperson'&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))keys.add(e.key.toLowerCase());};const keyUp=e=>keys.delete(e.key.toLowerCase());window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);
    let frame;
    function resize(){const width=el.clientWidth,height=el.clientHeight;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    function render(){
      frame=requestAnimationFrame(render);
      for(const {p,points,bead,source} of beads){
        const current=timeRef.current;
        bead.visible=current>=source.delayMs && current<=p.arrivalMs;
        if(!bead.visible)continue;
        let remaining=(current-source.delayMs)/(p.arrivalMs-source.delayMs)*p.length;
        for(let i=1;i<points.length;i++){
          const segment=points[i].distanceTo(points[i-1]);
          if(remaining<=segment+1e-9){bead.position.copy(points[i-1]).lerp(points[i],Math.min(1,remaining/segment));break;}
          remaining-=segment;
        }
      }
      if(numericalPoints){const frames=waveField.frames;let index=0;for(let i=1;i<frames.length;i++)if(Math.abs(frames[i].timeMs-timeRef.current)<Math.abs(frames[index].timeMs-timeRef.current))index=i;if(index!==lastFrame){lastFrame=index;const values=frames[index].values,max=waveScale,colors=numericalPoints.geometry.attributes.color;for(let i=0;i<values.length;i++){const ratio=values[i]/max;colors.setXYZ(i,ratio>0?.2+.8*ratio:.1,.2+.5*Math.abs(ratio),ratio<0?.2+.8*-ratio:.15);}colors.needsUpdate=true;}}
      if(view==='firstperson'&&keys.size){const direction=new THREE.Vector3();camera.getWorldDirection(direction);direction.y=0;direction.normalize();const side=new THREE.Vector3().crossVectors(direction,new THREE.Vector3(0,1,0));const delta=new THREE.Vector3();if(keys.has('w'))delta.addScaledVector(direction,.025);if(keys.has('s'))delta.addScaledVector(direction,-.025);if(keys.has('a'))delta.addScaledVector(side,-.025);if(keys.has('d'))delta.addScaledVector(side,.025);camera.position.add(delta);controls.target.add(delta);}
      controls.update();renderer.render(scene,camera);
    }render();
    return()=>{remember();disposed=true;canvas.removeEventListener('pointerdown',pointerDown,true);canvas.removeEventListener('pointermove',pointerMove,true);canvas.removeEventListener('pointerup',pointerUp,true);canvas.removeEventListener('pointercancel',pointerUp,true);canvas.removeEventListener('wheel',wheel,true);window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});renderer.dispose();renderer.domElement.remove();};
  },[project,paths,mode,showPaths,showField,view,waveField,source,receiver]);
  return <div className="scene" ref={container}>{error&&<p className="scene-error">{error}</p>}</div>;
}
