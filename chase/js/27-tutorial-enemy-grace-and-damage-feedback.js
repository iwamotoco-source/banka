
(()=>{
 'use strict';
 const tutorialImages=[];
 const viewer=document.getElementById('tutorial-viewer'),image=document.getElementById('tutorial-image'),page=document.getElementById('tutorial-page');
 const prev=document.getElementById('tutorial-prev'),next=document.getElementById('tutorial-next'),close=document.getElementById('tutorial-close');
 const tut={index:0,initial:false,returnState:null,returnModal:null,open(initial=false,returnModal=null){
   this.index=0;this.initial=!!initial;this.returnState=typeof state!=='undefined'?state:null;this.returnModal=returnModal;
   if(returnModal)hide(returnModal);
   if(typeof state!=='undefined'&&state==='playing'){state='paused';resetInput();audio.update();}
   this.render();viewer.classList.remove('hidden');viewer.setAttribute('aria-hidden','false');close.focus({preventScroll:true});
  },render(){image.src=tutorialImages[this.index];page.textContent=String(this.index+1).padStart(2,'0')+' / 02';prev.disabled=this.index===0;next.textContent=this.index===tutorialImages.length-1?'ゲームへ戻る':'次へ →';},
  finish(){viewer.classList.add('hidden');viewer.setAttribute('aria-hidden','true');
   if(this.returnModal){show(this.returnModal);this.returnModal=null;document.querySelector('#help-modal button')?.focus();return;}
   const wasInitial=this.initial;this.initial=false;
   // The first successful pickup starts the encounter countdown.
   if(this.returnState==='playing'){state='playing';resetInput();audio.init();clock.getDelta();document.activeElement?.blur();}
   this.returnState=null;
  } };
 window.gameTutorial=tut;
 prev.onclick=()=>{if(tut.index>0){tut.index--;tut.render();}};
 next.onclick=()=>{if(tut.index<tutorialImages.length-1){tut.index++;tut.render();}else tut.finish();};
 close.onclick=()=>tut.finish();
 viewer.addEventListener('click',e=>{if(e.target===viewer)tut.finish();});
 

 // Mark only a fresh start from the title for the automatic tutorial. Retry/replay are immediate.
 let tutorialOnNextRun=false;
 document.getElementById('start')?.addEventListener('click',()=>{tutorialOnNextRun=true;},true);
 for(const id of ['retry','replay'])document.getElementById(id)?.addEventListener('click',()=>{tutorialOnNextRun=false;},true);
 const tutorialStartBase=GameManager.prototype.start;
 GameManager.prototype.start=function(){
   const result=tutorialStartBase.call(this);
   if(tutorialOnNextRun){
     tutorialOnNextRun=false;window.__enemyGraceControl?.hold();
     
   } // No countdown before a pickup.
   return result;
 };

 // The existing proximity HP drain had no dedicated hit feedback. Add throttled visual/audio feedback.
 let hurtCooldown=0;
 const survivalRef=window.survivalSystem;
 if(survivalRef){
  const survivalDamageBase=survivalRef.damage.bind(survivalRef);
  survivalRef.damage=function(dt){
    hurtCooldown=Math.max(0,hurtCooldown-dt);
    const before=this.hp;survivalDamageBase(dt);const lost=before-this.hp;
    if(lost>0&&this.hp>0&&hurtCooldown<=0){
      hurtCooldown=.68;
      const fx=document.getElementById('damage-hit');
      if(fx){fx.classList.remove('flash');void fx.offsetWidth;fx.classList.add('flash');}
      try{audio.tone(92,.13,.075,'sawtooth',48);setTimeout(()=>audio.tone(54,.12,.035,'sine',36),55);}catch(_){}
      if(navigator.vibrate)try{navigator.vibrate(22);}catch(_){}
    }
  };
 }

 // If the player returns home while the tutorial is open, remove it cleanly.
 const tutorialHomeBase=returnHome;
 returnHome=function(){viewer.classList.add('hidden');tut.initial=false;tut.returnModal=null;tut.returnState=null;window.__enemyGraceControl?.hold();return tutorialHomeBase();};
})();
