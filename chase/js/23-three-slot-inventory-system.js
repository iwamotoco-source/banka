
(()=>{
'use strict';

const inventory={
 max:3,
 slots:[],
 discoveredParts:new Set(),
 selected:null,
 get count(){return this.slots.length;},
 canAdd(){return this.slots.length<this.max;},
 has(type,p=null){return this.slots.some(s=>s.type===type&&(!p||s.p===p));},
 add(item){if(!this.canAdd())return false;this.slots.push(item);this.selected=item;this.refresh();return true;},
 removeMatch(fn){const i=this.slots.findIndex(fn);if(i<0)return null;const [item]=this.slots.splice(i,1);if(this.selected===item)this.selected=this.slots[0]||null;this.refresh();return item;},
 removeType(type){return this.removeMatch(s=>s.type===type);},
 carriedParts(){return this.slots.filter(s=>s.type==='part');},
 reset(){this.slots.length=0;this.discoveredParts.clear();this.selected=null;for(const p of parts){p._installed=false;p._discovered=false;}this.refresh();},
 descriptor(item){
  if(!item)return {mark:'—',kind:'EMPTY',desc:'空きスロット。探索中に拾った重要アイテムがここに入る。'};
  if(item.type==='part')return {mark:'P',kind:'BIKE PART',desc:'バイクの修理部品。バイクまで持ち帰って装着するとスロットが空く。'};
  if(item.type==='sake')return {mark:'酒',kind:'OFFERING',desc:'古い酒。どこかに供えるための品に見える。'};
  if(item.type==='dango')return {mark:'団',kind:'OFFERING',desc:'団子。どこかに供えるための品に見える。'};
  if(item.type==='gate-key')return {mark:'鍵',kind:'KEY ITEM',desc:'封鎖ゲートの鍵。使用するまで所持スロットを1枠使う。'};
  return {mark:'?',kind:'ITEM',desc:'探索中に手に入れたアイテム。'};
 },
 name(item){if(!item)return '空き';if(item.type==='part')return item.p?.name||'バイク部品';if(item.type==='sake')return 'お酒';if(item.type==='dango')return '団子';if(item.type==='gate-key')return '封鎖の鍵';return item.name||'アイテム';},
 refresh(){this.updateButton();if(state==='reading')this.renderItems();},
 updateButton(){const b=document.getElementById('records-button');if(b)b.textContent='所持 '+this.count+'/'+this.max;const c=document.getElementById('inventory-items-count');if(c)c.textContent=this.count+' / '+this.max;const r=document.getElementById('inventory-installed-count');if(r)r.textContent=partsFound+' / 7';const tab=document.getElementById('inventory-record-tab');if(tab&&archive)tab.textContent='RECORDS  '+archive.found.size+'/14';},
 renderItems(){
  const host=document.getElementById('inventory-slots');if(!host)return;host.replaceChildren();
  for(let i=0;i<this.max;i++){
   const item=this.slots[i]||null,d=this.descriptor(item),el=document.createElement('button');
   el.type='button';el.className='inventory-slot'+(item?'':' empty')+(item&&this.selected===item?' selected':'');el.disabled=!item;
   el.innerHTML='<span class="inventory-slot-index">0'+(i+1)+'</span><span class="inventory-item-mark">'+d.mark+'</span><span class="inventory-item-name">'+this.name(item)+'</span><span class="inventory-item-kind">'+d.kind+'</span>';
   if(item)el.onclick=()=>{this.selected=item;this.renderItems();};host.appendChild(el);
  }
  const detail=document.getElementById('inventory-detail');if(detail){const item=this.selected&&this.slots.includes(this.selected)?this.selected:null,d=this.descriptor(item);detail.innerHTML='<h3>'+(item?this.name(item):'所持品スロット')+'</h3><p>'+d.desc+'</p>';}
  this.updateButton();
 }
};
window.inventory=inventory;

function inventoryFull(){toast('これ以上持てない。所持品から足元に置くか、部品をバイクへ運ぼう。',4);audio.tone?.(90,.12,.04,'square',70);}
function partIndex(p){return Math.max(0,parts.indexOf(p));}
function discoverPart(p){
 const idx=partIndex(p);p._discovered=true;inventory.discoveredParts.add(idx);
 if(inventory.discoveredParts.size===4&&window.ragePhase&&!ragePhase.triggered)ragePhase.activate();
}
function takePart(p){
 if(!inventory.canAdd()){inventoryFull();return false;}
 if(!inventory.add({type:'part',p,id:partIndex(p)}))return false;
 p.found=true;p.group.visible=false;discoverPart(p);audio.pickup();
 const n=inventory.discoveredParts.size;
 toast(p.name+' を手に入れた。所持 '+inventory.count+'/'+inventory.max,3.5);updateHUD();return true;
}
inventory.takePart=takePart;
function depositBikeParts(){
 const carried=inventory.carriedParts();
 if(!carried.length)return 0;
 let installed=0;
 for(const item of [...carried]){if(item.p&&!item.p._installed){item.p._installed=true;partsFound=Math.min(7,partsFound+1);installed++;}inventory.removeMatch(s=>s===item);}
 if(installed){audio.pickup();audio.tone?.(150,.2,.06,'triangle',230);updateHUD();toast(installed+'個の部品をバイクに装着した。修理 '+partsFound+'/7',4);}
 return installed;
}

inventory.depositBikeParts=depositBikeParts;
// Build one persistent ITEMS / RECORDS screen instead of a records-only window.
StoryArchive.prototype.ui=function(){
 const b=document.createElement('button');b.id='records-button';b.textContent='所持 0/3';b.setAttribute('aria-label','所持品と記録を開く');b.onclick=()=>{if(state==='playing')this.open(null,'items');};(document.querySelector('.hud-summary')||document.querySelector('.hud-buttons')).appendChild(b);
 const d=document.createElement('div');d.id='record-dialog';d.className='modal-shade hidden';d.innerHTML=`<article class="modal inventory-modal" role="dialog" aria-modal="true" aria-labelledby="record-title">
  <div class="inventory-head"><div class="modal-head"><div><div class="modal-kicker">FIELD INVENTORY</div><h2 id="record-title">所持品</h2></div><button id="record-close" class="close" aria-label="閉じる">×</button></div>
  <div class="inventory-tabs"><button id="inventory-item-tab" class="inventory-tab active">ITEMS&nbsp;&nbsp;0/3</button><button id="inventory-record-tab" class="inventory-tab">RECORDS&nbsp;&nbsp;0/14</button></div></div>
  <div class="inventory-content">
   <section id="inventory-items-panel"><div id="inventory-summary"><span>所持 <strong id="inventory-items-count">0 / 3</strong></span><span>バイク装着 <strong id="inventory-installed-count">0 / 7</strong></span></div><div id="inventory-slots"></div><div id="inventory-detail"></div><div id="inventory-note">所持品は3枠まで。部品・供物・鍵・回復品・硬貨も同じ枠を使います。電池だけは拾った瞬間に懐中電灯へ補充されます。</div></section>
   <section id="inventory-records-panel"><div id="record-progress"></div><div id="record-list"></div><div id="record-paper"><div id="record-meta"></div><div id="record-body"></div></div><button id="record-back" class="secondary">記録一覧へ</button></section>
  </div></article>`;document.body.appendChild(d);
 $('record-close').onclick=()=>this.close();$('inventory-item-tab').onclick=()=>this.showTab('items');$('inventory-record-tab').onclick=()=>this.showTab('records');$('record-back').onclick=()=>this.render();
 window.addEventListener('keydown',e=>{if(state!=='reading')return;e.stopImmediatePropagation();if(e.code==='Escape'||e.code==='KeyP'||e.code==='KeyI'){e.preventDefault();this.close();}if(e.code==='Tab'){const a=[...d.querySelectorAll('button')].filter(x=>x.offsetParent&&!x.disabled);if(!a.length)return;if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0].focus();}}},true);
 inventory.refresh();
};
StoryArchive.prototype.showTab=function(tab){this.activeTab=tab==='records'?'records':'items';const d=$('record-dialog');d.classList.toggle('records-tab',this.activeTab==='records');$('inventory-item-tab').classList.toggle('active',this.activeTab==='items');$('inventory-record-tab').classList.toggle('active',this.activeTab==='records');$('record-title').textContent=this.activeTab==='items'?'所持品':'回収した記録';if(this.activeTab==='items')inventory.renderItems();else this.render();};
StoryArchive.prototype.open=function(p,tab){
 if(state!=='playing'&&state!=='reading')return;
 let rec=null;if(p){this.found.add(p.record.id);p.group.visible=false;rec=p.record;}
 state='reading';resetInput();seven?.static.clear();document.exitPointerLock?.();audio.update();chaseMusic.stop(false);show('record-dialog');inventory.updateButton();this.showTab(tab||(rec?'records':'items'));if(rec)this.render(rec);$('record-close').focus();
};
StoryArchive.prototype.render=function(r){
 if(this.activeTab!=='records'){inventory.renderItems();return;}
 const paper=$('record-paper'),list=$('record-list'),back=$('record-back');$('record-progress').textContent='回収 '+this.found.size+' / 14 · 未回収の記録は「？？？」で表示';list.replaceChildren();
 if(r&&this.found.has(r.id)){
  paper.classList.add('visible');paper.classList.toggle('notebook',[3,7,10,13].includes(r.id));back.classList.add('visible');
  const item=this.items.find(p=>p.record.id===r.id);$('record-meta').textContent='記録 '+String(r.id).padStart(2,'0')+' / 14 · '+(r.id===11?'録音の書き起こし':[3,7,10,13].includes(r.id)?'榊原の調査ノート':'文書')+' · '+(item?.kind||'文書')+' · 発見場所：'+(item?.area||'不明');$('record-body').textContent=r.body;
  for(const rec of STORY_RECORDS){const btn=document.createElement('button');btn.textContent=this.found.has(rec.id)?String(rec.id).padStart(2,'0')+' '+rec.title:String(rec.id).padStart(2,'0')+' ？？？';btn.className=(this.found.has(rec.id)?'':'locked')+(rec.id===r.id?' current':'');btn.disabled=!this.found.has(rec.id);if(!btn.disabled)btn.onclick=()=>this.render(rec);list.appendChild(btn);} 
 }else{
  paper.classList.remove('visible','notebook');back.classList.remove('visible');$('record-body').textContent='';$('record-meta').textContent='';
  for(const rec of STORY_RECORDS){const btn=document.createElement('button');const found=this.found.has(rec.id);btn.textContent=found?String(rec.id).padStart(2,'0')+' '+rec.title:String(rec.id).padStart(2,'0')+' ？？？';btn.className=found?'':'locked';btn.disabled=!found;if(found)btn.onclick=()=>this.render(rec);list.appendChild(btn);}
 }
 inventory.updateButton();$('record-dialog').querySelector('.inventory-modal').scrollTop=0;
};
StoryArchive.prototype.close=function(){hide('record-dialog');state='playing';resetInput();clock.getDelta();audio.update();document.activeElement?.blur();};
StoryArchive.prototype.reset=function(){this.place();this.found.clear();this.activeTab='items';hide('record-dialog');inventory.updateButton();};

// Gate key consumes a real inventory slot until it is used at the gate.
const inventoryKeyTakeBase=TunnelLock.prototype.take;
TunnelLock.prototype.take=function(){
 if(this.found||!offerings?.keyReady)return;
 if(!inventory.canAdd()){inventoryFull();return;}
 inventoryKeyTakeBase.call(this);
 if(this.found){inventory.add({type:'gate-key'});updateHUD();}
};
const inventoryUnlockBase=TunnelLock.prototype.unlock;
TunnelLock.prototype.unlock=function(){const wasUnlocked=this.unlocked;inventoryUnlockBase.call(this);if(!wasUnlocked&&this.unlocked){inventory.removeType('gate-key');updateHUD();}};

// Final interaction layer: important items are limited to 3 slots. Batteries retain instant-use behavior.
inventory.offerSelected=function(){const h={item:inventory.has('sake')?'sake':inventory.has('dango')?'dango':null};
  if(!h.item){toast('仏像の前に、お供えできそうな場所がある。',4);return;}
  const type=h.item,held=inventory.removeType(type);if(!held){toast(type==='sake'?'お酒を持っていない。':'団子を持っていない。',3);return;}
  offerings[type]=2;const m=offerings.models[type],a=offerings.altar;m.position.set(a.x-.65,world.map.floor(a.x,a.z)+.03,a.z+(type==='sake'?-.65:.65));m.visible=true;audio.pickup();
  if(offerings.sake===2&&offerings.dango===2){offerings.keyReady=true;seven.lock.key.group.visible=true;toast('二つの供物を供えた。仏像の前に何かが現れた。',5);}else toast((type==='sake'?'お酒':'団子')+'を供えた。所持枠が1つ空いた。',3.5);updateHUD();return;
};
const inventoryInteractBase=interact;
interact=function(){
 if(state!=='playing')return;const h=getInteraction();if(!h)return;
 if(h.type==='part'){takePart(h.p);return;}
 if(h.type==='bike'){
  const deposited=depositBikeParts();if(deposited)return;
  if(partsFound===7&&seven?.lock?.unlocked){endGame(true);return;}
  if(partsFound===7){toast(seven.lock.found?'部品は揃った。封鎖ゲートで鍵を使おう。':'部品は揃った。封鎖の鍵を探そう。',4);return;}
  toast('バイク装着 '+partsFound+'/7。部品を持ち帰ってここで装着しよう。',3);return;
 }
 if(h.type==='offering-pickup'){
  if(!inventory.canAdd()){inventoryFull();return;}
  const type=h.item,name=type==='sake'?'お酒':'団子';if(!inventory.add({type})){inventoryFull();return;}offerings[type]=1;offerings.models[type].visible=false;audio.pickup();toast(name+'を手に入れた。所持 '+inventory.count+'/'+inventory.max,3.5);updateHUD();return;
 }
 if(h.type==='offering-altar'){inventory.offerSelected();return;}
 if(h.type==='gate-key'){seven.lock.take();return;}
 if(h.type==='gate'){seven.lock.unlock();return;}
 inventoryInteractBase();
};

const inventoryPlayerBase=updatePlayer;
updatePlayer=function(dt){
 inventoryPlayerBase(dt);const h=getInteraction();if(!h)return;
 if(h.type==='part')$('interaction').textContent=inventory.canAdd()?h.p.name+' を拾う':'所持枠がいっぱい';
 else if(h.type==='offering-pickup')$('interaction').textContent=inventory.canAdd()?(h.item==='sake'?'お酒を拾う':'団子を拾う'):'所持枠がいっぱい';
 else if(h.type==='gate-key')$('interaction').textContent=inventory.canAdd()?'封鎖の鍵を拾う':'所持枠がいっぱい';
 else if(h.type==='bike')$('interaction').textContent=inventory.carriedParts().length?'部品をバイクへ装着':partsFound===7&&seven?.lock?.unlocked?'バイクで脱出する':'バイクを調べる';
};

// The visible 0/7 counter is now the number actually installed on the bike.
const inventoryHudBase=updateHUD;
updateHUD=function(){
 inventoryHudBase();
 $('part-count').textContent=partsFound;document.querySelectorAll('.part-dot').forEach((e,i)=>e.classList.toggle('found',i<partsFound));
 if(seven){const holdingKey=inventory.has('gate-key');$('key-status').textContent=seven.lock.unlocked?'GATE OPEN':holdingKey?'KEY CARRIED · GATE LOCKED':'KEY — · GATE LOCKED';}
 const label=n=>['未取得','所持','供え済み'][n]||'未取得';if($('offering-status'))$('offering-status').textContent='酒：'+label(offerings.sake)+' ／ 団子：'+label(offerings.dango);
 const carrying=inventory.carriedParts().length;
 const bv=$('battery-value'); if(bv) bv.textContent=Math.round(classic?.battery?.value ?? 100)+'%';
 if(partsFound<7)$('mission-hint').textContent=carrying?'持っている部品をバイクへ運ぶ':'部品を探す';
 else if(!seven?.lock?.unlocked)$('mission-hint').textContent=inventory.has('gate-key')?'封鎖ゲートで鍵を使う':'封鎖の鍵を探す';
 else $('mission-hint').textContent='バイクに戻って脱出する';
 inventory.refresh();
};

// New game state: carried items and cumulative discoveries are independent from bike repair progress.
const inventoryGameStartBase=GameManager.prototype.start;
GameManager.prototype.start=function(){inventory.reset();const result=inventoryGameStartBase.call(this);partsFound=0;for(const p of parts){p._installed=false;p._discovered=false;}inventory.discoveredParts.clear();updateHUD();return result;};

// The rage transition belongs to the 4th unique part PICKUP, not the 4th part installed on the bike.
// takePart() directly activates ragePhase at discoveredParts.size === 4; the older HUD fallback remains harmless.

})();
