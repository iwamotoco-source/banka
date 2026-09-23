
(()=>{
 'use strict';
 function findSafeNear(ax,az,r=.32){
  if(!world?.map)return{x:ax,z:az};const area=world.map.area(ax,az),fy=world.map.floor(ax,az);
  const ok=(x,z)=>MapManager.inside(x,z,.5)&&!collision(x,z,r)&&world.map.area(x,z)===area&&Math.abs(world.map.floor(x,z)-fy)<.5;
  if(ok(ax,az))return{x:ax,z:az};
  for(let ring=.35;ring<=4;ring+=.35){const steps=Math.max(10,Math.ceil(ring*12));for(let i=0;i<steps;i++){const a=i/steps*Math.PI*2,x=ax+Math.cos(a)*ring,z=az+Math.sin(a)*ring;if(ok(x,z))return{x,z};}}
  return{x:ax,z:az};
 }
 function repairFieldItem(p,yOffset){if(!p||p.found||p.hostBuildingId||!p.group?.visible)return;if(!collision(p.x,p.z,.30))return;const q=findSafeNear(p.x,p.z,.30);p.x=q.x;p.z=q.z;const y=world.map.floor(q.x,q.z);p.group.position.set(q.x,y+yOffset,q.z);}
 const base=GameManager.prototype.start;
 GameManager.prototype.start=function(){const result=base.call(this);for(const p of parts)repairFieldItem(p,.42);for(const p of classic?.battery?.items||[])repairFieldItem(p,.23);
  const ls=window.__lockerSystem;if(ls?.spots)for(const l of ls.spots){if(collision(l.exitX,l.exitZ,.42)){const q=findSafeNear(l.exitX,l.exitZ,.42);l.exitX=q.x;l.exitZ=q.z;}}
  return result;};
})();
