(()=>{
'use strict';
const shade=document.createElement('div');shade.id='landscape-guide';shade.setAttribute('role','dialog');shade.setAttribute('aria-modal','true');shade.setAttribute('aria-label','横画面でプレイしてください');
shade.innerHTML='<div><svg viewBox="0 0 100 80" aria-hidden="true"><rect x="23" y="20" width="60" height="35" rx="5"/><path d="M12 45A32 32 0 0 1 52 8M43 4l10 4-5 10"/><circle cx="75" cy="37.5" r="1.5"/></svg><h2>端末を横向きにしてください</h2><p>このゲームは横画面でプレイします。</p><small>画面が回転しない場合は、端末の縦向きロックを解除してください。</small></div>';
document.body.appendChild(shade);
function blocked(){return innerHeight>innerWidth;}
function sync(){const vertical=blocked();shade.hidden=!vertical;if(vertical){resetInput();if(state==='playing')pauseGame();}else if(typeof resize==='function')resize();}
window.__landscapeGate={blocked};
window.addEventListener('resize',sync);window.addEventListener('orientationchange',()=>requestAnimationFrame(sync));
const start=GameManager.prototype.start;GameManager.prototype.start=function(...args){const result=start.apply(this,args);sync();return result;};
const resume=resumeGame;resumeGame=function(...args){if(blocked()){sync();return;}return resume.apply(this,args);};
// Keep the existing health and stamina elements/IDs while arranging three gauges across one row.
const health=document.querySelector('.health-status');if(health){const wrap=document.createElement('div');wrap.className='landscape-health-meter';for(const selector of ['.health-head','.health-track']){const el=health.querySelector(selector);if(el)wrap.appendChild(el);}health.prepend(wrap);}
sync();
})();
