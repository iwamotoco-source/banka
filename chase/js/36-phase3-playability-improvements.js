
(()=>{
 'use strict';

 /* Move the existing stamina DOM into the status card under HP. */
 function placeStamina(){
  const health=document.querySelector('.health-status'),stamina=document.querySelector('.stamina-wrap');
  if(health&&stamina&&!health.contains(stamina))health.appendChild(stamina);
 }
 placeStamina();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',placeStamina,{once:true});

 /* Permanent bike bearing. It points relative to the current camera direction. */
 function ensureBikeCompass(){
  const compass=document.querySelector('.compass');if(!compass)return null;
  let el=document.getElementById('bike-compass');
  if(!el){el=document.createElement('div');el.id='bike-compass';el.innerHTML='<span id="bike-compass-arrow">▲</span><span>バイク</span><span id="bike-compass-distance">--m</span>';compass.appendChild(el);}
  return el;
 }
 function refreshBikeCompass(){
  const el=ensureBikeCompass();if(!el||!bike)return;
  const bx=Number.isFinite(bike.position?.x)?bike.position.x:0,bz=Number.isFinite(bike.position?.z)?bike.position.z:36;
  const dx=bx-player.x,dz=bz-player.z,dist=Math.hypot(dx,dz);
  const bearing=Math.atan2(dx,dz),relative=bearing+yaw;
  const arrow=document.getElementById('bike-compass-arrow'),distance=document.getElementById('bike-compass-distance');
  if(arrow)arrow.style.transform=`rotate(${relative*180/Math.PI}deg)`;
  if(distance)distance.textContent=(dist<100?Math.round(dist):Math.round(dist/5)*5)+'m';
 }

 /* Tree-aware sliding. Walls/buildings still use the existing collision resolver. */
 const phase3MoveBase=moveEntity;
 function nearbyTrunks(x,z,r){
  const out=[],gx=Math.floor(x/4),gz=Math.floor(z/4),seen=new Set();
  for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++){
   const list=buckets.get((gx+ix)+','+(gz+iz));if(!list)continue;
   for(const o of list){if(o.kind!=='trunk'||seen.has(o))continue;seen.add(o);if(Math.hypot(x-o.x,z-o.z)<r+o.r+.45)out.push(o);}
  }
  return out;
 }
 moveEntity=function(obj,dx,dz,r=.42){
  if(obj!==player)return phase3MoveBase(obj,dx,dz,r);
  const sx=obj.x,sz=obj.z,nx=sx+dx,nz=sz+dz;
  if(!collision(nx,nz,r)){obj.x=nx;obj.z=nz;return;}
  const trees=nearbyTrunks(nx,nz,r);
  if(trees.length){
   let tx=dx,tz=dz,adjusted=false;
   for(const o of trees){
    let vx=sx-o.x,vz=sz-o.z,d=Math.hypot(vx,vz);
    if(d<.0001){vx=nx-o.x;vz=nz-o.z;d=Math.hypot(vx,vz)||1;}
    const ux=vx/d,uz=vz/d,dot=tx*ux+tz*uz;
    if(dot<0){tx-=ux*dot;tz-=uz*dot;adjusted=true;}
    const minD=r+o.r+.025;
    if(d<minD){obj.x+=ux*(minD-d+.012);obj.z+=uz*(minD-d+.012);}
   }
   if(adjusted){
    const scale=.98;
    if(!collision(obj.x+tx*scale,obj.z+tz*scale,r)){obj.x+=tx*scale;obj.z+=tz*scale;return;}
    if(!collision(obj.x+tx*.62,obj.z+tz*.62,r)){obj.x+=tx*.62;obj.z+=tz*.62;return;}
   }
  }
  phase3MoveBase(obj,dx,dz,r);
 };

 /* Sharper flashlight cone while keeping darkness outside the beam. */
 const phase3BatteryUpdate=BatterySystem.prototype.update;
 BatterySystem.prototype.update=function(dt){
  phase3BatteryUpdate.call(this,dt);
  if(!flash||!world)return;
  const cave=world.map.area(player.x,player.z)==='洞窟';
  flash.angle=.40;flash.penumbra=.36;flash.decay=1.05;
  flash.distance=cave?42:35;
  if(this.value>=12)flash.intensity=cave?72:54;
 };

 /* Keep the rear keypad and the physical gate key at sane display scales. */
 function normalizeKeyVisuals(){
  if(seven?.lock?.key?.group){seven.lock.key.group.scale.setScalar(.9);}
  const panel=rearPassage?.gate?.getObjectByName?.('rear-lock-number-panel');if(panel)panel.scale.set(1,1,1);
 }

 /* A clue is remembered only after the player has actually read the paper. */
 function ensureClueMemory(){
  const panel=document.getElementById('inventory-records-panel');if(!panel)return null;
  let memo=document.getElementById('shrine-clue-memory');
  if(!memo){memo=document.createElement('div');memo.id='shrine-clue-memory';memo.hidden=true;const progress=document.getElementById('record-progress');if(progress?.nextSibling)panel.insertBefore(memo,progress.nextSibling);else panel.prepend(memo);}
  return memo;
 }
 function refreshClueMemory(){
  const memo=ensureClueMemory();if(!memo||!revision)return;
  memo.hidden=!revision.noteFound;
  if(revision.noteFound)memo.innerHTML='手掛かりメモ<br><strong>神社の番号　'+String(revision.code).padStart(3,'0')+'</strong>';
 }
 const phase3RevisionInteract=PilgrimageRevision.prototype.interact;
 PilgrimageRevision.prototype.interact=function(hit){const r=phase3RevisionInteract.call(this,hit);refreshClueMemory();return r;};
 const phase3RevisionReset=PilgrimageRevision.prototype.reset;
 PilgrimageRevision.prototype.reset=function(){const r=phase3RevisionReset.call(this);refreshClueMemory();return r;};
 const phase3OpenDial=PilgrimageRevision.prototype.openDial;
 PilgrimageRevision.prototype.openDial=function(mode='front'){
  const r=phase3OpenDial.call(this,mode);
  if(this.noteFound&&document.getElementById('shrine-clue'))$('shrine-clue').textContent='見つけた紙の番号： '+String(this.code).padStart(3,'0');
  return r;
 };
 if(typeof StoryArchive!=='undefined'){
  const phase3ArchiveOpen=StoryArchive.prototype.open;
  StoryArchive.prototype.open=function(...args){const r=phase3ArchiveOpen.apply(this,args);refreshClueMemory();return r;};
  const phase3ShowTab=StoryArchive.prototype.showTab;
  if(phase3ShowTab)StoryArchive.prototype.showTab=function(tab){const r=phase3ShowTab.call(this,tab);refreshClueMemory();return r;};
 }

 /* Final UI update wrapper. */
 const phase3PlayerUpdate=updatePlayer;
 updatePlayer=function(dt){const r=phase3PlayerUpdate(dt);refreshBikeCompass();return r;};

 /* Normalize late-created objects once initialization has finished. */
 (async()=>{const t0=performance.now();while(performance.now()-t0<12000){if(ready&&world&&revision&&seven){placeStamina();ensureBikeCompass();ensureClueMemory();normalizeKeyVisuals();refreshBikeCompass();refreshClueMemory();break;}await new Promise(r=>setTimeout(r,120));}})();
})();
