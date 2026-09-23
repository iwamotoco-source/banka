(()=>{
'use strict';
const canvas=$('world'),inv=window.inventory,ray=new THREE.Raycaster(),point=new THREE.Vector2(),presses=new Map();
function visible(g){for(let o=g;o;o=o.parent)if(!o.visible)return false;return !!g;}
function candidates(){
 if(state!=='playing'||window.__lockerSystem?.active)return [];
 const list=[],floor=world.map.floor(player.x,player.z);
 function add(type,p,g,range=2.6,item=null,access=null){
  if(!visible(g))return;
  const x=access?.x??g.position.x,z=access?.z??g.position.z;
  if(Math.hypot(player.x-x,player.z-z)>range||Math.abs(world.map.floor(x,z)-floor)>.7)return;
  if(!clearLine(player.x,player.z,x,z))return;
  list.push({type,p,group:g,item});
 }
 function approach(g,d=.85){const dx=player.x-g.position.x,dz=player.z-g.position.z,len=Math.hypot(dx,dz)||1;return {x:g.position.x+dx/len*Math.min(d,len),z:g.position.z+dz/len*Math.min(d,len)};}

 for(const p of parts)if(!p.found)add('part',p,p.group);
 for(const p of classic?.battery?.items||[])if(!p.found)add('cell',p,p.group,2.3);
 for(const p of [...(survivalSystem.pickups||[]),...(survivalSystem.cans||[])])if(!p.found)add('survival',p,p.group,2.15);
 for(const p of archive?.items||[])if(!archive.found.has(p.record.id))add('record',p,p.group,2.15);
 for(const item of ['sake','dango'])if(offerings[item]===0)add('offering',null,offerings.models[item],item==='sake'?2.1:2.6,item,item==='sake'?{x:offerings.truck.x+1.8,z:offerings.truck.z-1}:null);
 if(offerings.keyReady&&!seven.lock.found)add('key',null,seven.lock.key.group);
 if(revision&&!revision.noteFound)add('note',null,revision.paper,2.3);
 for(const d of window.__fieldDrops.drops)add('drop',d,d.group,2.05);
 for(const r of revision?.radios||[])add('radio',r,r.group,2.4,null,approach(r.group,.45));
 const vending=survivalSystem.vending;if(vending)add('vending',vending,vending.group,2.5,null,approach(vending.group));
 if(bike)add('bike',null,bike,2.8,null,approach(bike));
 if(!seven.lock.unlocked)add('gate',null,seven.lock.gate,2.8,null,approach(seven.lock.gate));
 if(revision&&!revision.unlocked)add('dial',null,revision.gate,2.8,null,approach(revision.gate));
 if(rearPassage.gate&&!rearPassage.unlocked)add('rear',null,rearPassage.gate,2.8,null,approach(rearPassage.gate));
 for(const l of window.__lockerSystem.spots)add('locker',l,l.group,2.05,null,{x:l.exitX,z:l.exitZ});
 const statue=scene.getObjectByName('buddha');if(statue)add('altar',null,statue,2.6,null,offerings.altar);
 return window.__forestChapterActive?list.filter(c=>['cell','survival','drop'].includes(c.type)):list;
}
function pick(h){
 if(!candidates().some(c=>c.group===h.group))return false;
 if(h.type==='radio'){revision.interact({type:'radio',r:h.p});return true;}
 if(h.type==='vending'){survivalSystem.buy();return true;}
 if(h.type==='locker'){window.__lockerSystem.enter(h.p);toast('ロッカーに隠れた。画面をタップして出る。',3);return true;}
 if(h.type==='gate'){seven.lock.unlock();return true;}
 if(h.type==='dial'){revision.openDial();return true;}
 if(h.type==='rear'){if(!onShrineSide()){toast('神社側から操作する錠だ。',3);return false;}if(!revision.unlocked){toast('先に正面の錠を開けよう。',3);return false;}revision.openDial('rear');return true;}
 if(h.type==='altar'){inv.offerSelected();return true;}
 if(h.type==='bike'){if(inv.depositBikeParts())return true;if(partsFound===7&&seven.lock.unlocked)endGame(true);else toast(partsFound<7?'部品を持ち帰ってバイクを修理しよう。':'トンネルの封鎖を解いてから戻ろう。',3);return true;}
 if(h.type==='part')return inv.takePart(h.p);
 if(h.type==='survival'){survivalSystem.pickup(h.p);return h.p.found;}
 if(h.type==='key'){seven.lock.take();return seven.lock.found;}
 if(h.type==='record'){archive.open(h.p);return true;}
 if(h.type==='note'){revision.interact({type:'shrine-note'});window.__enemyGraceControl.start();return true;}
 if(h.type==='cell'){
  if(classic.battery.value>=99){toast('電池はまだ十分だ。',2);return false;}
  h.p.found=true;h.group.visible=false;classic.battery.add();window.__enemyGraceControl.start();audio.pickup();toast('ライト用電池を補充した。 +35',3);return true;
 }
 if(!inv.canAdd()){toast('所持枠がいっぱいです。所持品から足元に置くと空きを作れます。',3);return false;}
 if(h.type==='offering'){
  if(!inv.add({type:h.item}))return false;offerings[h.item]=1;h.group.visible=false;
 }else if(h.type==='drop'){
  if(!inv.add(h.p.item))return false;scene.remove(h.group);const drops=window.__fieldDrops.drops;drops.splice(drops.indexOf(h.p),1);
 }else return false;
 audio.pickup();updateHUD();toast('アイテムを拾った。',2.5);return true;
}
function tap(x,y){
 if(state==='playing'&&window.__lockerSystem.active){window.__lockerSystem.leave();return true;}
 const list=candidates();if(!list.length)return false;
 const r=canvas.getBoundingClientRect();point.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);
 camera.updateMatrixWorld(true);for(const h of list)h.group.updateWorldMatrix(true,true);ray.setFromCamera(point,camera);
 const hits=ray.intersectObjects(list.map(h=>h.group),true);
 for(const hit of hits){if(!visible(hit.object))continue;let o=hit.object;while(o){const h=list.find(c=>c.group===o);if(h)return pick(h);o=o.parent;}}
 return false;
}
canvas.addEventListener('pointerdown',e=>{if(state==='playing'&&e.button===0)presses.set(e.pointerId,{x:e.clientX,y:e.clientY,time:performance.now(),moved:false});},true);
window.addEventListener('pointermove',e=>{const p=presses.get(e.pointerId);if(p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>9)p.moved=true;},true);
window.addEventListener('pointerup',e=>{const p=presses.get(e.pointerId);presses.delete(e.pointerId);if(!p||p.moved||state!=='playing'||performance.now()-p.time>420||Math.hypot(e.clientX-p.x,e.clientY-p.y)>9)return;tap(e.clientX,e.clientY);},true);
for(const event of ['pointercancel','lostpointercapture'])window.addEventListener(event,e=>presses.delete(e.pointerId),true);
window.addEventListener('blur',()=>presses.clear());
const update=updatePlayer;updatePlayer=function(dt){update(dt);const h=getInteraction();if(h&&['part','cell','survival-pickup','gate-key','offering-pickup','dropped-item','record','shrine-note'].includes(h.type))hide('interaction');};
// Keyboard E remains available; touch pickup is performed on the item itself.
window.__tapPickup={candidates,tap,pick};
})();
