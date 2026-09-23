
(()=>{
 'use strict';
 const lockerStyle=document.createElement('style');
 lockerStyle.textContent='#locker-visor{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;transition:opacity .16s ease;background:repeating-linear-gradient(180deg,rgba(4,5,4,.985) 0 7.2vh,rgba(18,20,17,.97) 7.2vh 9.1vh,rgba(0,0,0,.16) 9.1vh 12.2vh),linear-gradient(90deg,rgba(0,0,0,.94) 0 7%,rgba(0,0,0,.16) 20% 80%,rgba(0,0,0,.94) 93% 100%);box-shadow:inset 0 0 16vh 7vh rgba(0,0,0,.88)}#locker-visor.active{opacity:1}#locker-visor::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.78),transparent 18% 82%,rgba(0,0,0,.78)),linear-gradient(180deg,rgba(0,0,0,.78),transparent 18% 82%,rgba(0,0,0,.78));box-shadow:inset 0 0 0 2px rgba(28,31,27,.72)}#locker-visor::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(180deg,transparent 0 7.1vh,rgba(83,76,62,.20) 7.1vh 7.35vh,rgba(0,0,0,.55) 7.35vh 9.15vh,transparent 9.15vh 12.2vh);mix-blend-mode:multiply}';
 document.head.appendChild(lockerStyle);
 const lockerHudStyle=document.createElement('style');lockerHudStyle.textContent='#hud{z-index:7!important}#interaction{z-index:9!important}.hud-buttons{z-index:9!important}.health-status{position:relative;z-index:9}';document.head.appendChild(lockerHudStyle);
 const visor=document.createElement('div');visor.id='locker-visor';visor.setAttribute('aria-hidden','true');document.body.appendChild(visor);
 function makeLocker(x,z,r=0){const g=new THREE.Group();g.name='hiding-locker';const body=material(0x4f5558,{metalness:.22,roughness:.92});const trim=material(0x1e2225,{metalness:.35,roughness:.75});box(.95,2.08,.86,body,0,1.04,0,g);box(.84,1.88,.07,material(0x6b7276,{metalness:.24,roughness:.84}),0,1.02,.405,g);box(.02,1.9,.14,trim,-.33,1.02,.445,g);box(.02,1.9,.14,trim,.33,1.02,.445,g);for(const y of [.62,.93,1.24])box(.46,.03,.02,trim,0,y,.45,g);const handle=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.16,10),trim);handle.rotation.z=Math.PI/2;handle.position.set(.24,1.03,.47);g.add(handle);g.position.set(x,world.map.floor(x,z),z);g.rotation.y=r;scene.add(g);addObstacle(x,z,.55,'locker');return g;}
 const lockerSystem={spots:[],setupDone:false,active:null,hideX:0,hideZ:0,exitX:0,exitZ:0,investigated:false,divert:null,setup(){if(this.setupDone||!world?.map)return;const legacy=window.__villageAccess.toWorld(window.__villageAccess.buildings[0],-1.18,.92);const data=[{id:'cave',x:-87.4,z:-48.5,r:Math.PI/2},{id:'village',x:legacy.x,z:legacy.z,r:Math.PI},{id:'shrine',x:1.85,z:-84.7,r:0}];this.spots=data.map(d=>{const group=makeLocker(d.x,d.z,d.r);return {...d,group,hideX:d.x-Math.sin(d.r)*.08,hideZ:d.z-Math.cos(d.r)*.08,exitX:d.x+Math.sin(d.r)*1.22,exitZ:d.z+Math.cos(d.r)*1.22};});this.setupDone=true;},reset(){this.leave(true);this.investigated=false;this.divert=null;},hit(){if(state!=='playing')return null;if(this.active)return {type:'locker-exit',locker:this.active};for(const l of this.spots)if(Math.hypot(player.x-l.x,player.z-l.z)<2.05&&Math.abs((window.__villageAccess.actualFloor())-world.map.floor(l.x,l.z))<.7&&clearLine(player.x,player.z,l.exitX,l.exitZ))return {type:'locker-enter',locker:l};return null;},enter(locker){if(this.active)return;this.active=locker;this.hideX=locker.hideX;this.hideZ=locker.hideZ;this.exitX=locker.exitX;this.exitZ=locker.exitZ;this.investigated=false;this.divert=null;player.x=this.hideX;player.z=this.hideZ;resetInput();enemy.path=[];enemy.repath=0;visor.classList.add('active');toast('ロッカーに隠れた。Eで出る。',3.5);},leave(silent=false){if(!this.active){visor.classList.remove('active');return;}const l=this.active;this.active=null;this.investigated=false;this.divert=null;visor.classList.remove('active');const ex=this.exitX,ez=this.exitZ;if(!collision(ex,ez,.42)){player.x=ex;player.z=ez;}else{const safe=findSafePlayerPoint(ex,ez);player.x=safe.x;player.z=safe.z;}resetInput();if(!silent)toast('ロッカーから出た。',2.4);},chooseDivert(enemyPos){const waypoints=[{x:-34,z:34},{x:34,z:34},{x:-38,z:-20},{x:38,z:-20},{x:0,z:-63},{x:-73,z:14},{x:-88,z:-29},{x:68,z:-26},{x:80,z:-7},{x:26,z:28},{x:-96,z:35},{x:96,z:35}];const ranked=waypoints.map(p=>({p,away:Math.hypot(p.x-this.hideX,p.z-this.hideZ),route:world.ai.navigation.route(enemyPos,p)})).filter(v=>v.away>30&&v.route&&v.route.length).sort((a,b)=>b.away-a.away);const pick=ranked[0]||waypoints.map(p=>({p,away:Math.hypot(p.x-this.hideX,p.z-this.hideZ)})).sort((a,b)=>b.away-a.away)[0];this.divert=pick?{x:pick.p.x,z:pick.p.z,time:14}:null;return this.divert;}};
 window.__lockerSystem=lockerSystem;
 const initBase=init;init=async function(){const result=await initBase();if(ready)lockerSystem.setup();return result;};
 function findSafePlayerPoint(ax=0,az=32){
  const floor0=world?.map?.floor(ax,az)??0;
  const ok=(x,z)=>MapManager.inside(x,z,.42)&&!collision(x,z,.42)&&Math.abs((world?.map?.floor(x,z)??0)-floor0)<.42;
  if(ok(ax,az))return{x:ax,z:az};
  for(let r=.5;r<=6;r+=.5){const steps=Math.max(12,Math.ceil(r*14));for(let i=0;i<steps;i++){const a=i/steps*Math.PI*2,x=ax+Math.cos(a)*r,z=az+Math.sin(a)*r;if(ok(x,z))return{x,z};}}
  return{x:0,z:28};
 }
 function ensurePlayerFree(force=false){
  if(!world?.map)return;
  if(!force&&!collision(player.x,player.z,.42))return;
  const p=findSafePlayerPoint(player.x,player.z);player.x=p.x;player.z=p.z;camera.position.x=p.x;camera.position.z=p.z;
 }
 const startBase=GameManager.prototype.start;GameManager.prototype.start=function(){lockerSystem.reset();const result=startBase.call(this);lockerSystem.setup();ensurePlayerFree(true);return result;};
 const returnHomeBase=returnHome;returnHome=function(){lockerSystem.leave(true);return returnHomeBase();};
 function buildingVisible(id){const b=window.__villageAccess.buildings.find(v=>v.id===id);if(!b)return true;const near=Math.hypot(player.x-b.x,player.z-b.z)<27;return near&&(!touchDevice||!b.group||b.group.visible);}
 function syncVillageInteriorVisibility(){for(const p of parts)if(p.hostBuildingId&&!p.found&&p.group)p.group.visible=buildingVisible(p.hostBuildingId);for(const p of classic?.battery?.items||[])if(p.hostBuildingId&&!p.found&&p.group)p.group.visible=buildingVisible(p.hostBuildingId);for(const p of archive?.items||[])if(p.hostBuildingId&&p.group&&!archive.found.has(p.record.id))p.group.visible=buildingVisible(p.hostBuildingId);}
 const getInteractionBase=getInteraction;getInteraction=function(){return lockerSystem.hit()||getInteractionBase();};
 const interactBase=interact;interact=function(){const h=lockerSystem.hit();if(h){if(h.type==='locker-enter')lockerSystem.enter(h.locker);else lockerSystem.leave();return;}interactBase();};
 let stuckMoveTime=0,stuckLastX=0,stuckLastZ=0;
 const updatePlayerBase=updatePlayer;updatePlayer=function(dt){
  const inputTrying=Math.hypot(input.mx+(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),input.my+(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0))>.08;
  const bx=player.x,bz=player.z;updatePlayerBase(dt);
  if(lockerSystem.active){player.x=lockerSystem.hideX;player.z=lockerSystem.hideZ;camera.position.x=player.x;camera.position.z=player.z;camera.rotation.order='YXZ';camera.rotation.x=0;camera.rotation.y=(lockerSystem.active.r||0)+Math.PI;camera.rotation.z=0;flash.position.copy(camera.position);camera.getWorldDirection(V);flashTarget.position.copy(camera.position).addScaledVector(V,12);stuckMoveTime=0;}
  else{
   const moved=Math.hypot(player.x-bx,player.z-bz);
   if(inputTrying&&moved<.0005&&collision(player.x,player.z,.42))stuckMoveTime+=dt;else stuckMoveTime=0;
   if(stuckMoveTime>.55){ensurePlayerFree(true);stuckMoveTime=0;}
  }
  stuckLastX=player.x;stuckLastZ=player.z;syncVillageInteriorVisibility();const h=lockerSystem.hit();if(h){show('interaction');$('interaction').disabled=false;$('interaction').textContent=h.type==='locker-enter'?'ロッカーに隠れる':'ロッカーから出る';}
 };
 if(window.survivalSystem){const damageBase=window.survivalSystem.damage.bind(window.survivalSystem);window.survivalSystem.damage=function(dt){if(lockerSystem.active)return;return damageBase(dt);};}
 // Locker concealment is handled by AreaEnemyAI perception.
})();
