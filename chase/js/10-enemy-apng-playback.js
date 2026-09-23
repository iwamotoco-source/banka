
// Full-frame APNG is also decoded into a single updating canvas texture.
// HTMLImageElement APNG playback does not reliably update a WebGL texture.
async function decodeEnemyAPNG(source){
 const bytes=source.startsWith('data:')?Uint8Array.from(atob(source.slice(source.indexOf(',')+1)),c=>c.charCodeAt(0)):new Uint8Array(await (async()=>{const response=await fetch(source);if(!response.ok)throw Error('Enemy animation fetch failed: '+response.status);return response.arrayBuffer();})()),view=new DataView(bytes.buffer);
 const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}
 const pack=(name,data)=>{const a=new Uint8Array(data.length+12),v=new DataView(a.buffer);v.setUint32(0,data.length);for(let i=0;i<4;i++)a[i+4]=name.charCodeAt(i);a.set(data,8);let crc=0xffffffff;for(let i=4;i<a.length-4;i++)crc=table[(crc^a[i])&255]^(crc>>>8);v.setUint32(a.length-4,(crc^0xffffffff)>>>0);return a;};
 let ihdr,frame=null;const frames=[];const common=[];
 for(let p=8;p<bytes.length;){const length=view.getUint32(p),type=String.fromCharCode(...bytes.subarray(p+4,p+8)),data=bytes.slice(p+8,p+8+length);p+=length+12;
  if(type==='IHDR')ihdr=data;
  else if(type==='sRGB'||type==='gAMA'||type==='PLTE'||type==='tRNS')common.push(pack(type,data));
  else if(type==='fcTL'){if(frame)frames.push(frame);const v=new DataView(data.buffer);if(v.getUint32(4)!==384||v.getUint32(8)!==375||v.getUint32(12)!==0||v.getUint32(16)!==0||data[25]!==0)throw Error('Unsupported enemy frame layout');frame={parts:[],duration:1000*v.getUint16(20)/(v.getUint16(22)||100)};}
  else if(type==='IDAT')frame.parts.push(pack('IDAT',data));
  else if(type==='fdAT')frame.parts.push(pack('IDAT',data.slice(4)));
 }
 if(frame)frames.push(frame);if(frames.length!==40)throw Error('Enemy animation requires 40 frames');
 for(const f of frames){const url=URL.createObjectURL(new Blob([bytes.slice(0,8),pack('IHDR',ihdr),...common,...f.parts,pack('IEND',new Uint8Array())],{type:'image/png'}));try{f.image=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Enemy frame decode failed'));image.src=url;});}finally{URL.revokeObjectURL(url);}delete f.parts;}
 return frames;
}
FaceVariants.prototype.load=async function(){
 this.animationFrames=await decodeEnemyAPNG(NEW_DEFAULT_FACE);
 this.animationCanvas=document.createElement('canvas');this.animationCanvas.width=384;this.animationCanvas.height=375;
 this.animationContext=this.animationCanvas.getContext('2d');this.animationDuration=this.animationFrames.reduce((n,f)=>n+f.duration,0);this.animationIndex=-1;
 this.defaultTexture=new THREE.CanvasTexture(this.animationCanvas);this.defaultTexture.colorSpace=THREE.SRGBColorSpace;this.defaultTexture.generateMipmaps=false;this.defaultTexture.minFilter=THREE.LinearFilter;this.defaultTexture.magFilter=THREE.LinearFilter;
 this.drawFrame(0);
};
FaceVariants.prototype.drawFrame=function(index){if(index===this.animationIndex)return;this.animationIndex=index;this.animationContext.clearRect(0,0,384,375);this.animationContext.drawImage(this.animationFrames[index].image,0,0);this.defaultTexture.needsUpdate=true;};
FaceVariants.prototype.tickAnimation=function(seconds){let time=(seconds*1000)%this.animationDuration,index=0;while(index<this.animationFrames.length-1&&time>=this.animationFrames[index].duration){time-=this.animationFrames[index].duration;index++;}this.drawFrame(index);};
const apngSelect=FaceVariants.prototype.select;
FaceVariants.prototype.select=function(){this.drawFrame(0);apngSelect.call(this);};
const apngEnemyUpdate=updateEnemy;
updateEnemy=function(dt){classic?.faces?.tickAnimation(elapsed);return apngEnemyUpdate(dt);};

