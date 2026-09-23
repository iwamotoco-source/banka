// The grace period uses active gameplay time and begins only after the initial tutorial is dismissed.
let enemyHasSpawned=false,enemyGraceElapsed=0,enemyGraceStarted=false;
window.__enemyGraceControl={
 start(){if(enemyHasSpawned||enemyGraceStarted)return;enemyGraceElapsed=0;enemyGraceStarted=true;},
 hold(){enemyGraceElapsed=0;enemyGraceStarted=false;},
 reset(active=false){enemyGraceElapsed=0;enemyGraceStarted=!!active;},
 get elapsed(){return enemyGraceElapsed;},get active(){return enemyGraceStarted;}
};
const delayedStart=GameManager.prototype.start;
GameManager.prototype.start=function(){
 enemyHasSpawned=false;enemyGraceElapsed=0;enemyGraceStarted=false;
 delayedStart.call(this);
 enemyMesh.visible=false;enemy.x=100000;enemy.z=100000;enemy.path=[];enemy.repath=0;
 seven.static.clear();$('danger').style.opacity=0;chaseMusic.stop(true);
 if(enemyCorruption){enemyCorruption.rotation.z=0;enemyCorruption.scale.setScalar(1);enemyCorruption.material.opacity=.8;enemyCorruption.visible=false;}
};
function spawnEnemyOutsideShrine(){
 const candidates=world.spawns.forest.reachable.filter(p=>
  world.map.area(p.x,p.z)==='森'&&p.z>=-40&&!collision(p.x,p.z,.65)&&
  Math.hypot(p.x-player.x,p.z-player.z)>=18);
 for(let i=candidates.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 const point=candidates.find(p=>world.ai.navigation.route(p,player).length>0);
 if(!point)return false;
 Object.assign(enemy,point);world.ai.reset();world.ai.lastSeen={x:player.x,z:player.z};
 enemy.path=[];enemy.repath=0;enemyHasSpawned=true;
 enemyMesh.position.set(enemy.x,world.map.floor(enemy.x,enemy.z)+2.5,enemy.z);
 enemyMesh.rotation.y=Math.atan2(player.x-enemy.x,player.z-enemy.z);enemyMesh.visible=true;
 classic.faces.select();return true;
}
const delayedEnemyUpdate=updateEnemy;
updateEnemy=function(dt){
 if(state!=='playing')return 0;
 if(!enemyHasSpawned){
  enemyMesh.visible=false;
  if(!enemyGraceStarted)return 0;
  enemyGraceElapsed+=dt;
  if(enemyGraceElapsed<15)return 0;
  if(!spawnEnemyOutsideShrine())return 0;
 }
 return delayedEnemyUpdate(dt);
};
const delayedChaseSync=chaseMusic.sync;
chaseMusic.sync=function(){if(!enemyHasSpawned){this.stop(false);return;}return delayedChaseSync.call(this);};
