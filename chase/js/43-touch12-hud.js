(()=>{
'use strict';
// Secondary touch pointers do not reliably produce click events on mobile.
// Invoke HUD actions on pointerdown, without cancelling the movement pointer.
let lastButton=null,lastTime=0;
document.addEventListener('pointerdown',e=>{
 const b=e.target.closest?.('#compass-toggle,#records-button,#hud-help,#pause');
 if(!b||b.disabled||e.pointerType==='mouse'||state!=='playing')return;
 e.preventDefault();e.stopImmediatePropagation();lastButton=b;lastTime=performance.now();b.click();
},true);
document.addEventListener('click',e=>{if(e.detail!==0&&e.target.closest?.('button')===lastButton&&performance.now()-lastTime<700){e.preventDefault();e.stopImmediatePropagation();}},true);
if(touchDevice||navigator.maxTouchPoints>0)document.body.classList.add('touch-game');
})();
