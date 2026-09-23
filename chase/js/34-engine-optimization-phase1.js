
(()=>{
 'use strict';

 /* ---------- development profiler ---------- */
 const qs=new URLSearchParams(location.search),debugEnabled=qs.get('debug')==='1';
 const style=document.createElement('style');
 style.textContent='#perf-hud{position:fixed;left:max(8px,env(safe-area-inset-left));bottom:max(8px,env(safe-area-inset-bottom));z-index:99;display:none;pointer-events:none;white-space:pre;padding:8px 10px;border:1px solid #82907b55;border-radius:8px;background:#07100ee8;color:#c9d2bd;font:10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.02em;box-shadow:0 8px 30px #0008}#perf-hud.on{display:block}';
 document.head.appendChild(style);const hud=document.createElement('div');hud.id='perf-hud';document.body.appendChild(hud);
 const perf=window.__perf={enabled:debugEnabled,frames:0,time:0,fps:0,frameMs:0,simMs:0,renderMs:0,steps:0,navBuildMs:0,routeMs:0,routeCount:0,astarVisited:0,frozen:0,lastPaint:0,
  sample(v){this.frames++;this.time+=v.frameDt;this.frameMs=this.frameMs*.9+v.totalMs*.1;this.simMs=this.simMs*.9+v.simMs*.1;this.renderMs=this.renderMs*.9+v.renderMs*.1;this.steps=v.steps;if(this.time>=.5){this.fps=this.frames/this.time;this.frames=0;this.time=0;}if(this.enabled&&performance.now()-this.lastPaint>250){this.lastPaint=performance.now();const info=renderer?.info;const avgRoute=this.routeCount?this.routeMs/this.routeCount:0;hud.textContent=`FPS ${this.fps.toFixed(0)}   FRAME ${this.frameMs.toFixed(1)}ms\nSIM ${this.simMs.toFixed(1)}ms   GPU/RENDER ${this.renderMs.toFixed(1)}ms\nDRAW ${info?.render?.calls??0}   TRIS ${Math.round((info?.render?.triangles??0)/1000)}k\nGEO ${info?.memory?.geometries??0}   TEX ${info?.memory?.textures??0}\nA* ${avgRoute.toFixed(2)}ms / ${this.astarVisited|0} nodes\nNAV BUILD ${this.navBuildMs.toFixed(1)}ms   FIXED ${this.steps}x\nSTATIC FROZEN ${this.frozen}   FOREST ${this.forestTrees??0}`;}}
 };
 hud.classList.toggle('on',perf.enabled);window.GameProfiler={show(){perf.enabled=true;hud.classList.add('on')},hide(){perf.enabled=false;hud.classList.remove('on')},toggle(){perf.enabled=!perf.enabled;hud.classList.toggle('on',perf.enabled)}};

 /* ---------- A* pathfinding with reusable typed arrays ---------- */
 const SQRT2=Math.SQRT2;
 Navigation.prototype.route=function(from,to){
  const t0=performance.now(),start=freeCell(cellOf(from.x,from.z)),goal=freeCell(cellOf(to.x,to.z));if(start===goal)return [];
  const N=nav.length,S=this._astar||(this._astar={g:new Float32Array(N),came:new Int32Array(N),seen:new Uint32Array(N),closed:new Uint32Array(N),heapNode:new Int32Array(N),heapF:new Float32Array(N),heapPos:new Int32Array(N),heapStamp:new Uint32Array(N),stamp:1});
  let stamp=(S.stamp+1)>>>0;if(stamp===0){S.seen.fill(0);S.closed.fill(0);S.heapStamp.fill(0);stamp=1;}S.stamp=stamp;
  const gx=goal%GRID,gz=(goal/GRID)|0,heur=n=>{const x=n%GRID,z=(n/GRID)|0,dx=Math.abs(x-gx),dz=Math.abs(z-gz),mn=Math.min(dx,dz);return dx+dz+(SQRT2-2)*mn;};
  let heapSize=0,visited=0;
  const swap=(a,b)=>{let n=S.heapNode[a];S.heapNode[a]=S.heapNode[b];S.heapNode[b]=n;let f=S.heapF[a];S.heapF[a]=S.heapF[b];S.heapF[b]=f;S.heapPos[S.heapNode[a]]=a;S.heapPos[S.heapNode[b]]=b;};
  const up=i=>{while(i>0){const p=(i-1)>>1;if(S.heapF[p]<=S.heapF[i])break;swap(i,p);i=p;}};
  const down=i=>{for(;;){let l=i*2+1;if(l>=heapSize)break;let r=l+1,b=r<heapSize&&S.heapF[r]<S.heapF[l]?r:l;if(S.heapF[i]<=S.heapF[b])break;swap(i,b);i=b;}};
  const pushOrDecrease=(n,f)=>{if(S.heapStamp[n]===stamp&&S.heapPos[n]>=0){const i=S.heapPos[n];if(f<S.heapF[i]){S.heapF[i]=f;up(i);}return;}const i=heapSize++;S.heapNode[i]=n;S.heapF[i]=f;S.heapStamp[n]=stamp;S.heapPos[n]=i;up(i);};
  const pop=()=>{const n=S.heapNode[0];S.heapPos[n]=-1;heapSize--;if(heapSize>0){S.heapNode[0]=S.heapNode[heapSize];S.heapF[0]=S.heapF[heapSize];S.heapPos[S.heapNode[0]]=0;down(0);}return n;};
  S.seen[start]=stamp;S.g[start]=0;S.came[start]=start;pushOrDecrease(start,heur(start));let found=false;
  while(heapSize){const cur=pop();if(S.closed[cur]===stamp)continue;S.closed[cur]=stamp;visited++;if(cur===goal){found=true;break;}const x=cur%GRID,z=(cur/GRID)|0,bits=NAV_LINKS[cur];for(let k=0;k<8;k++){if(!(bits&(1<<k)))continue;const [dx,dz]=NAV_STEPS[k],nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=GRID||nz>=GRID)continue;const n=nz*GRID+nx;if(nav[n]||S.closed[n]===stamp)continue;const ng=S.g[cur]+(dx&&dz?SQRT2:1);if(S.seen[n]!==stamp||ng<S.g[n]){S.seen[n]=stamp;S.g[n]=ng;S.came[n]=cur;pushOrDecrease(n,ng+heur(n));}}}
  const cells=[];if(found){let p=goal,guard=0;while(p!==start&&guard++<N){cells.push(p);p=S.came[p];}cells.reverse();}
  const raw=cells.map(n=>this.point(n)),path=[];if(raw.length){let ax=from.x,az=from.z,i=0;while(i<raw.length){let best=i;for(let j=Math.min(raw.length-1,i+18);j>i;j--){if(clearLine(ax,az,raw[j].x,raw[j].z)){best=j;break;}}path.push(raw[best]);ax=raw[best].x;az=raw[best].z;i=best+1;}}
  perf.routeMs+=performance.now()-t0;perf.routeCount++;if(perf.routeCount>120){perf.routeMs*=.5;perf.routeCount=Math.ceil(perf.routeCount*.5);}perf.astarVisited=visited;return path;
 };


 /* ---------- forest spatial buckets: same visuals, one tree pass instead of nine ---------- */
 const originalForestUpdate=ForestEnvironment.prototype.update;
 ForestEnvironment.prototype.update=function(force=false){
  if(!force&&ambientTime-this.last<.4)return;this.last=ambientTime;
  const low=touchDevice||settings.quality==='low';renderer.shadowMap.enabled=!low;flash.castShadow=!low;
  const near=low?16:20,mid=low?34:42,far=low?62:82,chunkSize=18;
  if(!this._spatialBuckets||this._spatialCount!==this.positions.length){this._spatialBuckets=new Map();this._spatialCount=this.positions.length;for(const tree of this.positions){const cx=Math.floor(tree.x/chunkSize),cz=Math.floor(tree.z/chunkSize),key=cx+','+cz;let a=this._spatialBuckets.get(key);if(!a)this._spatialBuckets.set(key,a=[]);a.push(tree);}this._groupLookup=Array.from({length:3},()=>Array(3));for(const g of this.groups)this._groupLookup[g.variant][g.level]=g;}
  const counts=new Int32Array(9),cx0=Math.floor(camera.position.x/chunkSize),cz0=Math.floor(camera.position.z/chunkSize),rad=Math.ceil(far/chunkSize)+1;
  let considered=0;
  for(let cz=cz0-rad;cz<=cz0+rad;cz++)for(let cx=cx0-rad;cx<=cx0+rad;cx++){const arr=this._spatialBuckets.get(cx+','+cz);if(!arr)continue;for(const tree of arr){const dx=tree.x-camera.position.x,dz=tree.z-camera.position.z,d=Math.hypot(dx,dz);if(d>far)continue;considered++;const level=d<near?0:d<mid?1:2,g=this._groupLookup[tree.variant][level],idx=tree.variant*3+level,n=counts[idx]++;for(const mesh of g.pair)mesh.setMatrixAt(n,tree.matrix);}}
  for(const g of this.groups){const n=counts[g.variant*3+g.level];for(const mesh of g.pair){mesh.castShadow=!low&&g.level===0;mesh.receiveShadow=!low;mesh.count=n;mesh.instanceMatrix.needsUpdate=true;}}
  perf.forestTrees=considered;
 };

 /* ---------- static navigation base + tiny dynamic-gate patches ---------- */
 const fullBuildNav=buildNav;let staticNav=null,staticLinks=null,staticPrepared=false,lastDynamicKey='';
 const gateRects=[[-3.5,3.5,43.5,45.5],[-5,5,-49.5,-46.5],[-23.5,-20.5,-104.5,-95.5]];
 function cellRange(rect,pad=2){const [minX,maxX,minZ,maxZ]=rect;return {x0:clamp(Math.floor((minX-ORIGIN)/CELL)-pad,1,GRID-2),x1:clamp(Math.ceil((maxX-ORIGIN)/CELL)+pad,1,GRID-2),z0:clamp(Math.floor((minZ-ORIGIN)/CELL)-pad,1,GRID-2),z1:clamp(Math.ceil((maxZ-ORIGIN)/CELL)+pad,1,GRID-2)};}
 function rebuildLinksIn(rect){const R=cellRange(rect,3);for(let z=R.z0;z<=R.z1;z++)for(let x=R.x0;x<=R.x1;x++){const cur=z*GRID+x;if(nav[cur]){NAV_LINKS[cur]=0;continue;}const ax=ORIGIN+x*CELL,az=ORIGIN+z*CELL;let bits=0;for(let k=0;k<8;k++){const [dx,dz]=NAV_STEPS[k],n=(z+dz)*GRID+x+dx;if(nav[n]||(dx&&dz&&(nav[z*GRID+x+dx]||nav[(z+dz)*GRID+x])))continue;if(clearLine(ax,az,ax+dx*CELL,az+dz*CELL))bits|=1<<k;}NAV_LINKS[cur]=bits;}}
 function dynamicKey(){return `${seven&&!seven.lock.unlocked?1:0}${revision&&!revision.unlocked?1:0}${typeof rearPassage!=='undefined'&&!rearPassage.unlocked?1:0}`;}
 function applyDynamic(){if(!staticPrepared)return false;nav.set(staticNav);NAV_LINKS.set(staticLinks);for(const rect of gateRects){const R=cellRange(rect,0);for(let z=R.z0;z<=R.z1;z++)for(let x=R.x0;x<=R.x1;x++){const wx=ORIGIN+x*CELL,wz=ORIGIN+z*CELL;if(collision(wx,wz,.5))nav[z*GRID+x]=1;}rebuildLinksIn(rect);}navReady=true;lastDynamicKey=dynamicKey();window.__routeWorkerNavChanged?.();return true;}
 async function prepareStaticNav(){if(!world?.map)return false;const s7=seven?.lock?.unlocked,sr=revision?.unlocked,srear=typeof rearPassage!=='undefined'?rearPassage.unlocked:null;try{if(seven?.lock)seven.lock.unlocked=true;if(revision)revision.unlocked=true;if(typeof rearPassage!=='undefined')rearPassage.unlocked=true;navReady=false;const t=performance.now();fullBuildNav();perf.navBuildMs=performance.now()-t;staticNav=new Uint8Array(nav);staticLinks=new Uint8Array(NAV_LINKS);staticPrepared=true;}finally{if(seven?.lock&&s7!=null)seven.lock.unlocked=s7;if(revision&&sr!=null)revision.unlocked=sr;if(typeof rearPassage!=='undefined'&&srear!=null)rearPassage.unlocked=srear;}applyDynamic();return true;}
 buildNav=function(){const key=dynamicKey();if(staticPrepared){if(navReady&&key===lastDynamicKey)return;const t=performance.now();applyDynamic();perf.navBuildMs=performance.now()-t;return;}const t=performance.now(),r=fullBuildNav();perf.navBuildMs=performance.now()-t;return r;};

 /* ---------- stop matrix updates for truly static render objects ---------- */
 function freezeObject(o){if(!o||o===scene||o===camera)return 0;o.updateMatrix?.();o.matrixAutoUpdate=false;let n=1;for(const c of o.children||[])n+=freezeObject(c);return n;}
 function freezeStaticWorld(){let count=0;for(const o of scene.children){if(o?.isInstancedMesh){o.updateMatrix();o.matrixAutoUpdate=false;count++;}}
  const movable=new Set(['bmw_bike','radio']);for(const inst of world?.assets?.instances||[]){const g=inst?.g;if(!g||movable.has(g.name))continue;count+=freezeObject(g);}perf.frozen=count;return count;}

 /* Run only after all late setup layers (survival, lockers, archive) have had a chance to finish. */
 async function lateOptimize(){const started=performance.now();while(performance.now()-started<12000){if(world?.map&&ready&&(window.survivalSystem?.setupDone!==false)&&(window.__lockerSystem?.setupDone!==false))break;await new Promise(r=>setTimeout(r,120));}await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));freezeStaticWorld();await prepareStaticNav();try{const textures=[];scene.traverse(o=>{const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m?.map?.isTexture)textures.push(m.map);}});const uniq=[...new Set(textures)];for(let i=0;i<uniq.length;i+=4){for(let j=i;j<Math.min(i+4,uniq.length);j++)try{renderer.initTexture(uniq[j]);}catch(_){}await new Promise(r=>setTimeout(r,0));}}catch(_){}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>lateOptimize(),{once:true});else lateOptimize();

 /* Keep the fast dynamic nav in sync after a new run resets gates. */
 const optStart=GameManager.prototype.start;GameManager.prototype.start=function(){const r=optStart.call(this);if(staticPrepared){navReady=false;applyDynamic();}return r;};
})();
