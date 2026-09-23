// A* visits cells toward the target instead of flooding the entire map on every chase update.
Navigation.prototype.route=function(from,to){
 const start=freeCell(cellOf(from.x,from.z)),goal=freeCell(cellOf(to.x,to.z));if(start===goal)return [];
 const n=nav.length;if(!this.fastSeen||this.fastSeen.length!==n){this.fastSeen=new Uint32Array(n);this.fastClosed=new Uint32Array(n);this.fastCost=new Float32Array(n);this.fastPrev=new Int32Array(n);this.fastRun=0;}
 const run=++this.fastRun,seen=this.fastSeen,closed=this.fastClosed,cost=this.fastCost,prev=this.fastPrev,heap=[];
 const gx=goal%GRID,gz=Math.floor(goal/GRID),heuristic=id=>{const dx=Math.abs(id%GRID-gx),dz=Math.abs(Math.floor(id/GRID)-gz);return Math.max(dx,dz)+.41421356*Math.min(dx,dz);};
 const push=(id,f)=>{let i=heap.length;heap.push({id,f});while(i){const p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p;}heap[i]={id,f};};
 const pop=()=>{const a=heap[0],b=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let k=i*2+1;if(k+1<heap.length&&heap[k+1].f<heap[k].f)k++;if(heap[k].f>=b.f)break;heap[i]=heap[k];i=k;}heap[i]=b;}return a.id;};
 seen[start]=run;cost[start]=0;prev[start]=-1;push(start,heuristic(start));
 while(heap.length){const cur=pop();if(closed[cur]===run)continue;if(cur===goal){const path=[];for(let p=goal;p!==start;p=prev[p])path.push(this.point(p));return path.reverse();}closed[cur]=run;
  for(let k=0;k<8;k++){if(!(NAV_LINKS[cur]&(1<<k)))continue;const [dx,dz]=NAV_STEPS[k],next=cur+dz*GRID+dx;if(nav[next]||closed[next]===run)continue;const g=cost[cur]+(dx&&dz?Math.SQRT2:1);if(seen[next]===run&&g>=cost[next])continue;seen[next]=run;cost[next]=g;prev[next]=cur;push(next,g+heuristic(next));}
 }
 return [];
};
// Reuse the two existing reserve battery meshes as reachable forest return-route supplies.
const stableRunStart=GameManager.prototype.start;
GameManager.prototype.start=function(){const result=stableRunStart.call(this);
 for(const [i,x,z] of [[9,-8,18],[10,48,-5]]){const p=classic.battery.items[i];if(!p)continue;const q=survivalSystem.freeNear(x,z,'森',.65);delete p.hostBuildingId;delete p.villageFloorY;Object.assign(p,q,{found:false});p.group.position.set(q.x,world.map.floor(q.x,q.z)+.23,q.z);p.group.visible=true;}
 updateHUD();return result;
};
