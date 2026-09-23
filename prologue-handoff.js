(()=>{
 'use strict';
 const end=document.getElementById('end');
 if(!end)return;
 let leaving=false;
 const overlay=document.createElement('div');
 overlay.id='banka-handoff';overlay.setAttribute('aria-live','polite');
 overlay.innerHTML='<div class="handoff-inner"><span class="handoff-mark"></span><span class="handoff-text">迷いの森へ</span></div>';
 document.body.appendChild(overlay);
 function startChase(){
  if(leaving)return;leaving=true;end.hidden=true;
  try{sessionStorage.setItem('banka_chase_autostart','1');}catch(_){}
  requestAnimationFrame(()=>overlay.classList.add('active'));
  setTimeout(()=>overlay.classList.add('loading'),560);
  setTimeout(()=>location.href='chase/index.html?autostart=1',1450);
 }
 new MutationObserver(()=>{if(!end.hidden)startChase();}).observe(end,{attributes:true,attributeFilter:['hidden']});
 if(!end.hidden)startChase();
 const key='banka_story_skip_enabled';
 const skip=document.createElement('button');skip.type='button';skip.id='banka-story-skip';skip.textContent='シナリオをスキップ';skip.hidden=true;document.body.appendChild(skip);
 const enabled=()=>{try{return localStorage.getItem(key)==='1';}catch(_){return false;}};
 const card=document.getElementById('prologueCard');
 const sync=()=>{skip.hidden=!enabled()||!document.getElementById('start').hidden||!card.hidden||!end.hidden||leaving;};
 skip.addEventListener('click',()=>{if(!skip.hidden)window.bankaPrologue?.skipToChase?.();});
 new MutationObserver(sync).observe(document.getElementById('start'),{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(sync).observe(card,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(sync).observe(end,{attributes:true,attributeFilter:['hidden']});
 function addSkipSetting(body){
  const row=document.createElement('label');row.className='banka-skip-setting';
  const label=document.createElement('span');label.textContent='シナリオスキップ（テスト用）';
  const input=document.createElement('input');input.type='checkbox';input.checked=enabled();
  input.addEventListener('change',()=>{try{localStorage.setItem(key,input.checked?'1':'0');}catch(_){}sync();});
  row.append(label,input);body.append(row);
 }
 window.BankaIntegration={startChase,addSkipSetting};sync();
})();
