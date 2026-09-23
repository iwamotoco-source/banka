
(() => {
  const KEY='mayoi_vhs';
  let ghostCtx=null, ghostCanvas=null, sourceCanvas=null;
  let lastGhost=0;

  function applyRendererResolution(v){
    try{
      if(typeof renderer!=='undefined' && renderer){
        const q=(typeof settings!=='undefined' && settings.quality)||'normal';
        const normal=Math.min(devicePixelRatio||1,q==='low'?1:q==='high'?2:1.4);
        const vhsRatio=Math.min(normal,0.82);
        renderer.setPixelRatio(stablePixelRatio(v?vhsRatio:normal));
        renderer.setSize(innerWidth,innerHeight);
      }
    }catch(e){}
  }

  function set(v){
    document.body.classList.toggle('vhs-on',v);
    const fx=document.getElementById('vhsFx');
    if(fx) fx.classList.toggle('on',v);
    const t=document.getElementById('vhsToggle');
    if(t) t.checked=v;
    localStorage.setItem(KEY,v?'1':'0');
    applyRendererResolution(v);
  }

  function sizeGhost(){
    if(!ghostCanvas)return;
    const dpr=Math.min(devicePixelRatio||1,touchDevice?.75:1.25);
    const w=Math.max(1,Math.floor(innerWidth*dpr*.72));
    const h=Math.max(1,Math.floor(innerHeight*dpr*.72));
    if(ghostCanvas.width!==w||ghostCanvas.height!==h){
      ghostCanvas.width=w;ghostCanvas.height=h;
    }
  }

  function ghostLoop(now){
    requestAnimationFrame(ghostLoop);
    if(!document.body.classList.contains('vhs-on'))return;
    if(!sourceCanvas||!ghostCtx||!ghostCanvas)return;
    if(document.hidden||now-lastGhost<(touchDevice?100:52))return; // 約19fpsの残像サンプリング
    lastGhost=now;
    sizeGhost();
    try{
      ghostCtx.globalCompositeOperation='source-over';
      ghostCtx.fillStyle='rgba(0,0,0,.82)';
      ghostCtx.fillRect(0,0,ghostCanvas.width,ghostCanvas.height);
      ghostCtx.globalAlpha=.20;
      ghostCtx.filter='blur(0.5px) saturate(55%) contrast(102%)';
      ghostCtx.drawImage(sourceCanvas,1,0,ghostCanvas.width,ghostCanvas.height);
      ghostCtx.globalAlpha=.065;
      ghostCtx.filter='blur(1.1px) saturate(45%) brightness(115%)';
      ghostCtx.drawImage(sourceCanvas,-1,0,ghostCanvas.width,ghostCanvas.height);
      ghostCtx.globalAlpha=1;
      ghostCtx.filter='none';
    }catch(e){}
  }

  function init(){
    const t=document.getElementById('vhsToggle');
    ghostCanvas=document.getElementById('vhsGhost');
    sourceCanvas=document.getElementById('world');
    ghostCtx=ghostCanvas&&ghostCanvas.getContext('2d',{alpha:true});
    const initial=localStorage.getItem(KEY)===null ? true : localStorage.getItem(KEY)==='1';
    set(initial);
    if(t)t.addEventListener('change',()=>set(t.checked));
    addEventListener('resize',()=>{sizeGhost();applyRendererResolution(document.body.classList.contains('vhs-on'));});
    sizeGhost();
    requestAnimationFrame(ghostLoop);

    // renderer生成前にinitされた場合も後から解像度を反映
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(typeof renderer!=='undefined' && renderer){
        applyRendererResolution(document.body.classList.contains('vhs-on'));
        clearInterval(timer);
      } else if(tries>40) clearInterval(timer);
    },250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
