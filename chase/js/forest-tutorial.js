/* First chapter's illustrated guide. Loaded after module-bridge.js. */
(()=>{
  'use strict';
  const root=document.createElement('section');root.id='forest-guide';root.hidden=true;
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','森の遊び方');
  root.innerHTML=`<div class="fg-shot"></div><div class="fg-vignette"></div>
    <button type="button" class="fg-skip">スキップ</button>
    <article class="fg-card" aria-live="polite"><h2 class="fg-title"></h2><p class="fg-speech"></p><p class="fg-rule"></p>
      <div class="fg-bottom"><span class="fg-page"></span><div class="fg-nav"><button type="button" class="fg-prev">戻る</button><button type="button" class="fg-next">次へ</button></div></div></article>
    <img class="fg-guide" src="assets/tutorial/fox-guide.webp" alt="狐面の少女" draggable="false">`;
  document.body.appendChild(root);
  const $=selector=>root.querySelector(selector);
  const pages=[
    {key:'forest',title:'森を進む',image:'forest.jpeg',focus:['14%','78%'],line:'左の丸いパッドで移動。外側へ倒すと走ります。右側をなぞると視点が動きます。走る間はスタミナを消費します。',voice:'ここでは、立ち止まらないで。足を動かして、道を探して。'},
    {key:'candle',title:'蝋燭を拾う',image:'candle.jpeg',focus:['50%','54%'],line:'白い蝋燭に近づき、画面に触れるか取得ボタンで拾えます。所持品は最大３枠。左下の「ITEM」で確認できます。',voice:'落ちている蝋燭を、灯の消えた場所へ運んで。'},
    {key:'lantern',title:'七つの灯',image:'lantern.jpeg',focus:['50%','51%'],line:'蝋燭を持って灯籠に近づくと、１本消費して火を灯せます。森にある７基すべてを点灯してください。',voice:'ひとつずつでいい。七つの灯が揃えば、道が開くから。'},
    {key:'enemy',title:'見つかったら',image:'enemy.jpeg',focus:['50%','51%'],line:'あれに捕まる前に距離を取りましょう。画面上部で体力・スタミナ・懐中電灯の電池を確認。電池は森で補充できます。',voice:'あれを見たら、振り返らずに走って。'},
    {key:'tunnel',title:'針の示す先へ',image:'tunnel.jpeg',focus:['43%','48%'],line:'コンパスの針はトンネルを指します。最初は閉ざされていますが、７基すべてに火を灯すと開き、次の章へ進めます。',voice:'帰る道は、そこにある。でも今はまだ……開かない。'}
  ];
  let index=0,active=false,shown=false,initialFocus=null,touchX=null;
  let tracking=false,lastPosition=null,travelled=0,pausedGame=false;
  let cueContext=null,cueBuffer=null,cueLoading=null;
  const cuePath='assets/tutorial/hyoshigi.mp3';
  const cueBytes=typeof fetch==='function'?fetch(cuePath).then(r=>{if(!r.ok)throw Error('Guide SE HTTP '+r.status);return r.arrayBuffer();})
    .catch(e=>{console.warn('Guide SE:',e);return null;}):Promise.resolve(null);
  function prepareSound(){
    const AudioContextType=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextType)return;
    if(!cueContext)cueContext=new AudioContextType();
    cueContext.resume().catch(()=>{});
    if(!cueLoading)cueLoading=cueBytes.then(data=>data?cueContext.decodeAudioData(data):null)
      .then(buffer=>{cueBuffer=buffer;}).catch(e=>console.warn('Guide SE:',e));
  }
  function playSound(){
    if(!cueContext||!cueBuffer){prepareSound();cueLoading?.then(()=>{if(cueBuffer)playSound();});return;}
    if(cueContext.state==='suspended')cueContext.resume().catch(()=>{});
    const source=cueContext.createBufferSource();source.buffer=cueBuffer;
    const gain=cueContext.createGain();gain.gain.value=.58;source.connect(gain);gain.connect(cueContext.destination);source.start();
  }
  function draw(){const p=pages[index];root.className='fg-scene-'+p.key;
    $('.fg-shot').style.backgroundImage=`url("assets/tutorial/${p.image}")`;
    $('.fg-title').textContent=p.title;$('.fg-speech').textContent=p.voice;$('.fg-rule').textContent=p.line;
    $('.fg-prev').disabled=index===0;$('.fg-next').textContent=index===pages.length-1?'探索に戻る':'次へ';
    $('.fg-page').textContent=`${index+1} / ${pages.length}`;
  }
  function open(){if(active)return true;
    initialFocus=document.activeElement;shown=true;active=true;index=0;draw();
    if(typeof state!=='undefined'&&state==='playing'){
      state='paused';pausedGame=true;resetInput();audio.update();
    }
    root.hidden=false;$('.fg-next').focus();playSound();return true;
  }
  function finish(){if(!active)return;active=false;root.hidden=true;initialFocus?.focus?.();
    window.dispatchEvent(new CustomEvent('banka:tutorial-complete',{detail:{chapter:'forest'}}));
    if(pausedGame){pausedGame=false;state='playing';resetInput();audio.init();clock.getDelta();document.activeElement?.blur();}
  }
  function trackSteps(){
    if(!tracking)return;
    if(typeof state!=='undefined'&&state==='playing'&&typeof player!=='undefined'){
      const current={x:player.x,z:player.z};
      if(lastPosition){const moved=Math.hypot(current.x-lastPosition.x,current.z-lastPosition.z);if(moved<.8)travelled+=moved;}
      lastPosition=current;
      if(travelled>=2.5){tracking=false;open();return;}
    }
    requestAnimationFrame(trackSteps);
  }
  function beginTracking(){
    prepareSound();
    if(shown||tracking)return;
    tracking=true;travelled=0;lastPosition=typeof player!=='undefined'?{x:player.x,z:player.z}:null;requestAnimationFrame(trackSteps);
  }
  $('.fg-skip').addEventListener('click',finish);
  $('.fg-prev').addEventListener('click',()=>{if(index>0){index--;draw();playSound();}});
  $('.fg-next').addEventListener('click',()=>{playSound();if(index===pages.length-1)finish();else{index++;draw();}});
  root.addEventListener('touchstart',e=>{if(e.touches.length===1)touchX=e.touches[0].clientX;},{passive:true});
  root.addEventListener('touchend',e=>{if(touchX===null||!e.changedTouches.length||e.target.closest('button')){touchX=null;return;}
    const change=e.changedTouches[0].clientX-touchX;touchX=null;if(change< -70&&index<pages.length-1){index++;draw();playSound();}else if(change>70&&index>0){index--;draw();playSound();}
  },{passive:true});
  document.addEventListener('keydown',e=>{if(!active)return;if(e.key==='ArrowRight'){e.preventDefault();$('.fg-next').click();}else if(e.key==='ArrowLeft'){e.preventDefault();$('.fg-prev').click();}else if(e.key==='Escape'){e.preventDefault();finish();}});
  // Initial start is owned by module-bridge.js. Observe it without wrapping or calling start again.
  window.addEventListener('ubasuteyama:started',beginTracking,{once:true});
  window.BankaForestTutorial={open,finish,get active(){return active;}};
})();
