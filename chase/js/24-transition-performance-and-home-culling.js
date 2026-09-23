
(()=>{
 'use strict';
 // The start chain used to rebuild the 321x321 navigation grid several times while intermediate gates were changing.
 // Defer those requests and do one authoritative rebuild after the complete new-run state is ready.
 const navBuildNow=buildNav;
 let navBatch=false,navDirty=false;
 buildNav=function(){if(navBatch){navDirty=true;navReady=false;return;}return navBuildNow();};
 const transitionStart=GameManager.prototype.start;
 GameManager.prototype.start=function(){
  navBatch=true;navDirty=false;
  let result;
  try{result=transitionStart.call(this);}finally{navBatch=false;if(navDirty){navReady=false;buildNav();}}
  return result;
 };

 // Avoid reallocating the WebGL drawing buffer merely because the UI changed from title to gameplay or back.
 const resizeBase=resize;
 let lastResizeW=0,lastResizeH=0,lastResizeRatio=-1,lastResizeQuality='';
 resize=function(force=false){
  layoutHud();if(!renderer)return;
  const wanted=Math.min(devicePixelRatio||1,touchDevice?(settings.quality==='low'?1:settings.quality==='high'?1.5:1.2):(settings.quality==='low'?1:settings.quality==='high'?2:1.4));
  const ratio=stablePixelRatio(wanted),w=innerWidth,h=innerHeight;
  const changed=force||w!==lastResizeW||h!==lastResizeH||Math.abs(ratio-lastResizeRatio)>.001||settings.quality!==lastResizeQuality;
  if(!changed)return;
  lastResizeW=w;lastResizeH=h;lastResizeRatio=ratio;lastResizeQuality=settings.quality;
  renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 };
 // Prime the cache to the already-created renderer without reallocating it.
 lastResizeW=innerWidth;lastResizeH=innerHeight;lastResizeRatio=renderer?.getPixelRatio?.()??-1;lastResizeQuality=settings.quality;

 // Do not leave either 300k+ triangle village house active behind the title screen.
 const transitionHome=returnHome;
 returnHome=function(){
  const value=transitionHome();
  if(world?.assets?.instances)for(const p of world.assets.instances)if(p.g&&p.g.name==='village_house')p.g.visible=false;
  if(enemyCorruption)enemyCorruption.visible=false;
  return value;
 };

 // Story placement used to scan every reachable navigation cell on every new game.
 // Precompute only the expensive terrain/collision portion while the title screen is idle; each run still gets a fresh random layout.
 if(typeof StoryArchive!=='undefined'){
  const prepareStoryPool=inst=>{
   if(inst?._safeStoryPool||!world?.spawns?.forest?.reachable)return inst?._safeStoryPool||null;
   inst._safeStoryPool=world.spawns.forest.reachable.filter(p=>{
    if(collision(p.x,p.z,.65)||Math.hypot(p.x,p.z-32)<5)return false;
    const y=world.map.floor(p.x,p.z);
    return [[.3,0],[-.3,0],[0,.3],[0,-.3]].every(([dx,dz])=>Math.abs(world.map.floor(p.x+dx,p.z+dz)-y)<.025);
   }).map(p=>({x:p.x,z:p.z,area:world.map.area(p.x,p.z)}));
   return inst._safeStoryPool;
  };
  StoryArchive.prototype.place=function(){
   const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
   const occupied=[...parts,...classic.battery.items,seven.lock.key,...revision.radios,{x:revision.paper.position.x,z:revision.paper.position.z},{x:0,z:36}];
   const pool=(prepareStoryPool(this)||[]).filter(p=>!occupied.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<2.8));
   const selected=[];
   const choose=(candidates,count)=>{let added=0;for(const p of shuffle(candidates)){if(selected.every(q=>Math.hypot(q.x-p.x,q.z-p.z)>5)){selected.push(p);if(++added===count)break;}}};
   choose(pool.filter(p=>p.area==='洞窟'),3);
   choose(pool.filter(p=>p.area==='神社'||p.area==='社殿'),3);
   choose(pool.filter(p=>!['洞窟','神社','社殿'].includes(p.area)),14-selected.length);
   if(selected.length<14)choose(pool,14-selected.length);
   if(selected.length!==14)throw Error('記録を配置できる安全な場所が不足しています');
   const points=shuffle(selected);this.items.forEach((p,i)=>{const q=points[i];Object.assign(p,{x:q.x,z:q.z,y:world.map.floor(q.x,q.z),area:q.area});p.group.position.set(p.x,p.y+.008,p.z);p.group.rotation.y=Math.random()*Math.PI*2;p.group.visible=true;});
  };
  const warmStoryPool=()=>{if(state==='home'&&archive&&!archive._safeStoryPool){try{prepareStoryPool(archive);}catch(e){console.warn('story pool warmup skipped',e);}}};
  if('requestIdleCallback'in window)requestIdleCallback(warmStoryPool,{timeout:1400});else setTimeout(warmStoryPool,350);
 }
})();
