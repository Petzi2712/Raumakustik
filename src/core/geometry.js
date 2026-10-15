// Coordinates are always metres: X right, Y rear, Z up. No bounding-box acoustics.
export const EPS=1e-7;
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>Math.hypot(...a);
export const unit=a=>mul(a,1/norm(a));
export const length=(a,b)=>norm(sub(a,b));
export function signedArea(points){return points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2;}
const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
export function pointInPolygon(p,poly){
  p=p.slice(0,2);
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[j],b=poly[i];
    if(Math.abs(orient(a,b,p))<EPS && dot(sub(p,a),sub(p,b))<=EPS)return true;
    if((a[1]>p[1])!==(b[1]>p[1]) && p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }return inside;
}
export function segmentDistance(p,a,b){const d=sub(b,a),t=Math.max(0,Math.min(1,dot(sub(p,a),d)/dot(d,d)));return length(p,add(a,mul(d,t)));}
function properIntersection(a,b,c,d){return orient(a,b,c)*orient(a,b,d)<-EPS && orient(c,d,a)*orient(c,d,b)<-EPS;}
export function triangulate(poly){
  if(poly.length<3)throw new Error('Mindestens drei Wandpunkte erforderlich.');
  if(Math.abs(signedArea(poly))<EPS)throw new Error('Grundriss hat keine Fläche.');
  for(let i=0;i<poly.length;i++)for(let j=i+1;j<poly.length;j++){
    if(j===i+1 || (i===0&&j===poly.length-1))continue;
    if(properIntersection(poly[i],poly[(i+1)%poly.length],poly[j],poly[(j+1)%poly.length]))throw new Error('Wandsegmente schneiden sich.');
    if(segmentDistance(poly[j],poly[i],poly[(i+1)%poly.length])<EPS)throw new Error('Grundriss berührt sich oder enthält doppelte Punkte.');
  }
  const sign=Math.sign(signedArea(poly)),indices=poly.map((_,i)=>i),result=[];
  const inTri=(p,a,b,c)=>[orient(a,b,p),orient(b,c,p),orient(c,a,p)].every(v=>sign*v>=-EPS);
  while(indices.length>3){
    let ear=false;
    for(let j=0;j<indices.length;j++){
      const a=indices[(j+indices.length-1)%indices.length],b=indices[j],c=indices[(j+1)%indices.length];
      if(sign*orient(poly[a],poly[b],poly[c])<=EPS)continue;
      if(indices.some(i=>![a,b,c].includes(i)&&inTri(poly[i],poly[a],poly[b],poly[c])))continue;
      result.push([a,b,c]);indices.splice(j,1);ear=true;break;
    }
    if(!ear)throw new Error('Ungültiges oder entartetes Polygon.');
  }result.push(indices);return result;
}
export function zoneFromPoints(points,height=2.7,id='zone-1',name='Hauptzone'){
  return {id,name,vertices:points.map((p,i)=>({id:`${id}-v${i+1}`,x:p[0],y:p[1],floor:0,ceiling:height})),edges:points.map((_,i)=>({id:`${id}-w${i+1}`,materialKey:'front'}))};
}
export function roomZones(room){
  if(room.zones?.length)return room.zones;
  const [x,y,z]=room.dimensions,zone=zoneFromPoints([[0,0],[x,0],[x,y],[0,y]],z);
  ['front','right','back','left'].forEach((id,i)=>zone.edges[i]={id,materialKey:id});return [zone];
}
export function geometryPreset(kind,dimensions,frequency=200){
  if(!Number.isFinite(frequency)||frequency<20||frequency>96000)throw new Error('Geometrie-Grenzfrequenz: 20–96000 Hz.');
  const [w,d,h]=dimensions;let p;
  if(kind==='L')p=[[0,0],[w,0],[w,d*.45],[w*.55,d*.45],[w*.55,d],[0,d]];
  else if(kind==='U')p=[[0,0],[w,0],[w,d],[w*.7,d],[w*.7,d*.4],[w*.3,d*.4],[w*.3,d],[0,d]];
  else if(kind==='T')p=[[0,0],[w,0],[w,d*.35],[w*.65,d*.35],[w*.65,d],[w*.35,d],[w*.35,d*.35],[0,d*.35]];
  else if(kind==='trapezoid')p=[[0,0],[w,0],[w*.8,d],[w*.2,d]];
  else if(kind==='niche')p=[[0,0],[w,0],[w,d*.4],[w*.8,d*.4],[w*.8,d*.65],[w,d*.65],[w,d],[0,d]];
  else if(['circle','ellipse','curved'].includes(kind)){
    const rx=w/2,ry=kind==='circle'?w/2:d/2;
    const tolerance=Math.min(.02,343/(12*frequency));
    const n=Math.min(384,Math.max(24,Math.ceil(Math.PI/Math.acos(Math.max(-1,1-tolerance/Math.max(rx,ry))))));
    p=Array.from({length:n},(_,i)=>[rx+rx*Math.cos(i*2*Math.PI/n),ry+ry*Math.sin(i*2*Math.PI/n)]);
  }else p=[[0,0],[w,0],[w,d],[0,d]];
  const zone=zoneFromPoints(p,h);
  if(['circle','ellipse','curved'].includes(kind))zone.curveApproximation={kind,frequency,maxChordError:(kind==='circle'?w:Math.max(w,d))/2*(1-Math.cos(Math.PI/p.length)),segments:p.length};
  if(kind==='roof')for(const v of zone.vertices)v.ceiling=h*(.55+.45*v.x/w);
  if(kind==='levels')for(const v of zone.vertices)v.floor=.4*v.x/w;
  return zone;
}
export function validateZone(zone){
  if(typeof zone.id!=='string'||!zone.id || !Array.isArray(zone.vertices)||zone.vertices.length<3||zone.vertices.length>512||zone.edges?.length!==zone.vertices.length)throw new Error('Zone: 3–512 Punkte und je ein Wandsegment erforderlich.');
  const ids=new Set();
  for(const v of zone.vertices){
    if(typeof v.id!=='string'||ids.has(v.id))throw new Error('Doppelte Punkt-ID.');ids.add(v.id);
    if(![v.x,v.y,v.floor,v.ceiling].every(Number.isFinite)||Math.max(Math.abs(v.x),Math.abs(v.y),Math.abs(v.floor),Math.abs(v.ceiling))>100 || v.ceiling-v.floor<.2)throw new Error('Ungültige Höhe oder Koordinate (Grenze ±100 m, freie Höhe ≥20 cm).');
  }
  const poly=zone.vertices.map(v=>[v.x,v.y]);triangulate(poly);
  for(let i=0;i<poly.length;i++){
    if(length(poly[i],poly[(i+1)%poly.length])<.02)throw new Error('Wandsegmente benötigen mindestens 2 cm Länge.');
    const e=zone.edges[i];if(typeof e.id!=='string')throw new Error('Wand-ID fehlt.');
    if(e.opening){
      const o=e.opening,a=zone.vertices[i],b=zone.vertices[(i+1)%poly.length];
      if(![o.start,o.end,o.bottom,o.top].every(Number.isFinite)||o.start<0||o.end>1||o.end-o.start<.001||o.bottom<Math.max(a.floor,b.floor)-EPS||o.top>Math.min(a.ceiling,b.ceiling)+EPS||o.top-o.bottom<.02)throw new Error('Öffnung muss innerhalb der Wand liegen (Start/Ende 0–1, Höhen in Metern).');
    }
  }return zone;
}
function barycentric(p,a,b,c){const det=orient(a,b,c);return [orient(p,b,c)/det,orient(a,p,c)/det,orient(a,b,p)/det];}
export function verticalLimits(zone,p){
  const vertices=zone.vertices,poly=vertices.map(v=>[v.x,v.y]);
  if(!pointInPolygon(p,poly))return null;
  for(const tri of triangulate(poly)){
    const weights=barycentric(p,...tri.map(i=>poly[i]));
    if(weights.every(v=>v>=-EPS))return {floor:weights.reduce((s,v,i)=>s+v*vertices[tri[i]].floor,0),ceiling:weights.reduce((s,v,i)=>s+v*vertices[tri[i]].ceiling,0)};
  }return null;
}
const zoneCache=new WeakMap();
function preparedZones(room){if(!zoneCache.has(room))zoneCache.set(room,roomZones(room).map(z=>({...z,triangles:triangulate(z.vertices.map(v=>[v.x,v.y]))})));return zoneCache.get(room);}
export function containsPoint(room,p,margin=0){
  return preparedZones(room).some(z=>{
    const poly=z.vertices.map(v=>[v.x,v.y]);if(!pointInPolygon(p,poly))return false;
    if(margin>0 && poly.some((a,i)=>segmentDistance(p.slice(0,2),a,poly[(i+1)%poly.length])<margin-EPS))return false;
    for(const tri of z.triangles){const w=barycentric(p,...tri.map(i=>poly[i]));if(w.every(v=>v>=-EPS))return p[2]>=w.reduce((s,v,i)=>s+v*z.vertices[tri[i]].floor,0)+margin-EPS && p[2]<=w.reduce((s,v,i)=>s+v*z.vertices[tri[i]].ceiling,0)-margin+EPS;}return false;
  });
}
export function objectLocal(object,p){const [x,y,z]=sub(p,object.position),angle=-(object.rotation||0)*Math.PI/180;return [x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle),z];}
export function insideObject(object,p,margin=0){return object.acoustic!==false && objectLocal(object,p).every((v,i)=>Math.abs(v)<object.size[i]/2+margin-EPS);}
export function usablePoint(project,p,margin=.05){return containsPoint(project.room,p,margin)&&!(project.objects||[]).some(o=>insideObject(o,p,margin));}
export function interiorPoint(room){
  for(const zone of roomZones(room)){const poly=zone.vertices.map(v=>[v.x,v.y]);for(const tri of triangulate(poly)){const p=[0,1].map(k=>tri.reduce((s,i)=>s+poly[i][k]/3,0));const h=verticalLimits(zone,p);if(h)return [...p,(h.floor+h.ceiling)/2];}}throw new Error('Kein Innenpunkt.');
}
export function roomBounds(room){const v=roomZones(room).flatMap(z=>z.vertices);return {min:[Math.min(...v.map(p=>p.x)),Math.min(...v.map(p=>p.y)),Math.min(...v.map(p=>p.floor))],max:[Math.max(...v.map(p=>p.x)),Math.max(...v.map(p=>p.y)),Math.max(...v.map(p=>p.ceiling))]};}
function makeSurface(id,boundaryId,points,material,kind,zoneId){
  const n=cross(sub(points[1],points[0]),sub(points[2],points[0]));if(norm(n)<EPS)return null;
  let area=0;for(let i=1;i<points.length-1;i++)area+=norm(cross(sub(points[i],points[0]),sub(points[i+1],points[0])))/2;
  return {id,boundaryId,points,normal:unit(n),area,material,kind,zoneId};
}
export function boundarySurfaces(project,includeObjects=true){
  const result=[],room=project.room;
  function push(...args){const surface=makeSurface(...args);if(surface)result.push(surface);}
  for(const zone of roomZones(room)){
    const vertices=zone.vertices,poly=vertices.map(v=>[v.x,v.y]);
    for(const [j,tri] of triangulate(poly).entries())for(const kind of ['floor','ceiling'])push(`${zone.id}-${kind}-${j}`,`${zone.id}-${kind}`,tri.map(i=>[vertices[i].x,vertices[i].y,vertices[i][kind]]),zone.materials?.[kind]||room.surfaces[kind],kind,zone.id);
    vertices.forEach((a,i)=>{
      const b=vertices[(i+1)%vertices.length],edge=zone.edges[i],material=edge.material||room.surfaces[edge.materialKey||'front'];
      const at=(u,z)=>[a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u,z];
      const floor=u=>a.floor+(b.floor-a.floor)*u,ceil=u=>a.ceiling+(b.ceiling-a.ceiling)*u;
      function panel(s,e,lo,hi,suffix=''){push(`${edge.id}${suffix}`,edge.id,[at(s,lo(s)),at(e,lo(e)),at(e,hi(e)),at(s,hi(s))],material,'wall',zone.id);}
      const o=edge.opening;
      if(!o || o.open===false)panel(0,1,floor,ceil);
      else{
        panel(0,o.start,floor,ceil,'-before');panel(o.end,1,floor,ceil,'-after');
        panel(o.start,o.end,floor,()=>o.bottom,'-below');panel(o.start,o.end,()=>o.top,ceil,'-above');
      }
    });
  }
  if(includeObjects)for(const obj of project.objects||[]){
    if(obj.acoustic===false)continue;
    const angle=(obj.rotation||0)*Math.PI/180;
    const points=Array.from({length:8},(_,i)=>{const x=(i&1?.5:-.5)*obj.size[0],y=(i&2?.5:-.5)*obj.size[1],z=(i&4?.5:-.5)*obj.size[2];return add(obj.position,[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle),z]);});
    [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]].forEach((v,i)=>push(`${obj.id}-face-${i}`,`${obj.id}-face-${i}`,v.map(k=>points[k]),obj.material||room.surfaces.front,'object',obj.id));
  }
  for(const s of result){
    if(s.kind==='floor'&&s.normal[2]<0||s.kind==='ceiling'&&s.normal[2]>0)s.normal=mul(s.normal,-1);
    if(s.kind==='wall'){const zone=roomZones(room).find(z=>z.id===s.zoneId);s.normal=mul(s.normal,-Math.sign(signedArea(zone.vertices.map(v=>[v.x,v.y]))));}
    if(s.kind==='object'){const object=project.objects.find(o=>o.id===s.zoneId),centre=s.points[0].map((_,k)=>s.points.reduce((n,p)=>n+p[k]/s.points.length,0));if(dot(sub(centre,object.position),s.normal)<0)s.normal=mul(s.normal,-1);}
  }return result;
}
export function pointOnSurface(point,surface){
  const {normal,points}=surface;
  if(Math.abs(dot(sub(point,points[0]),normal))>1e-5)return false;
  const axis=normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs))),project=p=>p.filter((_,i)=>i!==axis);
  return pointInPolygon(project(point),points.map(project));
}
export function segmentHit(a,b,surface){
  const denom=dot(sub(b,a),surface.normal);if(Math.abs(denom)<EPS)return null;
  const t=dot(sub(surface.points[0],a),surface.normal)/denom;
  if(t<=1e-6||t>=1-1e-6)return null;
  const p=add(a,mul(sub(b,a),t));return pointOnSurface(p,surface)?p:null;
}
export function visible(a,b,surfaces,room){
  if(surfaces.some(s=>segmentHit(a,b,s)))return false;
  // A segment crossing a concave exterior is invalid even if it passes exactly through a vertex.
  if(room)for(let t=.1;t<1;t+=.2)if(!containsPoint(room,add(a,mul(sub(b,a),t))))return false;
  return true;
}
export function geometrySummary(project){
  let volume=0,area=0;
  const zones=roomZones(project.room);
  for(const zone of zones){const poly=zone.vertices.map(v=>[v.x,v.y]);area+=Math.abs(signedArea(poly));for(const t of triangulate(poly)){const a=Math.abs(orient(...t.map(i=>poly[i])))/2;volume+=a*t.reduce((n,i)=>n+(zone.vertices[i].ceiling-zone.vertices[i].floor)/3,0);}}
  const surfaces=boundarySurfaces(project,false),warnings=[];
  const portals=[];
  for(const z of zones)for(let i=0;i<z.edges.length;i++){const e=z.edges[i],o=e.opening;if(!o||o.open===false)continue;const a=z.vertices[i],b=z.vertices[(i+1)%z.vertices.length],at=(u,h)=>[a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u,h];portals.push({id:e.id,zoneId:z.id,key:[at(o.start,o.bottom),at(o.end,o.bottom),at(o.start,o.top),at(o.end,o.top)].map(p=>p.map(v=>v.toFixed(5)).join(',')).sort().join(';')});}
  const openings=portals.map(p=>p.id),unmatchedOpenings=portals.filter(p=>!portals.some(q=>q.zoneId!==p.zoneId&&q.key===p.key)).map(p=>p.id),connectedPortals=portals.filter((p,i)=>portals.some((q,j)=>j>i&&q.zoneId!==p.zoneId&&q.key===p.key)).map(p=>p.id);
  if(unmatchedOpenings.length)warnings.push('Offene Verbindung nach außen / nicht gepaarter Durchgang: keine Reflexion in der Öffnung; geschlossene-Raum-Moden und Sabine sind nicht belastbar.');
  if(connectedPortals.length)warnings.push('Gekoppelte Raumzonen über deckungsgleiche Öffnungen: Mehrfach-Abklingen möglich; Sabine bleibt eine grobe Gesamtschätzung.');
  for(const z of zones)if(z.curveApproximation)warnings.push(`Rundung ${z.name}: ${z.vertices.length} ebene Facetten, maximaler Sehnenfehler ${z.curveApproximation.maxChordError.toFixed(4)} m. Keine validierte Fokussierungs-/Beugungsprognose.`);
  for(const item of [...project.sources.map(s=>({...s,position:acousticPosition(s)})),...project.receivers])if(!usablePoint(project,item.position,0))warnings.push(`${item.name}: außerhalb des freien Raumvolumens oder in einem Hindernis.`);
  const objects=(project.objects||[]).filter(o=>o.acoustic!==false);
  for(let i=0;i<objects.length;i++)for(let j=i+1;j<objects.length;j++)if(boxesIntersect(objects[i],objects[j]))warnings.push(`Objektkollision: ${objects[i].name} / ${objects[j].name}.`);
  for(const o of objects)if(boxCorners(o).some(p=>!containsPoint(project.room,p)))warnings.push(`${o.name}: Box schneidet die Raumhülle oder liegt außerhalb.`);
  const keys=new Set();for(const s of surfaces){const key=s.points.map(p=>p.map(v=>v.toFixed(5)).join(',')).sort().join(';');if(keys.has(key))warnings.push(`Doppelte Fläche: ${s.boundaryId}`);keys.add(key);}
  // Interior overlap makes a sum of zone volumes invalid; reject rather than silently double-count.
  for(let i=0;i<zones.length;i++)for(let j=i+1;j<zones.length;j++){
    const a=zones[i],b=zones[j];if(Math.max(...a.vertices.map(v=>v.ceiling))<=Math.min(...b.vertices.map(v=>v.floor))+EPS||Math.max(...b.vertices.map(v=>v.ceiling))<=Math.min(...a.vertices.map(v=>v.floor))+EPS)continue;
    const pa=a.vertices.map(v=>[v.x,v.y]),pb=b.vertices.map(v=>[v.x,v.y]);
    const strictlyInside=(p,poly)=>pointInPolygon(p,poly)&&poly.every((v,k)=>segmentDistance(p,v,poly[(k+1)%poly.length])>EPS);
    const crossing=pa.some((p,k)=>pb.some((q,l)=>properIntersection(p,pa[(k+1)%pa.length],q,pb[(l+1)%pb.length])));
    const centres=triangulate(pa).some(t=>strictlyInside([0,1].map(k=>t.reduce((s,n)=>s+pa[n][k]/3,0)),pb));
    const midpoints=poly=>poly.map((p,k)=>p.map((v,j)=>(v+poly[(k+1)%poly.length][j])/2));
    if(crossing||centres||[...pa,...midpoints(pa)].some(p=>strictlyInside(p,pb))||[...pb,...midpoints(pb)].some(p=>strictlyInside(p,pa))){warnings.push('Überlappende Raumzonen: Volumensumme ist ungültig; Zonen müssen disjunkt sein.');volume=null;}
  }
  return {volume,area,surfaceArea:surfaces.reduce((s,f)=>s+f.area,0),surfaces:surfaces.length,zones:zones.length,openings,unmatchedOpenings,connectedPortals,warnings,bounds:roomBounds(project.room)};
}
export function acousticPosition(source){
  const offset=source.acousticCenter||[0,0,0],yaw=(source.yaw||0)*Math.PI/180,pitch=(source.pitch||0)*Math.PI/180;
  const y=offset[1]*Math.cos(pitch)-offset[2]*Math.sin(pitch),z=offset[1]*Math.sin(pitch)+offset[2]*Math.cos(pitch);
  return add(source.position,[offset[0]*Math.cos(yaw)-y*Math.sin(yaw),offset[0]*Math.sin(yaw)+y*Math.cos(yaw),z]);
}
export function isRectangular(room){
  if(!room.zones)return true;
  const zones=roomZones(room);if(zones.length!==1)return false;const z=zones[0];if(z.vertices.length!==4||z.edges.some(e=>e.opening?.open!==false&&e.opening))return false;
  const b=roomBounds(room);
  return z.vertices.every(v=>[b.min[0],b.max[0]].includes(v.x)&&[b.min[1],b.max[1]].includes(v.y)&&v.floor===b.min[2]&&v.ceiling===b.max[2]);
}
export function fingerprint(value){const s=JSON.stringify(value);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
export function geometryFingerprint(project){return fingerprint({room:project.room,objects:project.objects||[]});}
export function measurementFingerprint(project,sourceId,receiverId){return fingerprint({geometry:geometryFingerprint(project),source:project.sources.find(s=>s.id===sourceId),receiver:project.receivers.find(s=>s.id===receiverId)});}
export function arcPoints(a,b,radius,{side=1,frequency=20000}={}){
  if(!Number.isFinite(frequency)||frequency<20||frequency>96000||![1,-1].includes(side))throw new Error('Bogenfrequenz oder Richtung ungültig.');
  const chord=length([a.x,a.y],[b.x,b.y]);if(!Number.isFinite(radius)||radius<chord/2||radius>100)throw new Error('Bogenradius muss mindestens die halbe Sehnenlänge betragen (max. 100 m).');
  const middle=[(a.x+b.x)/2,(a.y+b.y)/2],height=Math.sqrt(Math.max(0,radius*radius-chord*chord/4)),center=[middle[0]-(b.y-a.y)/chord*height*side,middle[1]+(b.x-a.x)/chord*height*side];
  const start=Math.atan2(a.y-center[1],a.x-center[0]);let delta=Math.atan2(b.y-center[1],b.x-center[0])-start;while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
  const tolerance=Math.min(.02,343/(12*frequency)),segments=Math.max(2,Math.ceil(Math.abs(delta)/(2*Math.acos(Math.max(-1,1-tolerance/radius)))));if(segments>250)throw new Error('Bogen benötigt mehr als 250 Segmente. Radius/Frequenz prüfen.');
  const points=Array.from({length:segments-1},(_,i)=>{const t=(i+1)/segments,angle=start+delta*t;return {id:crypto.randomUUID(),x:center[0]+radius*Math.cos(angle),y:center[1]+radius*Math.sin(angle),floor:a.floor+(b.floor-a.floor)*t,ceiling:a.ceiling+(b.ceiling-a.ceiling)*t};});
  return {points,center,radius,maxChordError:radius*(1-Math.cos(Math.abs(delta)/(2*segments))),frequency,segments};
}

export function boxCorners(object){
  const angle=(object.rotation||0)*Math.PI/180;
  return Array.from({length:8},(_,i)=>{const x=(i&1?.5:-.5)*object.size[0],y=(i&2?.5:-.5)*object.size[1],z=(i&4?.5:-.5)*object.size[2];return add(object.position,[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle),z]);});
}
export function boxesIntersect(a,b){
  if(Math.abs(a.position[2]-b.position[2])>=(a.size[2]+b.size[2])/2-EPS)return false;
  const axes=o=>{const t=(o.rotation||0)*Math.PI/180;return [[Math.cos(t),Math.sin(t)],[-Math.sin(t),Math.cos(t)]];},aa=axes(a),bb=axes(b),delta=sub(b.position,a.position);
  return [...aa,...bb].every(axis=>{const radius=(o,own)=>o.size[0]/2*Math.abs(dot(axis,own[0]))+o.size[1]/2*Math.abs(dot(axis,own[1]));return Math.abs(delta[0]*axis[0]+delta[1]*axis[1])<radius(a,aa)+radius(b,bb)-EPS;});
}
