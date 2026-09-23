
(()=>{
 'use strict';

 // --- Inventory launcher ----------------------------------------------------
 function moveInventoryButton(){
  const button=document.getElementById('records-button');
  const hud=document.getElementById('hud');
  const joystick=document.getElementById('joystick');
  if(!button||!hud)return;
  button.setAttribute('aria-label','所持品を開く');
  button.setAttribute('title','所持品');
  if(button.parentElement!==hud){
   if(joystick&&joystick.parentElement===hud)joystick.insertAdjacentElement('afterend',button);
   else hud.appendChild(button);
  }
 }

 // StoryArchive is created asynchronously after the 3D world has loaded. Move the button as soon as its UI is built.
 try{
  if(typeof StoryArchive!=='undefined'&&StoryArchive.prototype?.ui){
   const uiBase=StoryArchive.prototype.ui;
   StoryArchive.prototype.ui=function(...args){const r=uiBase.apply(this,args);queueMicrotask(moveInventoryButton);return r;};
  }
 }catch(_e){}

 // The compact HUD wrapper normally pulls the records button back into the upper-left summary on every HUD refresh.
 // Run after that wrapper and put it back beside the movement stick.
 try{
  const hudBase=updateHUD;
  updateHUD=function(...args){const r=hudBase.apply(this,args);moveInventoryButton();return r;};
 }catch(_e){}
 document.addEventListener('DOMContentLoaded',()=>{moveInventoryButton();setTimeout(moveInventoryButton,250);setTimeout(moveInventoryButton,1200);},{once:true});

 // --- iOS/Safari-safe gameplay audio recovery -----------------------------
 // The title and game use separate audio paths. Web Audio can return to a suspended/interrupted state after
 // an async transition, app switch, modal, rotation or audio-route change. Resume it from the next trusted gesture.
 function syncGameAudio(){
  try{
   if(typeof audio==='undefined'||!audio?.ctx)return;
   audio.update?.();
   if(typeof chaseMusic!=='undefined'){
    chaseMusic.prepare?.(audio.ctx,audio.master);
    chaseMusic.sync?.();
   }
   if(typeof revision!=='undefined')revision?.syncAudio?.();
  }catch(_e){}
 }
 function silentUnlock(ctx){
  try{
   const b=ctx.createBuffer(1,1,Math.max(22050,ctx.sampleRate||44100));
   const s=ctx.createBufferSource(),g=ctx.createGain();g.gain.value=0;s.buffer=b;s.connect(g);g.connect(ctx.destination);s.start(0);
  }catch(_e){}
 }
 function ensureGameAudio(trustedGesture=false){
  try{
   if(typeof audio==='undefined'||!audio)return;
   const frontActive=document.body.classList.contains('ux-front');
   if(!trustedGesture&&!audio.ctx&&frontActive)return;
   audio.init?.();
   const ctx=audio.ctx;if(!ctx||ctx.state==='closed')return;
   if(trustedGesture)silentUnlock(ctx);
   const finish=()=>{silentUnlock(ctx);syncGameAudio();};
   if(ctx.state!=='running'){
    const p=ctx.resume?.();
    if(p&&typeof p.then==='function')p.then(finish).catch(()=>{});
   }else finish();
  }catch(_e){}
 }

 try{
  if(typeof audio!=='undefined'&&audio?.init){
   const initBase=audio.init.bind(audio);
   audio.init=function(...args){
    const r=initBase(...args);
    const ctx=this.ctx;
    if(ctx&&!ctx.__phase13RecoveryBound){
     ctx.__phase13RecoveryBound=true;
     ctx.addEventListener?.('statechange',()=>{if(ctx.state==='running')syncGameAudio();});
    }
    if(ctx&&ctx.state!=='running'&&ctx.state!=='closed')ctx.resume?.().then?.(()=>syncGameAudio()).catch?.(()=>{});
    return r;
   };
  }
 }catch(_e){}

 // Window capture fires before HUD handlers that intentionally stop propagation for simultaneous mobile controls.
 const trusted=()=>ensureGameAudio(true);
 window.addEventListener('pointerdown',trusted,{capture:true,passive:true});
 window.addEventListener('touchstart',trusted,{capture:true,passive:true});
 window.addEventListener('keydown',trusted,{capture:true});
 window.addEventListener('pageshow',()=>ensureGameAudio(false));
 window.addEventListener('focus',()=>ensureGameAudio(false));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)ensureGameAudio(false);});

 // Audio is intentionally not started at page load. The first trusted gesture unlocks it without leaking game ambience into the title screen.
})();
