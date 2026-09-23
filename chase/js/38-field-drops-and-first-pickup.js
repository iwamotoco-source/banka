
(()=>{
'use strict';
const inv=window.inventory,lockers=window.__lockerSystem;
const drops=[];
function firstPickup(){if(!enemyHasSpawned&&!enemyGraceStarted)window.__enemyGraceControl.start();}
const add=inv.add;
inv.add=function(item){const ok=add.call(this,item);if(ok)firstPickup();return ok;};
const open=StoryArchive.prototype.open;
StoryArchive.prototype.open=function(p,...args){const fresh=p&&!this.found.has(p.record.id);const result=open.call(this,p,...args);if(fresh&&this.found.has(p.record.id))firstPickup();return result;};
function dropPoint(){
 const floor=window.__villageAccess.actualFloor();
 for(const radius of [1.05,.75,.45])for(const angle of [0,.45,-.45,.9,-.9]){
  const a=yaw+angle,x=player.x-Math.sin(a)*radius,z=player.z-Math.cos(a)*radius,y=world.map.floor(x,z);
  if(Number.isFinite(y)&&Math.abs(y-floor)<.4&&!collision(x,z,.32)&&clearLine(player.x,player.z,x,z)&&drops.every(d=>Math.hypot(d.x-x,d.z-z)>.3))return {x,z,y};
 }
 return null;
}
function dropSelected(){
 const item=inv.selected;if(state!=='reading'||!item||!inv.slots.includes(item))return;
 if(lockers.active){toast('ロッカーから出てから置いてください。',3);return;}
 const point=dropPoint();if(!point){toast('ここには置けない。少し開けた場所へ移動しよう。',3);return;}
 const source=item.p?.group||item.source?.group||(item.type==='gate-key'?seven.lock.key.group:offerings.models[item.type]);
 if(!source){toast('このアイテムは置けません。',3);return;}
 const group=source.clone(true);group.name='dropped-item';group.visible=true;
 // Frozen source matrices must not pin the copy to its original pickup location.
 group.matrixAutoUpdate=true;group.position.set(point.x,point.y+.16,point.z);group.updateMatrix();scene.add(group);group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group);if(Number.isFinite(bounds.min.y)){group.position.y+=point.y+.06-bounds.min.y;group.updateMatrix();group.updateMatrixWorld(true);}
 drops.push({...point,item,group});inv.removeMatch(s=>s===item);
 updateHUD();archive.close();toast(inv.name(item)+'を足元に置いた。',3);
}
const render=inv.renderItems;
inv.renderItems=function(){render.call(this);if(!this.selected||!this.slots.includes(this.selected))return;const detail=$('inventory-detail');if(!detail)return;const b=document.createElement('button');b.type='button';b.className='inventory-use-item';b.textContent='足元に置く';b.onclick=dropSelected;detail.appendChild(b);};
function dropHit(){if(state!=='playing'||lockers.active)return null;const floor=window.__villageAccess.actualFloor();let best=null,dist=2.05;for(const d of drops){const n=Math.hypot(player.x-d.x,player.z-d.z);if(n<dist&&Math.abs(floor-d.y)<.65&&clearLine(player.x,player.z,d.x,d.z)){best=d;dist=n;}}return best?{type:'dropped-item',drop:best}:null;}
const hit=getInteraction;getInteraction=function(){return dropHit()||hit();};
const action=interact;
interact=function(){
 const h=dropHit();if(h){if(!inv.canAdd()){toast('所持枠がいっぱいです。',3);return;}const d=h.drop;if(!inv.add(d.item))return;scene.remove(d.group);drops.splice(drops.indexOf(d),1);audio.pickup();updateHUD();toast(inv.name(d.item)+'を拾った。',3);return;}
 const before=state==='playing'?getInteraction():null;const result=action();
 if(before?.type==='cell'&&before.p.found||before?.type==='shrine-note'&&revision.noteFound)firstPickup();
 return result;
};
const update=updatePlayer;updatePlayer=function(dt){update(dt);const h=dropHit();if(h){show('interaction');$('interaction').disabled=false;$('interaction').textContent=inv.canAdd()?inv.name(h.drop.item)+'を拾う':'所持枠がいっぱい';}};
const unlock=TunnelLock.prototype.unlock;TunnelLock.prototype.unlock=function(){if(!this.unlocked&&!inv.has('gate-key')){toast('封鎖の鍵を持ってきてください。',3);return;}return unlock.call(this);};
const start=GameManager.prototype.start;GameManager.prototype.start=function(...args){for(const d of drops)scene.remove(d.group);drops.length=0;return start.apply(this,args);};
// Entering preserves the last observed position. Leaving does not reveal the player.
const enter=lockers.enter;lockers.enter=function(l){const was=this.active;enter.call(this,l);if(!was&&this.active&&world.ai.mode==='pursuit'){world.ai.mode='search';world.ai.unseen=0;world.ai.search=0;}if(revision)revision.forceChase=0;};
window.__fieldDrops={drops,dropSelected,dropPoint};
})();

