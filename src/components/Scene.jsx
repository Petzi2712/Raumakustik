import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {modalPressure} from '../core/acoustics.js';
const xyz=p=>new THREE.Vector3(p[0],p[2],-p[1]);
export default function Scene({project,paths,mode,showPaths,showField,time,view}) {
  const container=useRef(null), timeRef=useRef(time), [error,setError]=useState('');
  timeRef.current=time;
  useEffect(()=>{
    const el=container.current;
    let renderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setError('WebGL nicht verfügbar. Tabellen und Berechnungen bleiben nutzbar.');return;}
    setError('');renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setClearColor('#101b25',1);el.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),[w,d,h]=project.room.dimensions;
    scene.add(new THREE.AmbientLight(0xffffff,2));
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(0,12,4);scene.add(light);
    const camera=new THREE.PerspectiveCamera(42,1,0.01,200);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(w/2,h/2,-d/2);controls.enableDamping=true;
    const size=Math.max(w,d,h);
    if(view==='top') camera.position.set(w/2,h+size*1.6,-d/2+0.001);
    else if(view==='front') camera.position.set(w/2,h/2,size*1.5);
    else if(view==='side') camera.position.set(w+size*1.8,h/2,-d/2);
    else if(view==='listener'){camera.position.copy(xyz(project.receivers[0].position));controls.target.set(w/2,1,-0.1);}
    else camera.position.set(w+size*0.55,h+size*0.45,size*0.65);
    const roomGeo=new THREE.BoxGeometry(w,h,d),edges=new THREE.EdgesGeometry(roomGeo);
    const outline=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:'#5a7185'}));outline.position.set(w/2,h/2,-d/2);scene.add(outline);roomGeo.dispose();
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({color:'#1c3040',side:THREE.DoubleSide,transparent:true,opacity:0.8}));floor.rotation.x=-Math.PI/2;floor.position.set(w/2,-0.01,-d/2);scene.add(floor);
    const grid=new THREE.GridHelper(Math.ceil(size*2),Math.ceil(size*2)*2,0x446174,0x233947);grid.position.set(w/2,-0.005,-d/2);scene.add(grid);
    const axes=new THREE.AxesHelper(0.8);axes.position.set(0,0,0);scene.add(axes);
    function label(text,position,color){
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const c=canvas.getContext('2d');c.fillStyle=color;c.font='bold 28px sans-serif';c.textAlign='center';c.fillText(text,128,40);
      const map=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false}));sprite.position.copy(position);sprite.scale.set(1.1,0.275,1);scene.add(sprite);
    }
    project.sources.forEach(s=>{const obj=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.38,0.22),new THREE.MeshStandardMaterial({color:'#f9b55c'}));obj.position.copy(xyz(s.position));scene.add(obj);label(s.id,obj.position.clone().add(new THREE.Vector3(0,0.4,0)),'#ffc979');});
    project.receivers.forEach(r=>{const obj=new THREE.Mesh(new THREE.SphereGeometry(0.105,16,16),new THREE.MeshStandardMaterial({color:'#5fdbc4'}));obj.position.copy(xyz(r.position));scene.add(obj);label(r.name,obj.position.clone().add(new THREE.Vector3(0,0.35,0)),'#5fdbc4');});
    const beads=[];
    if(showPaths)for(const p of paths){
      const points=p.points.map(xyz),material=new THREE.LineBasicMaterial({color:p.order===0?'#5fdbc4':p.order===1?'#ffc979':'#8195df',transparent:true,opacity:p.order>1?0.28:0.8});
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material));
      const bead=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,8),new THREE.MeshBasicMaterial({color:p.order===0?'#ffffff':'#ffc979'}));
      scene.add(bead);beads.push({p,points,bead,source:project.sources.find(s=>s.id===p.sourceId)});
    }
    if(showField && mode){
      const coords=[],colors=[];
      for(let i=1;i<21;i++)for(let j=1;j<25;j++)for(let k=1;k<10;k++){
        const p=[w*i/21,d*j/25,h*k/10],v=modalPressure(mode,p,project.room.dimensions);
        coords.push(p[0],p[2],-p[1]);const color=new THREE.Color(v>=0?'#f4a55f':'#67b3e0');color.multiplyScalar(0.2+0.8*Math.abs(v));colors.push(color.r,color.g,color.b);
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
      scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:0.07,vertexColors:true,transparent:true,opacity:0.55})));
    }
    label('X →',new THREE.Vector3(w/2,0.05,0.5),'#becdd9');label('Y →',new THREE.Vector3(-0.6,0.05,-d/2),'#becdd9');label('Z ↑',new THREE.Vector3(-0.4,h/2,0),'#becdd9');
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
      controls.update();renderer.render(scene,camera);
    }render();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});renderer.dispose();renderer.domElement.remove();};
  },[project,paths,mode,showPaths,showField,view]);
  return <div className="scene" ref={container}>{error&&<p className="scene-error">{error}</p>}</div>;
}
