(()=>{
 'use strict';
 let leaving=false;
 const overlay=document.createElement('div');
 overlay.id='banka-handoff';overlay.setAttribute('aria-live','polite');
 overlay.innerHTML='<div class="handoff-inner"><span class="handoff-mark"></span><span class="handoff-text">物語を読み込んでいます</span></div>';
 document.body.appendChild(overlay);
 const formatTime=value=>{const n=Math.max(0,Math.floor(Number(value)||0));return [Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(v=>String(v).padStart(2,'0')).join(':');};
 function snapshot(){
  let seconds=0;try{if(typeof elapsed!=='undefined')seconds=elapsed;}catch(_){}
  let lamps=0;try{lamps=window.UbasuteyamaCandleForest?.progress?.lit||0;}catch(_){}
  const result={seconds,time:formatTime(seconds),lamps,total:7};
  try{sessionStorage.setItem('banka_chase_result',JSON.stringify(result));}catch(_){}
  return result;
 }
 function navigate(url,label,hold=0){
  if(leaving)return;leaving=true;snapshot();
  setTimeout(()=>{overlay.querySelector('.handoff-text').textContent=label;overlay.classList.add('active');setTimeout(()=>overlay.classList.add('loading'),460);setTimeout(()=>location.href=url,1250);},hold);
 }
 window.addEventListener('ubasuteyama:chapter-complete',()=>navigate('../chapter1-interlude.html','第一章　章間',1800),{once:true});
 window.addEventListener('ubasuteyama:result',event=>{
  if(event.detail?.outcome==='victory')navigate('../chapter1-interlude.html','第一章　章間',1800);
  if(event.detail?.outcome==='gameover')navigate('../gameover.html','',120);
 });
})();
