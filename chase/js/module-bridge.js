/* Integrated chase boot authority: wait for the completed forest chapter, then start exactly once. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const root=document.documentElement;
 const shell=$('module-launch'),status=$('module-status'),detail=$('module-detail');
 const boot={phase:'loading',initialStarted:false,resultEmitted:false,checks:0,lastError:null};
 window.__BANKA_CHASE_BOOT__=boot;

 const errorText=error=>{
  if(error instanceof Error)return error.stack||error.message||String(error);
  if(error&&typeof error==='object'){
   try{return JSON.stringify(error);}catch(_){ }
  }
  return String(error);
 };
 function fatalVisible(){const panel=$('fatal');return !!panel&&!panel.classList.contains('hidden');}
 function fail(error,prefix='森の開始に失敗しました。'){
  if(boot.phase==='failed')return false;
  boot.phase='failed';boot.lastError=error;
  const message=errorText(error);
  if(shell)shell.hidden=true;
  root.classList.remove('chase-boot');root.classList.add('chase-failed');
  try{show('fatal');}catch(_){$('fatal')?.classList.remove('hidden');}
  const out=$('fatal-detail');if(out)out.textContent=prefix+' '+message;
  console.error(prefix,error);
  return false;
 }
 function adoptExistingFatal(){
  if(!fatalVisible())return false;
  boot.phase='failed';
  if(shell)shell.hidden=true;
  root.classList.remove('chase-boot');root.classList.add('chase-failed');
  return true;
 }
 function ready(){
  if(boot.phase!=='loading')return false;
  try{
   return !!window.UbasuteyamaCandleForest&&
    typeof window.UbasuteyamaCandleForest.ready==='function'&&
    window.UbasuteyamaCandleForest.ready()===true&&
    typeof window.UbasuteyamaCandleForest.start==='function';
  }catch(error){return fail(error,'森の準備状態の確認に失敗しました。');}
 }
 function reveal(){
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(boot.phase!=='running')return;
   root.classList.remove('chase-boot');
   if(shell)shell.hidden=true;
   window.dispatchEvent(new CustomEvent('ubasuteyama:started',{detail:{source:'module-bridge'}}));
  }));
 }
 function start(){
  if(boot.phase!=='loading'||boot.initialStarted)return false;
  if(!ready())return false;
  boot.phase='starting';
  if(status)status.textContent='森へ入ります…';
  if(detail)detail.textContent='最終配置を行っています。';
  try{
   const result=window.UbasuteyamaCandleForest.start();
   if(result===false){boot.phase='loading';return false;}
   if(fatalVisible()){boot.phase='loading';adoptExistingFatal();return false;}
   boot.initialStarted=true;boot.phase='running';boot.resultEmitted=false;
   reveal();
   return true;
  }catch(error){return fail(error);}
 }
 window.UbasuteyamaChase={start,ready,get state(){return boot.phase;}};

 // Keep legacy title/home return controls from ever exposing the retired home screen.
 for(const id of ['to-title','death-title','win-title']){
  $(id)?.addEventListener('click',event=>{
   event.preventDefault();event.stopImmediatePropagation();
   location.href='../index.html';
  },true);
 }
 for(const id of ['retry','replay'])$(id)?.addEventListener('click',()=>{boot.resultEmitted=false;},true);

 const timer=setInterval(()=>{
  boot.checks++;
  const queued=window.__BANKA_BOOT_ERRORS__?.shift?.();
  if(queued){clearInterval(timer);fail(queued,'初期化中に例外が発生しました。');return;}
  if(adoptExistingFatal()){clearInterval(timer);return;}
  if(ready()&&start()){clearInterval(timer);return;}
  if(boot.checks>1500){clearInterval(timer);fail(new Error('初期化完了を180秒以内に確認できませんでした。'),'ゲームの読み込みが完了しませんでした。');return;}
  if(boot.checks>35&&status)status.textContent='森を読み込んでいます…';
  if(boot.checks>35&&detail)detail.textContent='3D素材・灯籠・蝋燭・配置データを確認しています。';
 },120);

 setInterval(()=>{
  if(boot.phase!=='running'||boot.resultEmitted)return;
  for(const outcome of ['victory','gameover']){
   const panel=$(outcome);
   if(panel&&!panel.classList.contains('hidden')){
    boot.resultEmitted=true;
    window.dispatchEvent(new CustomEvent('ubasuteyama:result',{detail:{outcome}}));
    break;
   }
  }
 },250);
})();

/* 2026-09-27: compact forest / phantom-collision / radio / bandage cleanup. */
(()=>{
 'use strict';
 const BORDER=[
  [-24,7],[-23,-7],[-20,-18],[-14,-25],[-6,-29],
  [4,-29],[11,-27],[17,-22],[20,-14],[21,-4],
  [21,7],[20,16],[16,24],[10,30],[4,35],
  [-4,35],[-10,30],[-17,25],[-22,17]
 ];
 const RADIO_WISH={x:11,z:9};
 let activeRadio=null,radioNoise=null,radioContext=null,startWrapped=false;
 const tunnelPoint=(x,z,r=0)=>x>-3+r&&x<3-r&&z>33+r&&z<58-r;
 const insideCompact=(x,z,r=0)=>inBoundary(x,z,BORDER,r)||tunnelPoint(x,z,r);

 function applyCompactRules(){
  if(typeof MapManager==='undefined'||typeof inBoundary!=='function')return;
  MapManager.inside=(x,z,r=0)=>insideCompact(x,z,r);
 }

 function rebuildCompactObstacles(removeRadio=true){
  if(!Array.isArray(window.obstacles)&&typeof obstacles==='undefined')return;
  if(typeof buckets==='undefined'||typeof buckets?.clear!=='function'||typeof addObstacle!=='function')return;
  const kept=obstacles.filter(o=>{
   if(removeRadio&&o.kind==='chapter-radio')return false;
   if(!Number.isFinite(o.x)||!Number.isFinite(o.z))return true;
   if(tunnelPoint(o.x,o.z,Math.min(o.r||0,.55)))return true;
   return inBoundary(o.x,o.z,BORDER,Math.min(o.r||0,.55));
  });
  obstacles.length=0;buckets.clear();
  for(const o of kept)addObstacle(o.x,o.z,o.r,o.kind);
 }

 function cullRemovedArea(){
  if(typeof world==='undefined'||!world?.assets?.instances||typeof scene==='undefined')return;
  world.assets.instances=world.assets.instances.filter(inst=>{
   if(!Number.isFinite(inst.x)||!Number.isFinite(inst.z))return true;
   if(tunnelPoint(inst.x,inst.z,.05)||inBoundary(inst.x,inst.z,BORDER,.05))return true;
   if(inst.g)scene.remove(inst.g);
   return false;
  });
 }

 function buildCompactCliffs(){
  const mat=this.stone.clone();mat.side=THREE.DoubleSide;mat.color.set(0x899183);mat.depthWrite=true;
  for(let edge=0;edge<BORDER.length;edge++){
   const a=BORDER[edge],b=BORDER[(edge+1)%BORDER.length];
   if(a[1]===35&&b[1]===35&&Math.max(Math.abs(a[0]),Math.abs(b[0]))<=4.1)continue;
   const segments=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.8));
   const vertices=[],uv=[];
   for(let j=0;j<segments;j++){
    const point=(t,y)=>{const x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,mag=Math.hypot(x,z)||1;const lean=y<0?0:y<8?.3:y<25?1.2:2.1;return [x+x/mag*lean,y,z+z/mag*lean];};
    const u=j/segments,v=(j+1)/segments,top=t=>58+6*Math.sin((a[0]+(b[0]-a[0])*t)*.21+(a[1]+(b[1]-a[1])*t)*.13);
    const ha=[-10,-.5,8,25,top(u)],hb=[-10,-.5,8,25,top(v)];
    for(let k=0;k<4;k++){
     const A=point(u,ha[k]),B=point(v,hb[k]),C=point(v,hb[k+1]),D=point(u,ha[k+1]);
     for(const pos of [A,B,C,A,C,D]){vertices.push(...pos);uv.push((pos[0]+pos[2])/4,pos[1]/4);}
    }
   }
   const wall=this.makeSurface(vertices,uv,mat);wall.name='forest-perimeter-seal';
  }
 }

 function purgeBandages(){
  try{if(typeof WORLD_ASSETS!=='undefined')delete WORLD_ASSETS.survival_bandage;}catch(_){ }
  if(typeof survivalSystem!=='undefined'&&survivalSystem?.pickups){
   for(const p of survivalSystem.pickups)if(p?.type==='bandage'){p.found=true;if(p.group)scene.remove(p.group);}
   survivalSystem.pickups=survivalSystem.pickups.filter(p=>p?.type!=='bandage');
  }
  if(window.__fieldDrops?.drops){
   for(const p of __fieldDrops.drops)if(p?.type==='bandage'&&p.group)scene.remove(p.group);
   __fieldDrops.drops=__fieldDrops.drops.filter(p=>p?.type!=='bandage');
  }
  if(typeof inventory!=='undefined'&&inventory?.slots)for(const item of inventory.slots.slice())if(item?.type==='bandage')inventory.removeMatch(s=>s===item);
 }

 function chooseRadioSpot(){
  const source=world?.spawns?.forest?.reachable||world?.spawns?.forest?.candidates||[];
  const candidates=source.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&inBoundary(p.x,p.z,BORDER,.9)&&p.z<27&&Math.hypot(p.x,p.z-32)>8&&!collision(p.x,p.z,.62));
  candidates.sort((a,b)=>Math.hypot(a.x-RADIO_WISH.x,a.z-RADIO_WISH.z)-Math.hypot(b.x-RADIO_WISH.x,b.z-RADIO_WISH.z));
  return candidates[0]||RADIO_WISH;
 }

 function stopFallbackNoise(){
  try{radioNoise?.stop?.();}catch(_){ }
  try{radioNoise?.disconnect?.();}catch(_){ }
  radioNoise=null;
 }
 function startFallbackNoise(){
  stopFallbackNoise();
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  radioContext=radioContext||new AC();radioContext.resume?.().catch(()=>{});
  const length=Math.max(1,Math.floor(radioContext.sampleRate*1.5)),buffer=radioContext.createBuffer(1,length,radioContext.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(.42+.28*Math.sin(i*.071));
  const src=radioContext.createBufferSource(),filter=radioContext.createBiquadFilter(),gain=radioContext.createGain();
  src.buffer=buffer;src.loop=true;filter.type='bandpass';filter.frequency.value=1300;filter.Q.value=.65;gain.gain.value=.055;
  src.connect(filter);filter.connect(gain);gain.connect(radioContext.destination);src.start();radioNoise=src;
 }

 function placeChapterRadio(){
  const radios=typeof revision!=='undefined'?revision?.radios:null;if(!Array.isArray(radios)||!radios.length)return null;
  for(const r of radios){try{revision.stopRadio?.(r);}catch(_){ }r.on=false;r.broken=false;r.remaining=38;r.cooldown=0;if(r.group)r.group.visible=false;if(r.lamp)r.lamp.visible=false;}
  const r=radios[0],spot=chooseRadioSpot(),oldFloor=world.map.floor(r.x,r.z),newFloor=world.map.floor(spot.x,spot.z);
  const yOffset=Number.isFinite(r.group?.position?.y)?r.group.position.y-oldFloor:.46;
  r.x=spot.x;r.z=spot.z;r.village=false;r.on=false;r.broken=false;r.remaining=38;r.cooldown=0;
  if(r.group){r.group.position.set(r.x,newFloor+(Number.isFinite(yOffset)?yOffset:.46),r.z);r.group.rotation.z=0;r.group.visible=true;}
  if(r.lamp){r.lamp.position.set(r.x,newFloor+.71,r.z-.29);r.lamp.visible=false;}
  const inst=world.assets?.instances?.find(v=>v.g===r.group);if(inst){inst.x=r.x;inst.z=r.z;inst.distance=Math.max(inst.distance||0,90);}
  activeRadio=r;
  rebuildCompactObstacles(true);if(typeof addObstacle==='function')addObstacle(r.x,r.z,.48,'chapter-radio');
  return r;
 }

 function radioNear(){return state==='playing'&&activeRadio?.group?.visible&&Math.hypot(player.x-activeRadio.x,player.z-activeRadio.z)<2.8?activeRadio:null;}
 function toggleChapterRadio(r){
  const before=!!r.on;
  try{
   if(typeof revision?.toggleRadio==='function'){revision.toggleRadio(r);if(!!r.on!==before)return;}
   if(before&&typeof revision?.stopRadio==='function'){revision.stopRadio(r);r.on=false;stopFallbackNoise();if(r.lamp)r.lamp.visible=false;toast('ラジオを切った。',2.2);return;}
   if(!before&&typeof revision?.startRadio==='function'){revision.startRadio(r);r.on=true;if(r.lamp)r.lamp.visible=true;toast('ラジオをつけた。',2.2);return;}
  }catch(error){console.warn('radio legacy control fallback',error);}
  if(before){r.on=false;stopFallbackNoise();if(r.lamp)r.lamp.visible=false;toast('ラジオを切った。',2.2);}
  else{r.on=true;r.remaining=38;startFallbackNoise();if(r.lamp)r.lamp.visible=true;if(typeof revision!=='undefined')revision.target=r;toast('ラジオの雑音が鳴り始めた。',2.6);}
 }

 function postStartCleanup(){
  applyCompactRules();purgeBandages();cullRemovedArea();rebuildCompactObstacles(true);placeChapterRadio();
  if(typeof navReady!=='undefined')navReady=false;if(typeof buildNav==='function')buildNav();
 }

 applyCompactRules();purgeBandages();
 if(typeof MapManager!=='undefined')MapManager.prototype.buildCliffs=buildCompactCliffs;

 if(typeof init==='function'){
  const compactInit=init;
  init=async function(...args){
   applyCompactRules();purgeBandages();
   const result=await compactInit.apply(this,args);
   applyCompactRules();purgeBandages();
   if(typeof ready!=='undefined'&&ready&&typeof world!=='undefined'&&world?.map){cullRemovedArea();rebuildCompactObstacles(true);if(typeof navReady!=='undefined')navReady=false;if(typeof buildNav==='function')buildNav();}
   return result;
  };
 }

 function installStartWrapper(){
  const api=window.UbasuteyamaCandleForest;if(!api||typeof api.start!=='function'||api.__compactMapWrapped)return false;
  const base=api.start.bind(api);
  api.start=function(...args){applyCompactRules();const result=base(...args);if(result!==false)postStartCleanup();return result;};
  api.__compactMapWrapped=true;startWrapped=true;return true;
 }
 installStartWrapper();
 if(!startWrapped){const waiter=setInterval(()=>{if(installStartWrapper())clearInterval(waiter);},30);setTimeout(()=>clearInterval(waiter),10000);}

 if(typeof getInteraction==='function'){
  const baseGetInteraction=getInteraction;
  getInteraction=function(){const r=radioNear();return r?{type:'chapter-radio',radio:r}:baseGetInteraction();};
 }
 if(typeof interact==='function'){
  const baseInteract=interact;
  interact=function(){const r=radioNear();if(r){toggleChapterRadio(r);return;}return baseInteract();};
 }
 if(typeof updatePlayer==='function'){
  const baseUpdatePlayer=updatePlayer;
  updatePlayer=function(dt){baseUpdatePlayer(dt);const r=radioNear();if(r){show('interaction');const button=document.getElementById('interaction');if(button){button.disabled=false;button.textContent=r.on?'ラジオを切る':'ラジオをつける';}}};
 }
 window.BankaCompactForest={border:BORDER,get radio(){return activeRadio;},reapply:postStartCleanup};
})();
