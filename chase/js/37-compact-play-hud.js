
(()=>{
 'use strict';
 // Preserve existing nodes and their handlers; no document-wide observer.
 function arrangeHUD(){
  const top=document.querySelector('#hud .hud-top'),summary=top?.querySelector('.hud-summary');
  const button=document.getElementById('records-button');
  if(summary&&button&&button.parentElement!==summary)summary.appendChild(button);
  const health=top?.querySelector('.health-status'),stamina=document.querySelector('#hud .stamina-wrap');
  if(health&&stamina&&stamina.parentElement!==health)health.appendChild(stamina);
 }
 arrangeHUD();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arrangeHUD,{once:true});
 const hint=document.getElementById('mission-hint');let lastObjective=hint?.textContent||'',hintTimer=0;
 const previousHUD=updateHUD;
 updateHUD=function(...args){
  const result=previousHUD.apply(this,args);arrangeHUD();
  const objective=hint?.textContent||'';
  if(objective!==lastObjective){lastObjective=objective;clearTimeout(hintTimer);if(state==='playing'){hint.classList.add('objective-update');hintTimer=setTimeout(()=>hint.classList.remove('objective-update'),3500);}else hint?.classList.remove('objective-update');}
  return result;
 };
})();

