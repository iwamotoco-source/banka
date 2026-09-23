/* Forest chapter rules. This file runs after the legacy patches and before DOMContentLoaded. */
(()=>{
'use strict';
const COUNT=7, gate={x:0,z:44.5}, exit={x:0,z:46.5};
window.__forestChapterActive=true;
let lampTemplate=null,candleTemplate=null,lamps=[],candles=[],lit=0,passageOpen=false;
// Legacy ready toggles during intermediate initialization; only this flag marks the completed chapter.
let chapterReady=false;
const canStartChapter=()=>chapterReady&&ready&&!!world?.map&&!!lampTemplate&&!!candleTemplate;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const progress=document.createElement('div');progress.id='forest-progress';
progress.innerHTML='<span>経過 <b id="forest-time">00:00:00</b></span><span>点灯 <b id="forest-lit">0 / 7</b></span>';
document.querySelector('#hud .battery-status')?.appendChild(progress);
const clockText=seconds=>{const n=Math.max(0,Math.floor(seconds));return [Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(v=>String(v).padStart(2,'0')).join(':');};
// The supplied GLB contains three separate stone lanterns under RootNode.
function separateLanterns(model){
 const names=['CTI Stone Lamp 01','CTI Stone Lamp 02','CTI Stone Lamp 03'];
 return names.map(name=>{
  const copy=model.clone(true);
  for(const other of names){const node=copy.getObjectByName(other);if(!node)throw Error('灯籠モデルの部品が見つかりません: '+other);if(other!==name)node.parent.remove(node);}
  copy.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(copy),center=new THREE.Vector3();bounds.getCenter(center);
  copy.position.set(-center.x,-bounds.min.y,-center.z);
  copy.userData.nativeHeight=bounds.max.y-bounds.min.y;
  if(!Number.isFinite(copy.userData.nativeHeight)||copy.userData.nativeHeight<=0)throw Error('灯籠の寸法が不正です');
  return copy;
 });
}
const status=()=>{
  const text=`灯籠 ${lit}/${COUNT} 点灯 · 蝋燭 ${inventory.slots.filter(i=>i.type==='candle').length} 本所持`;
  $('mission-hint').textContent=passageOpen?'トンネルへ進む':text;
  $('part-count').textContent=lit;
  $('forest-lit').textContent=`${lit} / ${COUNT}`;
  const key=$('key-status');if(key)key.textContent=passageOpen?'TUNNEL OPEN':`LANTERNS ${lit} / ${COUNT}`;
  const installed=$('inventory-installed-count');if(installed)installed.textContent=lit+' / '+COUNT;
  const sum=$('inventory-summary');if(sum)sum.querySelector('span:last-child')?.firstChild?.replaceWith(document.createTextNode('灯籠点灯 '));
  document.querySelectorAll('.part-dot').forEach((e,i)=>e.classList.toggle('found',i<lit));
};
// Minimal local glTF 2.0 reader for the supplied self-contained GLB files.
async function loadGLB(path){
 const response=await fetch(path);if(!response.ok)throw Error(path+' HTTP '+response.status);
 const buffer=await response.arrayBuffer(),view=new DataView(buffer);
 if(view.getUint32(0,true)!==0x46546c67)throw Error(path+' はGLBではありません');
 const jsonLength=view.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,jsonLength)));
 let offset=20+jsonLength;const binLength=view.getUint32(offset,true);offset+=8;const bin=new Uint8Array(buffer,offset,binLength);
 const component={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
 const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
 const accessor=i=>{const a=json.accessors[i],b=json.bufferViews[a.bufferView],C=component[a.componentType],n=components[a.type];if(!C||!n)throw Error('Unsupported GLB attribute');
  const stride=b.byteStride||C.BYTES_PER_ELEMENT*n,start=(b.byteOffset||0)+(a.byteOffset||0),bytes=C.BYTES_PER_ELEMENT*n;
  const out=new C(a.count*n);for(let k=0;k<a.count;k++)out.set(new C(bin.buffer,bin.byteOffset+start+k*stride,n),k*n);
  return new THREE.BufferAttribute(out,n,!!a.normalized);
 };
 const imageTextures=await Promise.all((json.images||[]).map(async image=>{
   let url=image.uri;if(image.bufferView!==undefined){const b=json.bufferViews[image.bufferView],blob=new Blob([bin.subarray(b.byteOffset||0,(b.byteOffset||0)+b.byteLength)],{type:image.mimeType||'image/png'});url=URL.createObjectURL(blob);}
   try{const t=await new THREE.TextureLoader().loadAsync(url);t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;return t;}finally{if(image.bufferView!==undefined)URL.revokeObjectURL(url);}
 }));
 const materials=(json.materials||[]).map(m=>{const p=m.pbrMetallicRoughness||{},f=p.baseColorFactor||[1,1,1,1];const t=p.baseColorTexture&&imageTextures[json.textures[p.baseColorTexture.index]?.source];return new THREE.MeshStandardMaterial({color:new THREE.Color().setRGB(f[0],f[1],f[2]),map:t||null,roughness:p.roughnessFactor??1,metalness:p.metallicFactor??0,transparent:m.alphaMode==='BLEND'||f[3]<1,opacity:f[3],alphaTest:m.alphaMode==='MASK'?(m.alphaCutoff??.5):0,side:m.doubleSided?THREE.DoubleSide:THREE.FrontSide});});
 const meshes=(json.meshes||[]).map(mesh=>mesh.primitives.map(primitive=>{
   const g=new THREE.BufferGeometry();for(const [key,index] of Object.entries(primitive.attributes)){const attr={POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv',COLOR_0:'color'}[key];if(attr)g.setAttribute(attr,accessor(index));}
   if(primitive.indices!==undefined)g.setIndex(accessor(primitive.indices));if(!g.attributes.normal)g.computeVertexNormals();
   const object=new THREE.Mesh(g,materials[primitive.material]||new THREE.MeshStandardMaterial({color:0xc7c4aa}));object.castShadow=true;object.receiveShadow=true;return object;
 }));
 const nodes=(json.nodes||[]).map((n,i)=>{const o=new THREE.Group();o.name=n.name||'node-'+i;if(n.matrix)new THREE.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);else{if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);}if(n.mesh!==undefined)for(const mesh of meshes[n.mesh])o.add(mesh);return o;});
 (json.nodes||[]).forEach((n,i)=>{for(const child of n.children||[])nodes[i].add(nodes[child]);});
 const root=new THREE.Group();for(const n of json.scenes?.[json.scene||0]?.nodes||[])root.add(nodes[n]);
 root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),center=new THREE.Vector3();bounds.getCenter(center);
 const height=bounds.max.y-bounds.min.y;if(!Number.isFinite(height)||height<=0)throw Error(path+' の寸法を読み取れません');
 // Translate within a wrapper so the imported origin sits at its own ground level.
 const aligned=new THREE.Group();root.position.set(-center.x,-bounds.min.y,-center.z);aligned.add(root);aligned.userData.nativeHeight=height;
 return aligned;
}
function copyModel(template,x,z,height){const g=template.clone(true);const factor=height/template.userData.nativeHeight;g.scale.setScalar(factor);g.position.set(x,world.map.floor(x,z)+.02,z);g.updateMatrixWorld(true);
 // Centre the visible mesh, since each imported variant has its own transform.
 const bounds=new THREE.Box3().setFromObject(g),center=new THREE.Vector3();bounds.getCenter(center);
 g.position.x+=x-center.x;g.position.y+=world.map.floor(x,z)+.02-bounds.min.y;g.position.z+=z-center.z;
 g.visible=true;scene.add(g);return g;}
function choosePoints(count,used=[],spacing=7){
 const s=world.spawns.forest;const source=(s.reachable||s.candidates).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z));
 const points=s.shuffle([...source]).filter(p=>Math.abs(p.x)<38&&Math.abs(p.z)<37&&Math.hypot(p.x,p.z-32)>7&&Math.hypot(p.x,p.z-42)>8&&Math.hypot(p.x,p.z)>5&&!collision(p.x,p.z,.9));
 const selected=[];for(const p of points){if([...used,...selected].every(q=>distance(p,q)>=spacing)){selected.push({x:p.x,z:p.z});if(selected.length===count)break;}}
 if(selected.length!==count)throw Error('森に灯籠と蝋燭を配置する場所が足りません');return selected;
}
function resetScene(){for(const item of [...lamps,...candles]){scene.remove(item.group);if(item.light)scene.remove(item.light);if(item.flame)scene.remove(item.flame);if(item.glow)scene.remove(item.glow);}lamps=[];candles=[];lit=0;passageOpen=false;
 $('forest-time').textContent='00:00:00';
 for(const p of parts){p.found=true;p.group.visible=false;}partsFound=0;
 for(const p of archive?.items||[]){scene.remove(p.group);p.group.visible=false;}
 archive?.items?.splice(0); // The old story records are not part of this chase chapter.
 for(const drop of window.__fieldDrops?.drops||[])scene.remove(drop.group);
 if(window.__fieldDrops?.drops)window.__fieldDrops.drops.length=0;
 for(const locker of window.__lockerSystem?.spots||[])scene.remove(locker.group);
 if(window.__lockerSystem){window.__lockerSystem.spots.length=0;window.__lockerSystem.setupDone=true;}
 if(offerings?.models?.sake)offerings.models.sake.visible=false;if(offerings?.models?.dango)offerings.models.dango.visible=false;
 if(revision){revision.gate.visible=false;revision.paper.visible=false;for(const r of revision.radios){r.group.visible=false;r.lamp.visible=false;}}if(rearPassage?.gate)rearPassage.gate.visible=false;
 if(bike){bike.visible=false;bike.position.set(gate.x,world.map.floor(gate.x,gate.z),gate.z);}if(seven?.lock){seven.lock.key.group.visible=false;seven.lock.gate.visible=true;seven.lock.found=false;seven.lock.unlocked=false;}
 for(const item of inventory.slots.slice())inventory.removeMatch(s=>s===item);
 const sites=choosePoints(COUNT,[],9),supplies=choosePoints(COUNT,sites,5);
 // Three variants, distributed 3 / 2 / 2; shuffle both sites and variants on each run.
 const variants=world.spawns.forest.shuffle([0,0,0,1,1,2,2]);
 for(const [i,p] of sites.entries()){
  const group=copyModel(lampTemplate[variants[i]],p.x,p.z,2.1),bounds=new THREE.Box3().setFromObject(group),center=new THREE.Vector3();
  bounds.getCenter(center);
  const floor=bounds.min.y;
  const light=new THREE.PointLight(0xffab4d,0,14,1.7);light.position.set(center.x,floor+1.44,center.z);scene.add(light);
  const flame=new THREE.Group();flame.position.copy(light.position);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.18,12,10),new THREE.MeshBasicMaterial({color:0xffcc6a,depthWrite:false}));flame.add(core);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(.36,12,10),new THREE.MeshBasicMaterial({color:0xff832b,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false}));flame.add(halo);
  flame.visible=false;scene.add(flame);
  const glow=new THREE.Mesh(new THREE.CircleGeometry(2.5,28),new THREE.MeshBasicMaterial({color:0xffa14b,transparent:true,opacity:.24,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  glow.rotation.x=-Math.PI/2;glow.position.set(center.x,floor+.045,center.z);glow.visible=false;scene.add(glow);
  lamps.push({...p,group,light,flame,glow,lit:false,variant:variants[i]});
 }
 for(const p of supplies){const group=copyModel(candleTemplate,p.x,p.z,.48);const halo=new THREE.Mesh(new THREE.TorusGeometry(.34,.025,8,32),new THREE.MeshBasicMaterial({color:0xd4af67,transparent:true,opacity:.85}));halo.rotation.x=Math.PI/2;halo.position.y=.07/group.scale.x;halo.scale.setScalar(1/group.scale.x);group.add(halo);candles.push({...p,group,found:false});}
 classic.battery.reset();classic.battery.place(choosePoints(11,[...sites,...supplies],2.5));
 status();toast('森に散らばった蝋燭を拾い、七つの灯籠に火を灯そう。',5);
}
// Keep the existing forest, tunnel, enemy, stamina and health systems. Seal old exits.
MapManager.prototype.buildCave=function(){};
MapManager.prototype.clearCemetery=function(){};
MapManager.prototype.buildShrine=function(){};
StoryArchive.prototype.place=function(){};
const lockers=window.__lockerSystem;
if(lockers)lockers.setup=function(){this.setupDone=true;for(const spot of this.spots)scene.remove(spot.group);this.spots.length=0;};
const oldProps=MapManager.prototype.placeProps;MapManager.prototype.placeProps=function(){pendingLanterns.length=0;pendingTorii.length=0;oldProps.call(this);};
MapManager.prototype.buildCliffs=function(){
 // A continuous forest ring closes the old cave/shrine openings and every polygon seam.
 // Keep a gap only at the actual tunnel mouth; the existing tunnel rock surrounds it.
 const mat=this.stone.clone();mat.side=THREE.DoubleSide;mat.color.set(0x899183);mat.depthWrite=true;
 for(let edge=0;edge<FOREST_BORDER.length;edge++){
  const a=FOREST_BORDER[edge],b=FOREST_BORDER[(edge+1)%FOREST_BORDER.length];
  if(a[1]===44&&b[1]===44&&Math.abs(a[0])<=3&&Math.abs(b[0])<=3)continue;
  const segments=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.85));const vertices=[],uv=[];
  for(let j=0;j<segments;j++){
   const point=(t,y)=>{const x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,mag=Math.hypot(x,z)||1;
    const lean=y<0?0:y<8?.3:y<25?1.2:2.1;
    return [x+x/mag*lean,y,z+z/mag*lean];};
   const u=j/segments,v=(j+1)/segments,top=t=>58+6*Math.sin((a[0]+(b[0]-a[0])*t)*.21+(a[1]+(b[1]-a[1])*t)*.13);
   const heightsA=[-10,-.5,8,25,top(u)],heightsB=[-10,-.5,8,25,top(v)];
   for(let k=0;k<4;k++){
    const A=point(u,heightsA[k]),B=point(v,heightsB[k]),C=point(v,heightsB[k+1]),D=point(u,heightsA[k+1]);
    for(const pos of [A,B,C,A,C,D]){vertices.push(...pos);uv.push((pos[0]+pos[2])/4,pos[1]/4);}
   }
  }
  this.makeSurface(vertices,uv,mat).name='forest-perimeter-seal';
 }
};
const originalBuild=MapManager.prototype.build;
MapManager.prototype.build=function(){originalBuild.call(this);
 // The legacy shrine approach is a separate ground plane outside the forest.
 for(const o of [...scene.children])if(o.position.z===-46&&o.position.y===-.07&&o.geometry?.type==='PlaneGeometry')scene.remove(o);
};
const priorPool=RegionalSpawnManager.prototype.pool;
RegionalSpawnManager.prototype.pool=function(points){const p=priorPool.call(this,points);return p.length?p:[{x:0,z:0}];};
RegionalSpawnManager.prototype.layout=function(){const forest=this.forest,points=choosePoints(7,[],5),cells=choosePoints(11,points,2.5);return {items:points,cells,key:{x:0,z:0},enemy:forest.enemySpawn(points)};};
MapManager.prototype.buildTunnel=function(){scene.remove(bike);bike.visible=false;this.tunnel=this.assets.place('futatsugoya_tunnel_abandoned_road_japan',0,40,{distance:100});seven.lock.gate.position.set(0,this.floor(0,44.5),44.5);seven.lock.gate.scale.set(.57,1,1);this.sealTunnelTerrain();};
delete WORLD_ASSETS.bmw_bike;
// Replace the old cave/shrine/village supply layout with forest-only first aid.
survivalSystem.setup=function(){if(this.setupDone)return;for(const p of choosePoints(3,[],10)){const floor=world.map.floor(p.x,p.z),g=this.cloneAsset('survival_bandage',p.x,p.z,{y:floor+.02,scale:.040});this.pickups.push({type:'bandage',x:p.x,z:p.z,group:g,found:false,baseY:floor+.02,spin:Math.random()*6.28});}this.setupDone=true;this.updateHealthUI();};
function restrictToForest(){
 MapManager.inside=(x,z,r=0)=>inBoundary(x,z,FOREST_BORDER,r)||(x>-3+r&&x<3-r&&z>38+r&&z<58-r);
MapManager.prototype.area=function(x,z){return z>39?'トンネル':'森';};
 MapManager.prototype.floor=function(x,z){if(Math.abs(x)<4.5&&z>26){const profile=[0,.13,.37,.41,.46,.58,.69,.72,.81,.91,1,1.05],t=clamp((z-24)/3,0,profile.length-1),i=Math.floor(t);return (profile[i]+(profile[Math.min(i+1,profile.length-1)]-profile[i])*(t-i))*clamp((z-28)/4,0,1);}return 0;};
}
const originalInit=init;
init=async function(...args){
 chapterReady=false;
 try{await originalInit.apply(this,args);if(!ready)return;
 restrictToForest();ready=false;$('start').disabled=true;
  [lampTemplate,candleTemplate]=await Promise.all([loadGLB('assets/stone_lamp.glb'),loadGLB('assets/candle_low.glb')]);
  lampTemplate=separateLanterns(lampTemplate);
  // Hide old cave/shrine fixtures added by late initialization patches.
  for(const o of [...scene.children])if(o.name==='rear-cave-opaque-backing'||o.name==='shrine-dial-gate')scene.remove(o);
  if(revision?.gate)revision.gate.visible=false;if(rearPassage?.gate)rearPassage.gate.visible=false;
  if(offerings?.models?.sake)offerings.models.sake.visible=false;if(offerings?.models?.dango)offerings.models.dango.visible=false;
  if($('offering-status'))$('offering-status').hidden=true;
  if(world?.assets?.instances)world.assets.instances=world.assets.instances.filter(inst=>{if(Math.abs(inst.x)>44||inst.z < -44){scene.remove(inst.g);return false;}return true;});
  ready=true;chapterReady=true;$('start').disabled=false;$('load-message').textContent='CANDLE FOREST READY';
 }catch(e){chapterReady=false;ready=false;show('fatal');$('fatal-detail').textContent='灯籠・蝋燭の準備に失敗しました。 '+(e?.stack||e?.message||String(e));console.error(e);}
};
// This chapter has its own objective. The legacy start chain still generates
// shrine/cave offerings, bike parts and locks; none of those locations exist
// in this forest. Start only the shared controls/audio and chapter systems.
function startForestChapter(){
 if(!canStartChapter())return false;
 inventory.reset();
 swallowing.stop();
 enemyHasSpawned=false;
 window.__enemyGraceControl.reset(false);
 classicBase.startGame();
 survivalSystem.reset();
 enemyMesh.visible=false;enemy.x=100000;enemy.z=100000;enemy.path=[];enemy.repath=0;
 seven.static.clear();$('danger').style.opacity=0;chaseMusic.stop(true);
 if(enemyCorruption){enemyCorruption.rotation.z=0;enemyCorruption.scale.setScalar(1);enemyCorruption.material.opacity=.8;enemyCorruption.visible=false;}
 player.x=0;player.z=32;
 world.map.lastArea='';
 classic.faces.select();
 world.ai.reset();
 resetScene();
 navReady=false;buildNav();
 classic.battery.update(0);
 window.dispatchEvent(new Event('resize'));
 return true;
}
GameManager.prototype.start=startForestChapter;
function nearest(){if(state!=='playing')return null;const p={x:player.x,z:player.z};let best=null,limit=4.2;
 // A lamp must be usable from its edge; checking a line to its centre rejects
 // valid approaches when the lantern or an adjacent tree clips that line.
 if(inventory.has('candle'))for(const lamp of lamps)if(!lamp.lit){const d=distance(p,lamp);if(d<4&&d<limit){best={type:'lamp',item:lamp};limit=d;}}
 for(const candle of candles)if(!candle.found&&candle.group.visible){const d=distance(p,candle);if(d<limit&&clearLine(p.x,p.z,candle.x,candle.z)){best={type:'candle',item:candle};limit=d;}}
 for(const lamp of lamps)if(!lamp.lit){const d=distance(p,lamp);if(d<Math.min(limit,3.7)){best={type:'lamp',item:lamp};limit=d;}}
 if(!passageOpen&&Math.hypot(p.x-gate.x,p.z-gate.z)<3.2)return {type:'blocked'};
 if(passageOpen&&Math.abs(p.x-gate.x)<3&&Math.abs(p.z-gate.z)<3.2)return {type:'exit'};
 return best;
}
const previousGetInteraction=getInteraction;
getInteraction=function(){const hit=nearest();if(hit)return hit;const old=previousGetInteraction();return ['cell','survival-pickup','dropped-item'].includes(old?.type)?old:null;};
function act(hit){if(hit.type==='candle'){
 const c=hit.item;if(!inventory.canAdd()){toast('所持品は3つまで。灯籠に火を灯して空きを作ろう。',3);return;}
 if(inventory.add({type:'candle',p:c})){c.found=true;c.group.visible=false;audio.pickup();status();toast('蝋燭を拾った。灯籠まで運ぼう。',3);}
 }else if(hit.type==='lamp'){
 const item=inventory.removeType('candle');if(!item){toast('火を灯すには蝋燭が必要だ。',3);return;}
 hit.item.lit=true;hit.item.light.intensity=10;hit.item.flame.visible=true;hit.item.glow.visible=true;lit++;partsFound=lit;audio.tone(440,.4,.08,'sine',220);status();
 if(lit===COUNT){passageOpen=true;seven.lock.unlocked=true;seven.lock.gate.visible=false;navReady=false;buildNav();toast('七つの灯が揃った。トンネルが開いた。',6);}else toast('灯籠に火を灯した。あと'+(COUNT-lit)+'基。',3);
 }else if(hit.type==='blocked')toast('七つの灯籠に火を灯すと入口が開く。',3);
 else if(hit.type==='exit'&&passageOpen&&state==='playing'){
 resetInput();seven.static.clear();chaseMusic.stop(false);worldBase.endGame(true);
 $('win-summary').textContent='灯籠 7 / 7 点灯　·　次の章へ';
 window.dispatchEvent(new CustomEvent('ubasuteyama:chapter-complete',{detail:{chapter:'forest',elapsed}}));
 }
}
const previousInteract=interact;
interact=function(){const hit=nearest();if(hit){act(hit);return;}const old=previousGetInteraction();if(['cell','survival-pickup','dropped-item'].includes(old?.type))return previousInteract();};
const previousUpdate=updatePlayer;
updatePlayer=function(dt){previousUpdate(dt);
 $('forest-time').textContent=clockText(elapsed);
 // Crossing the unlocked tunnel threshold completes the chapter without a button.
 if(state==='playing'&&passageOpen&&Math.abs(player.x-gate.x)<2.8&&player.z>=gate.z+.65){act({type:'exit'});return;}
 // Approaching an unlit lantern with a candle lights it without a precise tap.
 if(state==='playing'&&inventory.has('candle')){
  const nearby=lamps.find(l=>!l.lit&&distance(player,l)<1.85);
  if(nearby)act({type:'lamp',item:nearby});
 }
 const hit=nearest();if(hit){show('interaction');$('interaction').disabled=false;$('interaction').textContent=hit.type==='candle'?'蝋燭を拾う':hit.type==='lamp'?'灯籠に火を灯す':hit.type==='exit'?'トンネルへ進む':'トンネルは閉ざされている';}else if(state==='playing'&&getInteraction()===null)hide('interaction');};
const previousHUD=updateHUD;updateHUD=function(){previousHUD();if(world&&state==='playing')status();};
const oldName=inventory.name,oldDescriptor=inventory.descriptor;
inventory.name=function(item){return item?.type==='candle'?'蝋燭':oldName.call(this,item);};
inventory.descriptor=function(item){return item?.type==='candle'?{mark:'灯',kind:'CANDLE',desc:'森の灯籠に火を灯すための蝋燭。灯籠に近づいて使用する。'}:oldDescriptor.call(this,item);};
const compass=window.__handCompass;if(compass)compass.setTarget(exit);
document.querySelector('.parts-line > span').firstChild.textContent='灯籠 ';
$('victory-title').textContent='次の章へ';document.querySelector('#victory .small-note').innerHTML='七つの灯が道を開いた。<br>森の奥へ進む。';
$('hud-help').hidden=true;document.querySelector('.compass')?.setAttribute('aria-label','トンネルの方角');
const canvas=$('world'),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
canvas.addEventListener('pointerdown',e=>{if(state!=='playing'||e.button!==0)return;
 const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);camera.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
 const available=[...candles.filter(c=>!c.found),...lamps.filter(l=>!l.lit)];let item=null;
 const hit=ray.intersectObjects(available.map(v=>v.group),true)[0];if(hit){let group=hit.object;while(group.parent&&!available.some(v=>v.group===group))group=group.parent;item=available.find(v=>v.group===group);}
 // Candle meshes are tiny. Extend their touch target in screen space without enlarging the model.
 if(!item){let closest=60;for(const c of candles)if(!c.found&&distance(player,c)<4.3){const point=new THREE.Vector3(c.x,world.map.floor(c.x,c.z)+.3,c.z).project(camera);if(point.z<0||point.z>1)continue;const pixels=Math.hypot((point.x-pointer.x)*rect.width/2,(point.y-pointer.y)*rect.height/2);if(pixels<closest){closest=pixels;item=c;}}}
 if(item&&distance(player,item)<(item.lit===undefined?4.3:4.0)&&(item.lit!==undefined||clearLine(player.x,player.z,item.x,item.z))){
  e.stopImmediatePropagation();e.preventDefault();act({type:item.lit===undefined?'candle':'lamp',item});
 }
 },true);
window.UbasuteyamaCandleForest={start:startForestChapter,ready:canStartChapter,get progress(){return {lit,held:inventory.slots.filter(i=>i.type==='candle').length,open:passageOpen};},get lanternVariants(){return lamps.map(l=>l.variant);}};
})();
