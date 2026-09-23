
(()=>{
 'use strict';
 const baseRoute=Navigation.prototype.route,perf=window.__perf||null;
 const supported=typeof Worker!=='undefined'&&typeof Blob!=='undefined'&&typeof URL?.createObjectURL==='function';
 const cache=new Map(),pending=new Map();
 let worker=null,workerURL=null,disabled=!supported,version=0,sentVersion=-1,requestId=0,syncQueued=false;
 const TIMEOUT=2500,MAX_PENDING=8;
 function counters(){if(perf){perf.workerCache=cache.size;perf.workerPending=pending.size;}}
 function disposeWorker(reason){disabled=true;const old=worker;worker=null;try{old?.terminate();}catch(_){}if(workerURL){URL.revokeObjectURL(workerURL);workerURL=null;}cache.clear();pending.clear();sentVersion=-1;counters();if(perf)perf.workerFallbacks=(perf.workerFallbacks||0)+1;console.warn('Route worker unavailable; using main-thread A*.',reason);}
 function send(message,transfer=[]){try{worker.postMessage(message,transfer);return true;}catch(e){disposeWorker(e);return false;}}
 function cacheSet(key,path){cache.set(key,{path,stamp:performance.now()});if(cache.size>96){let oldest=null,time=Infinity;for(const [k,v] of cache){if(v.stamp<time){oldest=k;time=v.stamp;}}cache.delete(oldest);}counters();}
 function workerCode(){return "\nlet GRID=0,ORIGIN=0,CELL=0,nav=null,links=null,version=-1,STEPS=[];\nconst SQRT2=Math.SQRT2;\n// Direction bits are defined once by the main navigation grid.\nlet state=null;\nfunction ensure(n){if(state&&state.n===n)return state;state={n,g:new Float32Array(n),came:new Int32Array(n),seen:new Uint32Array(n),closed:new Uint32Array(n),heapNode:new Int32Array(n),heapF:new Float32Array(n),heapPos:new Int32Array(n),heapStamp:new Uint32Array(n),stamp:1};return state;}\nfunction heur(goal,n){const gx=goal%GRID,gz=(goal/GRID)|0,x=n%GRID,z=(n/GRID)|0,dx=Math.abs(x-gx),dz=Math.abs(z-gz),mn=Math.min(dx,dz);return dx+dz+(SQRT2-2)*mn;}\nfunction point(n){return{x:ORIGIN+(n%GRID)*CELL,z:ORIGIN+((n/GRID)|0)*CELL};}\nfunction route(start,goal){\n const N=nav.length,S=ensure(N);let stamp=(S.stamp+1)>>>0;if(stamp===0){S.seen.fill(0);S.closed.fill(0);S.heapStamp.fill(0);stamp=1;}S.stamp=stamp;\n if(start===goal)return [];\n let heapSize=0;\n const swap=(a,b)=>{let n=S.heapNode[a];S.heapNode[a]=S.heapNode[b];S.heapNode[b]=n;let f=S.heapF[a];S.heapF[a]=S.heapF[b];S.heapF[b]=f;S.heapPos[S.heapNode[a]]=a;S.heapPos[S.heapNode[b]]=b;};\n const up=i=>{while(i>0){const p=(i-1)>>1;if(S.heapF[p]<=S.heapF[i])break;swap(i,p);i=p;}};\n const down=i=>{for(;;){let l=i*2+1;if(l>=heapSize)break;let r=l+1,b=r<heapSize&&S.heapF[r]<S.heapF[l]?r:l;if(S.heapF[i]<=S.heapF[b])break;swap(i,b);i=b;}};\n const pushOrDecrease=(n,f)=>{if(S.heapStamp[n]===stamp&&S.heapPos[n]>=0){const i=S.heapPos[n];if(f<S.heapF[i]){S.heapF[i]=f;up(i);}return;}const i=heapSize++;S.heapNode[i]=n;S.heapF[i]=f;S.heapStamp[n]=stamp;S.heapPos[n]=i;up(i);};\n const pop=()=>{const n=S.heapNode[0];S.heapPos[n]=-1;heapSize--;if(heapSize>0){S.heapNode[0]=S.heapNode[heapSize];S.heapF[0]=S.heapF[heapSize];S.heapPos[S.heapNode[0]]=0;down(0);}return n;};\n S.seen[start]=stamp;S.g[start]=0;S.came[start]=start;pushOrDecrease(start,heur(goal,start));let found=false;\n while(heapSize){const cur=pop();if(S.closed[cur]===stamp)continue;S.closed[cur]=stamp;if(cur===goal){found=true;break;}const x=cur%GRID,z=(cur/GRID)|0,bits=links[cur];for(let k=0;k<8;k++){if(!(bits&(1<<k)))continue;const st=STEPS[k],dx=st[0],dz=st[1],nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=GRID||nz>=GRID)continue;const n=nz*GRID+nx;if(nav[n]||S.closed[n]===stamp)continue;const ng=S.g[cur]+(dx&&dz?SQRT2:1);if(S.seen[n]!==stamp||ng<S.g[n]){S.seen[n]=stamp;S.g[n]=ng;S.came[n]=cur;pushOrDecrease(n,ng+heur(goal,n));}}}\n if(!found)return [];\n const cells=[];let p=goal,guard=0;while(p!==start&&guard++<N){cells.push(p);p=S.came[p];}cells.reverse();return cells.map(point);\n}\nonmessage=e=>{const d=e.data;if(d.type==='init'){GRID=d.GRID;ORIGIN=d.ORIGIN;CELL=d.CELL;STEPS=d.steps;}else if(d.type==='setNav'){nav=new Uint8Array(d.nav);links=new Uint8Array(d.links);version=d.version;}else if(d.type==='route'&&nav&&links&&d.version===version){const path=route(d.start,d.goal);postMessage({type:'route',id:d.id,key:d.key,version,path});}};\n";}
 function initWorker(){
  if(worker)return true;if(disabled)return false;
  try{workerURL=URL.createObjectURL(new Blob([workerCode()],{type:'text/javascript'}));const instance=worker=new Worker(workerURL);
   instance.onmessage=e=>{if(worker!==instance)return;const d=e.data||{},p=pending.get(d.key);if(d.type!=='route'||d.version!==version||!p||p.id!==d.id||p.version!==d.version)return;pending.delete(d.key);if(!Array.isArray(d.path)||!d.path.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.z))){disposeWorker('Invalid route result');return;}cacheSet(d.key,d.path);if(perf)perf.workerResults=(perf.workerResults||0)+1;};
   instance.onerror=()=>disposeWorker('Worker error');instance.onmessageerror=()=>disposeWorker('Worker message error');
   if(!send({type:'init',GRID,ORIGIN,CELL,steps:NAV_STEPS.map(p=>p.slice())}))return false;
   URL.revokeObjectURL(workerURL);workerURL=null;return true;
  }catch(e){disposeWorker(e);return false;}
 }
 function syncNav(){if(!navReady||!initWorker())return false;if(sentVersion===version)return true;const a=new Uint8Array(nav),b=new Uint8Array(NAV_LINKS);if(!send({type:'setNav',nav:a,links:b,version},[a.buffer,b.buffer]))return false;sentVersion=version;return true;}
 function invalidate(){version++;cache.clear();pending.clear();counters();if(!syncQueued){syncQueued=true;Promise.resolve().then(()=>{syncQueued=false;if(worker)syncNav();});}}
 window.__routeWorkerNavChanged=invalidate;
 function keyOf(from,to){return freeCell(cellOf(from.x,from.z))+':'+freeCell(cellOf(to.x,to.z));}
 function checkTimeout(){const now=performance.now();for(const p of pending.values())if(now-p.time>TIMEOUT){disposeWorker('Route request timed out');return false;}return !disabled;}
 function requestRoute(from,to){if(!checkTimeout()||!syncNav())return;const key=keyOf(from,to);if(cache.has(key)||pending.has(key)||pending.size>=MAX_PENDING)return;const id=++requestId;pending.set(key,{id,version,time:performance.now()});send({type:'route',id,key,version,start:freeCell(cellOf(from.x,from.z)),goal:freeCell(cellOf(to.x,to.z))});counters();}
 // Use the same visibility-based smoothing as the main-thread A*.
 function smooth(path,from){const out=[];let ax=from.x,az=from.z,i=0;while(i<path.length){let best=i;for(let j=Math.min(path.length-1,i+18);j>i;j--)if(clearLine(ax,az,path[j].x,path[j].z)){best=j;break;}const p=path[best];out.push({x:p.x,z:p.z});ax=p.x;az=p.z;i=best+1;}return out;}
 Navigation.prototype.route=function(from,to){checkTimeout();const hit=navReady?cache.get(keyOf(from,to)):null;if(hit){hit.stamp=performance.now();if(perf)perf.workerHits=(perf.workerHits||0)+1;return smooth(hit.path,from);}if(perf)perf.workerMisses=(perf.workerMisses||0)+1;return baseRoute.call(this,from,to);};
 const buildNavBase=buildNav;
 buildNav=function(...args){invalidate();return buildNavBase.apply(this,args);};
 const startBase=GameManager.prototype.start;
 GameManager.prototype.start=function(...args){invalidate();try{return startBase.apply(this,args);}finally{invalidate();}};
 function prefetchLoop(){
  checkTimeout();
  if(!disabled&&state==='playing'&&!document.hidden&&world?.ai?.navigation&&navReady&&enemy&&player){
   const target=world.ai.navTarget;
   if(!enemyHasSpawned||!target){setTimeout(prefetchLoop,140);return;}
   if(!clearLine(enemy.x,enemy.z,target.x,target.z))requestRoute(enemy,target);
  }
  setTimeout(prefetchLoop,140);
 }
 prefetchLoop();
 if(perf){const sample=perf.sample.bind(perf);perf.sample=function(v){sample(v);if(this.enabled){const hud=document.getElementById('perf-hud');if(hud&&hud.textContent){const extra='WORKER CACHE '+cache.size+'   PENDING '+pending.size+'   HIT '+(this.workerHits||0)+' / MISS '+(this.workerMisses||0);if(!hud.textContent.includes('WORKER CACHE'))hud.textContent+='\n'+extra;else hud.textContent=hud.textContent.replace(/WORKER CACHE [^\n]*/,extra);}}};}
})();

