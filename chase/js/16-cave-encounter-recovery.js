
// Per-run encounter and active-play region recovery. No wall bypass outside the staged scare.
const caveEncounter={used:false,phase:0,region:null,missing:0};
function pursuitRegion(x,z){const a=world.map.area(x,z);return a==='洞窟'?'cave':a==='森'?'forest':null;}
function safePursuitPoint(region){
 const candidates=[];
 for(let x=-104;x<forestEastLimit-3;x+=3)for(let z=-106;z<40;z+=3){
  const d=Math.hypot(x-player.x,z-player.z);
  if(d<18||d>42||pursuitRegion(x,z)!==region||collision(x,z,.8))continue;
  if(Math.hypot(x-rearPassage.x,z-rearPassage.z)<9)continue;
  candidates.push({x,z});
 }
 for(let i=candidates.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 for(const p of candidates.slice(0,80))if(world.ai.navigation.route(p,player).length)return p;
 return null; // Retry later rather than spawning close to the player or behind a lock.
}
function placePursuer(p){
 enemy.x=p.x;enemy.z=p.z;world.ai.reset();world.ai.lastSeen={x:player.x,z:player.z};
 enemyHasSpawned=true;enemyMesh.visible=true;
 const cave=pursuitRegion(p.x,p.z)==='cave';enemyMesh.scale.setScalar(cave?.68:1);
 enemyMesh.position.set(p.x,world.map.floor(p.x,p.z)+(cave?1.6:2.5),p.z);
 enemyMesh.rotation.y=Math.atan2(player.x-p.x,player.z-p.z);
}
const encounterStart=GameManager.prototype.start;
GameManager.prototype.start=function(){Object.assign(caveEncounter,{used:false,phase:0,region:null,missing:0});return encounterStart.call(this);};
function updateCaveEncounter(dt){
 // Perception owns pursuit. Do not teleport the enemy to a hidden player's region.
 return false;
}

const encounterEnemyUpdate=updateEnemy;
updateEnemy=function(dt){if(updateCaveEncounter(dt)){classic?.faces?.tickAnimation(elapsed);animateEnemyCorruption();return 0;}return encounterEnemyUpdate(dt);};

