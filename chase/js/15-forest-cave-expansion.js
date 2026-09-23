// Expand forest area by 40%, preserving the existing western/northern entrances.
const originalForestBorder=FOREST_BORDER.map(p=>[...p]);
function polygonArea(points){let a=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];a+=p[0]*q[1]-q[0]*p[1];}return Math.abs(a)/2;}
const forestAreaBefore=polygonArea(originalForestBorder);
const stretchedForest=originalForestBorder.map(([x,z])=>[x>6?6+(x-6)*2:x,z]);
const forestEastFactor=1+forestAreaBefore*.58/(polygonArea(stretchedForest)-forestAreaBefore);
for(const p of FOREST_BORDER)if(p[0]>6)p[0]=6+(p[0]-6)*forestEastFactor;
const forestEastLimit=Math.max(...FOREST_BORDER.map(p=>p[0]));
// Make room behind the existing shrine; the shrine building itself is unchanged.
for(const p of SHRINE_BORDER){if(p[0]===-24&&p[1]===-82)p[0]=-29;if(p[1]<-90)p[1]-=10;}
const rearPassage={unlocked:false,gate:null,dialMode:'front',x:-22,z:-100};
const extraCaveNodes=[[-91,-37],[-99,-51],[-89,-65],[-77,-55],[-67,-73],[-54,-89],[-37,-100],[-24,-100],[-17,-100]];
const extraCaveStart=CAVE_NODES.length;CAVE_NODES.push(...extraCaveNodes);
CAVE_EDGES.push([10,extraCaveStart],[extraCaveStart,extraCaveStart+1],[extraCaveStart+1,extraCaveStart+2],[extraCaveStart+2,extraCaveStart+3],[extraCaveStart+3,extraCaveStart]);
for(let i=3;i<extraCaveNodes.length-1;i++)CAVE_EDGES.push([extraCaveStart+i,extraCaveStart+i+1]);
// Two alternate corridors with cross-links let players circle around pursuing enemies.
const caveBypassStart=CAVE_NODES.length;
const caveBypassNodes=[[-85,-77],[-81,-93],[-65,-102],[-48,-102]];
CAVE_NODES.push(...caveBypassNodes);
CAVE_EDGES.push([extraCaveStart+3,caveBypassStart],[caveBypassStart,caveBypassStart+1],[caveBypassStart+1,caveBypassStart+2],[caveBypassStart+2,caveBypassStart+3],[caveBypassStart+3,extraCaveStart+6],[caveBypassStart,extraCaveStart+4],[caveBypassStart+2,extraCaveStart+5]);
caveDistance=function(x,z){let d=Math.min(Math.hypot(x+94,z+23)-7,Math.hypot(x+91,z+48)-7.3);for(const [a,b]of CAVE_EDGES){const p=CAVE_NODES[a],q=CAVE_NODES[b];const radius=a>=extraCaveStart||b>=extraCaveStart?3.3:x>-56?2.65:4.2;d=Math.min(d,segmentDistance(x,z,...p,...q)-radius);}return d;};
function expandedCaveAt(x,z,r=0){return x>-108+r&&x<-13-r&&z>-110+r&&z<24-r&&(x<-44||z<-40)&&caveDistance(x,z)<-r;}
MapManager.inside=function(x,z,r=0){const rect=(a,b,c,d)=>x>a+r&&x<b-r&&z>c+r&&z<d-r;return (rect(-44,forestEastLimit,-44,44)&&(rect(-35,35,-35,35)||inBoundary(x,z,FOREST_BORDER,r)))||rect(-4,4,-54,-40)||(rect(-30,24,-108,-50)&&inBoundary(x,z,SHRINE_BORDER,r))||(x<-38&&x>-108&&z>-110&&z<24&&caveDistance(x,z)<-r)||expandedCaveAt(x,z,r)||rect(-4.5,4.5,34,45)||rect(-1.65,1.65,41,61);};
const expandedFloor=MapManager.prototype.floor;
MapManager.prototype.floor=function(x,z){if(z<-32&&expandedCaveAt(x,z,-.8)&&x<-23)return -3*clamp((-x-24)/20,0,1);return expandedFloor.call(this,x,z);};
const expandedArea=MapManager.prototype.area;
MapManager.prototype.area=function(x,z){if(expandedCaveAt(x,z)&&x<rearPassage.x)return '洞窟';if(z>-44&&z<44&&x>30)return '森';return expandedArea.call(this,x,z);};
const expandedCollision=MapManager.prototype.collides;
MapManager.prototype.collides=function(x,z,r=.42){if(!rearPassage.unlocked&&Math.abs(x-rearPassage.x)<r+.16&&Math.abs(z-rearPassage.z)<3.8+r)return true;return expandedCollision.call(this,x,z,r);};
// Clip a portal from the rock boundary. Higher rock stays above the entrance.
const expandedCliffs=MapManager.prototype.buildCliffs;
MapManager.prototype.buildCliffs=function(){expandedCliffs.call(this);scene.traverse(m=>{if(m.name!=='outer-cliff')return;const p=m.geometry.attributes.position,keep=[];for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3;if(x<-17&&x>-29&&z<-95&&z>-105&&y<5.5)continue;keep.push(i,i+1,i+2);}m.geometry.setIndex(keep);});};
MapManager.prototype.buildCave=function(){
 const mat=this.stone.clone();mat.color.set(0x5a655d);mat.side=THREE.DoubleSide;mat.transparent=false;mat.opacity=1;mat.alphaTest=0;mat.depthWrite=true;
 const wall=[],wu=[],floor=[],fu=[],roof=[],ru=[];
 const roofY=(x,z)=>this.floor(x,z)+4.3+.24*Math.sin(x*.53+z*.71);
 const emit=(arr,uv,verts)=>{for(const v of verts){arr.push(...v);uv.push((v[0]+v[2])*.35,v[1]*.4);}};
 const cut=(a,b,da,db)=>{const t=da/(da-db);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];};
 for(let x=-108;x<-13;x++)for(let z=-110;z<24;z++){
  if((x>=-44&&z>=-40)||(x>=-22&&z<-90))continue;
  const corners=[[x,z],[x+1,z],[x+1,z+1],[x,z+1]],ds=corners.map(p=>caveDistance(...p));
  if(ds.every(d=>d>0))continue;
  for(const ids of [[0,1,2],[0,2,3]]){
   const poly=[],cross=[];
   for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3];if(ds[a]<=0)poly.push(corners[a]);if((ds[a]<0)!==(ds[b]<0)){const p=cut(corners[a],corners[b],ds[a],ds[b]);poly.push(p);cross.push(p);}}
   for(let i=1;i<poly.length-1;i++){
    const tri=[poly[0],poly[i],poly[i+1]];
    emit(floor,fu,tri.map(([xx,zz])=>[xx,this.floor(xx,zz)-.025,zz]));
    // Continuous opaque inner roof overlaps the entrance asset all the way to the mouth.
    emit(roof,ru,tri.map(([xx,zz])=>[xx,roofY(xx,zz),zz]));
    emit(roof,ru,tri.map(([xx,zz])=>[xx,roofY(xx,zz)+.28,zz]));
   }
   if(cross.length===2){const [a,b]=cross,ay=this.floor(...a)-.12,by=this.floor(...b)-.12,A=[a[0],ay,a[1]],B=[b[0],by,b[1]],C=[b[0],roofY(...b),b[1]],D=[a[0],roofY(...a),a[1]];emit(wall,wu,[A,B,C,A,C,D]);}
  }
 }
 this.makeSurface(wall,wu,mat).name='cave-walls';
 const ground=this.makeSurface(floor,fu,mat);ground.name='cave-floor';this.groundUV(ground);
 const ceiling=this.makeSurface(roof,ru,mat);ceiling.name='cave-ceiling';this.groundUV(ceiling);
 this.buildCaveEntrance();
 const water=new THREE.Mesh(new THREE.CircleGeometry(2,24),new THREE.MeshStandardMaterial({color:0x13252a,roughness:.15,metalness:.3,transparent:true,opacity:.6}));water.rotation.x=-Math.PI/2;water.position.set(-81,-2.97,9);scene.add(water);
 this.assets.place('japanese_style_stone_lantern',-84,-18,{y:-3,scale:.6,distance:30});
};
function extendForestVegetation(){
 if(!naturalForest)return;
 const originals=[...naturalForest.positions];let n=0,seed=0x6d2b79f5;const vrand=()=>((seed=Math.imul(seed^seed>>>15,1|seed),seed^=seed+Math.imul(seed^seed>>>7,61|seed),((seed^seed>>>14)>>>0)/4294967296));
 for(let tries=0;tries<900&&n<92;tries++){
  const xx=43+vrand()*Math.max(1,forestEastLimit-46),zz=-37+vrand()*75;
  if(!MapManager.inside(xx,zz,2)||Math.abs(zz)<2.5||collision(xx,zz,.82)||naturalForest.positions.some(t=>Math.hypot(xx-t.x,zz-t.z)<2.5))continue;
  const src=originals[(n*17+Math.floor(vrand()*originals.length))%originals.length],m=src.matrix.clone();m.setPosition(xx,0,zz);naturalForest.positions.push({x:xx,z:zz,matrix:m,variant:src.variant});addObstacle(xx,zz,.27,'trunk');n++;
 }
 for(const g of naturalForest.groups)g.pair=g.pair.map(old=>{const mesh=new THREE.InstancedMesh(old.geometry,old.material,naturalForest.positions.length);mesh.name=old.name;mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.remove(old);old.dispose();scene.add(mesh);return mesh;});
 naturalForest.update(true);
 // Shared grass geometry adds undergrowth without additional image/model assets.
 const source=scene.getObjectByName('forest-grass');if(source){const old=scene.getObjectByName('expanded-forest-grass');if(old)scene.remove(old);const patches=[],m=new THREE.Matrix4(),up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion();let gs=0x13579bdf;const grand=()=>((gs=Math.imul(gs^gs>>>15,1|gs),gs^=gs+Math.imul(gs^gs>>>7,61|gs),((gs^gs>>>14)>>>0)/4294967296));for(let tries=0;tries<1800&&patches.length<360;tries++){const xx=43+grand()*Math.max(1,forestEastLimit-45),zz=-39+grand()*78;if(!MapManager.inside(xx,zz,1)||Math.abs(zz)<2.3||collision(xx,zz,.34))continue;const s=.62+grand()*.68;q.setFromAxisAngle(up,grand()*Math.PI*2);m.compose(new THREE.Vector3(xx,.01,zz),q,new THREE.Vector3(s,s*(.86+grand()*.25),s));patches.push(m.clone());if(grand()>.73){const a=grand()*Math.PI*2,d=.18+grand()*.38,ox=xx+Math.cos(a)*d,oz=zz+Math.sin(a)*d;if(MapManager.inside(ox,oz,.8)&&!collision(ox,oz,.3)){const s2=s*(.58+grand()*.25);q.setFromAxisAngle(up,grand()*Math.PI*2);m.compose(new THREE.Vector3(ox,.01,oz),q,new THREE.Vector3(s2,s2,s2));patches.push(m.clone());}}}const grass=new THREE.InstancedMesh(source.geometry,source.material,patches.length);patches.forEach((m,i)=>grass.setMatrixAt(i,m));grass.name='expanded-forest-grass';scene.add(grass);}
}
const expandedBuild=MapManager.prototype.build;
MapManager.prototype.build=function(){expandedBuild.call(this);ground.geometry.dispose();ground.geometry=new THREE.PlaneGeometry(forestEastLimit+44,88);ground.position.x=(forestEastLimit-44)/2;this.groundUV(ground);extendForestVegetation();navReady=false;buildNav();};
function createRearGate(){
 const g=new THREE.Group();g.name='shrine-rear-cave-gate';g.position.set(rearPassage.x,0,rearPassage.z);g.rotation.y=Math.PI/2;scene.add(g);rearPassage.gate=g;
 const iron=material(0x343e3b,{metalness:.65,roughness:.75});
 for(let x=-3.5;x<=3.5;x+=.38)box(.07,4.3,.1,iron,x,2.15,0,g);
 for(const y of [.15,1.45,4.15])box(7.4,.12,.14,iron,0,y,0,g);
 box(.5,.6,.24,material(0x8c7960,{metalness:.5}),0,1.5,.13,g);
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(.34,.18),new THREE.MeshBasicMaterial({map:revision.textTexture(['0 0 0'],false),depthWrite:true}));panel.name='rear-lock-number-panel';panel.scale.set(1,1,1);panel.position.set(0,1.5,.275);g.add(panel);
}
function rearGateHit(){return !rearPassage.unlocked&&Math.abs(player.z-rearPassage.z)<2.8&&Math.abs(player.x-rearPassage.x)<2.7;}
function onShrineSide(){return player.x>rearPassage.x+.4;}
PilgrimageRevision.prototype.unlockRear=function(code){
 if(!this.unlocked||!onShrineSide()||!rearGateHit()){if($('shrine-feedback'))$('shrine-feedback').textContent='正面の解錠後、神社側から操作してください。';return false;}
 if(code!==this.code){$('shrine-feedback').textContent='……開かない。正面と同じ番号が必要だ。';audio.tone(85,.2,.1);return false;}
 rearPassage.unlocked=true;rearPassage.gate.visible=false;navReady=false;buildNav();enemy.path=[];enemy.repath=0;this.closeDial();audio.tone(170,.4,.14,'triangle',70);toast('裏口が開いた。洞窟と神社を行き来できる。',5);updateHUD();return true;
};
const rearOpen=PilgrimageRevision.prototype.openDial;
PilgrimageRevision.prototype.openDial=function(mode='front'){rearPassage.dialMode=mode;rearOpen.call(this);$('shrine-title').textContent=mode==='rear'?'洞窟裏口の三桁錠':'三桁のダイヤル錠';if(mode==='rear')$('shrine-clue').textContent='神社正面と同じ番号を入力してください。';};
const rearClose=PilgrimageRevision.prototype.closeDial;
PilgrimageRevision.prototype.closeDial=function(){rearClose.call(this);rearPassage.dialMode='front';};
const rearUI=PilgrimageRevision.prototype.createUI;
PilgrimageRevision.prototype.createUI=function(){rearUI.call(this);const submit=$('shrine-submit').onclick;$('shrine-submit').onclick=()=>{if(rearPassage.dialMode==='rear'){const code=[...$('shrine-dials').querySelectorAll('output')].map(o=>o.textContent).join('');this.unlockRear(code);return;}submit();};};
const rearReset=PilgrimageRevision.prototype.reset;
PilgrimageRevision.prototype.reset=function(){rearPassage.unlocked=false;rearPassage.dialMode='front';if(rearPassage.gate)rearPassage.gate.visible=true;navReady=false;rearReset.call(this);};
const rearInit=init;init=async function(){await rearInit();if(!ready)return;try{createRearGate();}catch(e){ready=false;$('start').disabled=true;show('fatal');$('fatal-detail').textContent=e.message;}};
const rearInteract=interact;interact=function(){if(state==='playing'&&rearGateHit()){
 if(!onShrineSide()){toast('錠は向こう側にある。神社側からしか開けられない。',4);return;}
 if(!revision.unlocked){toast('正面の三桁錠を先に解錠する必要がある。',4);return;}
 revision.openDial('rear');return;
}rearInteract();};
const rearPlayer=updatePlayer;updatePlayer=function(dt){rearPlayer(dt);if(state==='playing'&&rearGateHit()){show('interaction');$('interaction').textContent=onShrineSide()?'洞窟裏口の番号を入力':'封鎖された裏口を調べる';}};
const rearHUD=updateHUD;updateHUD=function(){rearHUD();if(revision?.unlocked)$('mission-hint').textContent+=rearPassage.unlocked?' · 洞窟裏口：開通':' · 裏口は神社側から同じ番号で解錠';};
