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
