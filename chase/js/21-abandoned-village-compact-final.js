
(()=>{
'use strict';
/* Removed unused two-storey village house assets: compact village edition. */

const VILLAGE_ZONE={minX:62,maxX:85,minZ:-38,maxZ:7};
const OLD_CEMETERY_ZONE={minX:-39,maxX:-29,minZ:-37,maxZ:-26};
const VILLAGE_CEMETERY={minX:66,maxX:78.5,minZ:-6,maxZ:4.5,graves:[[68.5,-4],[71.3,-4],[74.1,-4],[68.5,.2],[71.3,.2],[74.1,.2]],keys:[[68.5,-1.9],[71.3,-1.9],[74.1,-1.9],[71.3,3.1]]};
const VILLAGE_EDGE_TREES=[
 {asset:'japanese_ash_tree',x:60.8,z:-35.0,scale:.80,r:.52},
 {asset:'japanese_red_maple',x:60.9,z:-17.0,scale:.72,r:.46},
 {asset:'japanese_ash_tree',x:63.5,z:7.5,scale:.78,r:.50},
 {asset:'japanese_ash_tree',x:87.0,z:-34.5,scale:.76,r:.50},
 {asset:'japanese_red_maple',x:87.2,z:-17.5,scale:.72,r:.45},
 {asset:'japanese_ash_tree',x:83.5,z:8.0,scale:.80,r:.52}
];
const VILLAGE_BUILDINGS=[
 {id:'legacy',asset:'village_house',x:74,z:-29,r:0,scale:2.25,type:'legacy'}
];
function inVillage(x,z){return x>VILLAGE_ZONE.minX&&x<VILLAGE_ZONE.maxX&&z>VILLAGE_ZONE.minZ&&z<VILLAGE_ZONE.maxZ;}
function inOldCemetery(x,z){return x>OLD_CEMETERY_ZONE.minX&&x<OLD_CEMETERY_ZONE.maxX&&z>OLD_CEMETERY_ZONE.minZ&&z<OLD_CEMETERY_ZONE.maxZ;}
function inVillageCemetery(x,z){return x>VILLAGE_CEMETERY.minX&&x<VILLAGE_CEMETERY.maxX&&z>VILLAGE_CEMETERY.minZ&&z<VILLAGE_CEMETERY.maxZ;}
function thinVillageGroundCover(){
 const mats=new THREE.Matrix4(),v=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
 for(const name of ['expanded-forest-grass']){
  const grass=scene.getObjectByName(name);if(!grass||grass.userData.villageThinned)continue;
  grass.userData.villageThinned=true;
  for(let i=0;i<grass.count;i++){
   grass.getMatrixAt(i,mats);mats.decompose(v,q,s);if(!inVillage(v.x,v.z))continue;
   const nearHouse=VILLAGE_BUILDINGS.some(b=>Math.hypot(v.x-b.x,v.z-b.z)<8.2);
   const nearTruck=Math.hypot(v.x-offerings.truck.x,v.z-offerings.truck.z)<5.2;
   const cemetery=inVillageCemetery(v.x,v.z);
   const h=Math.abs(Math.sin(v.x*12.9898+v.z*78.233)*43758.5453)%1;
   if(nearHouse||nearTruck||cemetery||h>.34)mats.compose(v,q,new THREE.Vector3(0,0,0));
   else mats.compose(v,q,new THREE.Vector3(s.x*.72,s.y*.82,s.z*.72));
   grass.setMatrixAt(i,mats);
  }
  grass.instanceMatrix.needsUpdate=true;
 }
}

function toLocal(b,x,z){const dx=x-b.x,dz=z-b.z,c=Math.cos(b.r),s=Math.sin(b.r);return {x:(dx*c-dz*s)/b.scale,z:(dx*s+dz*c)/b.scale};}
function toWorld(b,lx,lz){const c=Math.cos(b.r),s=Math.sin(b.r);return {x:b.x+b.scale*(lx*c+lz*s),z:b.z+b.scale*(-lx*s+lz*c)};}
function inRect(p,a,b,c,d,pad=0){return p.x>a+pad&&p.x<b-pad&&p.z>c+pad&&p.z<d-pad;}
function collidesNewHouse(b,x,z,r=.42){
 const p=toLocal(b,x,z),lr=r/b.scale;if(Math.abs(p.x)>4.4+lr||Math.abs(p.z)>3.2+lr)return false;for(const seg of villageHouseSegments)if(segmentDistance(p.x,p.z,...seg)<lr+.025)return true;return false;
}

// Bypass the old four-house override. This removes phantom walls/floors from houses no longer drawn.
MapManager.prototype.collides=function(x,z,r=.42){const b=VILLAGE_BUILDINGS[0];if(b&&Math.abs(x-b.x)<=9*b.scale&&Math.abs(z-b.z)<=5*b.scale&&collidesNewHouse(b,x,z,r))return true;return villageCollision.call(this,x,z,r);};
MapManager.prototype.floor=function(x,z){const b=VILLAGE_BUILDINGS[0];if(b&&Math.abs(x-b.x)<=9*b.scale&&Math.abs(z-b.z)<=5*b.scale){const p=toLocal(b,x,z);if((Math.abs(p.x)<3.08&&p.z>-2.2&&p.z<1.3)||(p.x>.3&&p.x<2.5&&p.z>=1.3&&p.z<2.4))return .135;}return villageFloor.call(this,x,z);};
MapManager.prototype.area=function(x,z){if(inVillageCemetery(x,z)&&MapManager.inside(x,z))return '墓地';if(inVillage(x,z)&&MapManager.inside(x,z))return '廃村';const a=villageArea.call(this,x,z);return a==='墓地'&&inOldCemetery(x,z)?'森':a;};
pursuitRegion=function(x,z){const a=world?.map?.area(x,z);if(a==='廃村'||(a==='墓地'&&inVillageCemetery(x,z)))return 'forest';return villageRegion(x,z);};
MapManager.prototype.placeProps=function(){for(const t of pendingTorii){scene.remove(t.group);this.assets.place('japanese_torii',t.x,t.z,{scale:t.scale});for(const x of [-2.65,2.65])addObstacle(t.x+x*t.scale,t.z,.22*t.scale);}for(const p of pendingLanterns){this.assets.place('japanese_style_stone_lantern',p.x,p.z,{scale:.85,distance:55});addObstacle(p.x,p.z,.45);}for(const [x,z] of [[-4,30],[4,-57],[-43,2]]){const l=new THREE.PointLight(0xc39a61,3.5,9,2);l.position.set(x,2,z);scene.add(l);}};
MapManager.prototype.build=function(){villageBuild.call(this);const kept=obstacles.filter(o=>o.kind!=='trunk'||!inVillage(o.x,o.z));obstacles.length=0;buckets.clear();for(const o of kept)addObstacle(o.x,o.z,o.r,o.kind);if(naturalForest){naturalForest.positions=naturalForest.positions.filter(p=>!inVillage(p.x,p.z));naturalForest.update(true);}for(const [x,z] of VILLAGE_CEMETERY.graves){this.assets.place('tombstone_1',x,z,{rotation:Math.PI,scale:.85,distance:60});addObstacle(x,z,.45);}const names=new Set(['village_house','village-edge-tree']);for(const child of [...scene.children])if(names.has(child.name))scene.remove(child);this.assets.instances=this.assets.instances.filter(inst=>!names.has(inst.g?.name));for(const b of VILLAGE_BUILDINGS){const g=this.assets.place(b.asset,b.x,b.z,{rotation:b.r,scale:b.scale,distance:touchDevice?40:78});b.group=g;if(touchDevice)g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});}for(const t of VILLAGE_EDGE_TREES){const g=this.assets.place(t.asset,t.x,t.z,{scale:t.scale,rotation:((t.x*.731+t.z*.413)%6.283+6.283)%6.283,distance:touchDevice?30:60});g.name='village-edge-tree';if(touchDevice)g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});addObstacle(t.x,t.z,t.r,'trunk');}thinVillageGroundCover();navReady=false;buildNav();};
const villageAssetUpdate=AssetManager.prototype.update;AssetManager.prototype.update=function(){if(touchDevice&&this._villageCullNext&&ambientTime<this._villageCullNext)return;villageAssetUpdate.call(this);if(!touchDevice)return;this._villageCullNext=ambientTime+.14;const houses=this.instances.filter(p=>p.g?.name==='village_house');for(const h of houses)h._vd=Math.hypot(h.x-camera.position.x,h.z-camera.position.z);houses.sort((a,b)=>a._vd-b._vd);for(let i=0;i<houses.length;i++){const h=houses[i],nearEnough=h._vd<h.distance*.82;h.g.visible=nearEnough&&(i===0||(i===1&&h._vd<26));}};
RegionalSpawnManager.prototype.layout=function(){const f=this.forest.layout(),used=[...f.items,...f.cells];const items=[...f.items,this.choose(this.outside,used),this.choose(this.inside,used),this.choose(this.cave,used)];const caveNear=[[-69,9],[-81,9],[-64,-20],[-72,17]],caveDeep=[[-91,-37],[-89,-65],[-65,-102],[-48,-102]];const cells=[...f.cells,this.choose(this.outside,used),this.choose(this.inside,used),this.choose(caveNear,used),this.choose(caveDeep,used,4),this.choose(this.forest.candidates.map(p=>[p.x,p.z]),used,4)];const keys=this.forest.shuffle(VILLAGE_CEMETERY.keys.map(([x,z])=>({x,z}))).filter(p=>!collision(p.x,p.z,.65)&&this.reachable.has(freeCell(cellOf(p.x,p.z)))&&used.every(q=>Math.hypot(q.x-p.x,q.z-p.z)>1.5));if(!keys.length)throw Error('移設後の墓地に鍵の配置地点を確保できません');return {items,cells,key:keys[0],enemy:this.forest.enemySpawn(f.items)};};

function playerActualFloor(){return world?.map?.floor(player.x,player.z)||0;}
GameManager.prototype.start=function(){villageStart.call(this);
 const b=VILLAGE_BUILDINGS[0],inside=toWorld(b,.8,-.8);Object.assign(parts[0],{x:inside.x,z:inside.z,villageFloorY:.135,hostBuildingId:'legacy'});parts[0].group.position.set(inside.x,.555,inside.z);
 Object.assign(parts[1],{x:77.1,z:-17.1,villageFloorY:null,hostBuildingId:null});parts[1].group.position.set(parts[1].x,world.map.floor(parts[1].x,parts[1].z)+.42,parts[1].z);
 const batterySpots=[(()=>{const w=toWorld(b,.27,.16);return{x:w.x,z:w.z,y:.135,hostBuildingId:'legacy'};})(),(()=>{const w=toWorld(b,1.6,.72);return{x:w.x,z:w.z,y:.135,hostBuildingId:'legacy'};})(),{x:79.7,z:-17.4,y:world.map.floor(79.7,-17.4)},{x:78.9,z:-7.7,y:world.map.floor(78.9,-7.7)},{x:-.9,z:-69.2,y:world.map.floor(-.9,-69.2)},{x:-89.5,z:-64.2,y:world.map.floor(-89.5,-64.2)}];classic.battery.items.slice(0,batterySpots.length).forEach((p,i)=>{const q=batterySpots[i];Object.assign(p,{x:q.x,z:q.z,villageFloorY:q.y,hostBuildingId:q.hostBuildingId||null,found:false});p.group.position.set(p.x,q.y+.23,p.z);p.group.visible=true;});
 const doc=archive?.items?.find(p=>p.record?.id===12);if(doc){const w=toWorld(b,-1.2,.3),y=.135;Object.assign(doc,{x:w.x,z:w.z,y,area:'廃屋',hostBuildingId:'legacy'});doc.group.position.set(w.x,y+.008,w.z);doc.group.visible=true;}updateHUD();};
window.__villageAccess={toWorld,buildings:VILLAGE_BUILDINGS,actualFloor:playerActualFloor};
})();
