(()=>{
'use strict';
const box=document.createElement('div');box.id='hand-compass';box.hidden=true;box.setAttribute('aria-label','トンネルの方向を指すコンパス');
const pointer=document.createElement('div');pointer.id='compass-visible-needle';pointer.setAttribute('aria-hidden','true');box.appendChild(pointer);
const distance=document.createElement('div');distance.id='hand-compass-distance';box.appendChild(distance);$('hud').appendChild(box);
const button=document.createElement('button');button.id='compass-toggle';button.type='button';button.setAttribute('aria-controls','hand-compass');
button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.8 5.8-2 8-5.6 4.4 2-8Z"/><path d="m10.2 10.2 3.6 3.6"/></svg>';
document.querySelector('.hud-buttons').prepend(button);
let enabled=true;try{enabled=localStorage.getItem('ubasuteyama-compass-visible')!=='0';}catch(_){}
let overlay=null,view=null,needle=null,bearing=0,loaded=false,loading=null,rect=null,failed=false,target={x:0,z:42.5};
function sync(){button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'コンパスを非表示にする':'コンパスを表示する');box.hidden=!enabled||state!=='playing';rect=null;}
button.onclick=()=>{enabled=!enabled;try{localStorage.setItem('ubasuteyama-compass-visible',enabled?'1':'0');}catch(_){}sync();};
button.addEventListener('pointerdown',e=>e.stopPropagation());
window.addEventListener('resize',()=>{rect=null;});
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{rect=null;}).observe(box);
function relativeBearing(dx,dz,angle){return Math.atan2(dx*Math.cos(angle)-dz*Math.sin(angle),-dx*Math.sin(angle)-dz*Math.cos(angle));}
async function load(){
 if(loading)return loading;
 loading=(async()=>{
  const data=JSON.parse($('hand-compass-model').textContent);
  const texture=await new THREE.TextureLoader().loadAsync(data.texture);texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const mats=data.materials.map(m=>{const p=m.pbrMetallicRoughness||{},f=p.baseColorFactor||[1,1,1,1];return new THREE.MeshBasicMaterial({color:new THREE.Color().setRGB(f[0],f[1],f[2]),map:p.baseColorTexture?texture:null,side:THREE.DoubleSide,transparent:m.alphaMode==='BLEND',opacity:f[3],alphaTest:.02,depthWrite:m.alphaMode!=='BLEND',toneMapped:false});});
  function attribute(a){const bytes=Uint8Array.from(atob(a.data),c=>c.charCodeAt(0)),T=a.type===5126?Float32Array:a.type===5125?Uint32Array:Uint16Array;return new THREE.BufferAttribute(new T(bytes.buffer),a.size);}
  const meshes=data.meshes.map(m=>{const g=new THREE.BufferGeometry();for(const [key,a]of Object.entries(m.attributes))g.setAttribute({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'}[key],attribute(a));g.setIndex(attribute(m.indices));g.computeBoundingSphere();return new THREE.Mesh(g,mats[m.material]);});
  const nodes=data.nodes.map(n=>{const g=new THREE.Group();g.name=n.name;if(n.matrix)new THREE.Matrix4().fromArray(n.matrix).decompose(g.position,g.quaternion,g.scale);if(n.mesh!==undefined)g.add(meshes[n.mesh]);return g;});
  data.nodes.forEach((n,i)=>{for(const child of n.children||[])nodes[i].add(nodes[child]);});
  needle=nodes.find(n=>n.name==='arrow');if(!needle)throw Error('コンパスの針がありません');
  overlay=new THREE.Scene();overlay.add(nodes[0]);
  view=new THREE.PerspectiveCamera(36,1,.01,30);view.position.set(0,3.7,2.6);view.lookAt(0,0,0);
  loaded=true;rect=null;
 })().catch(e=>{failed=true;distance.textContent='コンパスを読み込めませんでした';console.warn('Compass model:',e);});
 return loading;
}
const priorInit=init;init=async function(...args){const result=await priorInit.apply(this,args);if(ready)await load();return result;};
// Also support initialization that completed before this final script was parsed.
if(ready)load();
const viewport=new THREE.Vector4(),scissor=new THREE.Vector4();
window.__handCompass={relativeBearing,load,setTarget(point){target=point;},get needle(){return needle;},render(){
 const visible=enabled&&state==='playing';if(box.hidden===visible){box.hidden=!visible;rect=null;}if(!visible)return;
 const bx=target.x,bz=target.z;
 const dx=bx-player.x,dz=bz-player.z,meters=Math.hypot(dx,dz),desiredBearing=meters<.15?bearing:relativeBearing(dx,dz,yaw);
 // Keep the needle on the tunnel centre even immediately after a quick turn.
 bearing=desiredBearing;
 pointer.style.transform='translate(-50%,-50%) rotate('+bearing+'rad)';
 if(!loaded){if(!failed)distance.textContent='コンパスを準備中…';return;}
 // GLB arrow points along local +Y; local +Z rotation turns its tip left.
 needle.rotation.z=-bearing;
 // Distance text is intentionally omitted.
 if(!rect){const r=box.getBoundingClientRect(),canvas=renderer.domElement.getBoundingClientRect();rect={x:r.left-canvas.left,y:canvas.bottom-r.bottom,w:r.width,h:r.height};view.aspect=rect.w/rect.h;view.updateProjectionMatrix();}
 const auto=renderer.autoClear,test=renderer.getScissorTest();renderer.getViewport(viewport);renderer.getScissor(scissor);
 try{renderer.autoClear=false;renderer.setViewport(rect.x,rect.y,rect.w,rect.h);renderer.setScissor(rect.x,rect.y,rect.w,rect.h);renderer.setScissorTest(true);renderer.clearDepth();renderer.render(overlay,view);}
 finally{renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(test);renderer.autoClear=auto;}
 }};
sync();
})();
