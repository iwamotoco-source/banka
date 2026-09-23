
(()=>{
 'use strict';
 // Lightweight offline UI feedback using the game's existing WebAudio chain.
 let last=0;
 function uiTick(kind='tap'){
  try{
   if(typeof settings!=='undefined'&&settings.muted)return;
   if(typeof audio==='undefined'||!audio.ctx||audio.ctx.state!=='running'||!audio.master)return;
   const now=audio.ctx.currentTime,o=audio.ctx.createOscillator(),g=audio.ctx.createGain();
   o.type=kind==='confirm'?'sine':'triangle';
   const f=kind==='confirm'?520:kind==='back'?260:390;
   o.frequency.setValueAtTime(f,now);o.frequency.exponentialRampToValueAtTime(kind==='confirm'?690:310,now+.045);
   g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(kind==='confirm'?.055:.038,now+.006);g.gain.exponentialRampToValueAtTime(.0001,now+.07);
   o.connect(g);g.connect(audio.master);o.start(now);o.stop(now+.08);
  }catch(_e){}
 }
 document.addEventListener('pointerdown',e=>{
   if(document.getElementById('ux-front')?.contains(e.target))return; // title UI already has its own SFX
   const el=e.target.closest?.('button,[role="button"],select,input[type="checkbox"],input[type="range"],.inventory-item,.item-card,.slot,.record-item');
   if(!el||el.disabled)return;
   const t=performance.now();if(t-last<45)return;last=t;
   const txt=(el.textContent||el.getAttribute('aria-label')||'').trim();
   uiTick(/決定|使用|取得|拾|装着|解錠|入る|出る/.test(txt)?'confirm':/戻|閉じ|キャンセル/.test(txt)?'back':'tap');
 },true);
})();
