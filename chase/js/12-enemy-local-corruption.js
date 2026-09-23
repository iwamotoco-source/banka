
// Lightweight local black corruption aura attached behind the animated face.
let enemyCorruption=null;
const ENEMY_CORRUPTION_TEXTURE='assets/87af5168b36e58c8.webp';
function makeCorruptionAtlas(source){
 const size=192,frames=24,small=document.createElement('canvas');small.width=small.height=size;
 const ctx=small.getContext('2d');ctx.drawImage(source,12,12,size-24,size-24);
 const raw=ctx.getImageData(0,0,size,size).data;
 const atlas=document.createElement('canvas');atlas.width=size*6;atlas.height=size*4;
 const out=atlas.getContext('2d'),tile=out.createImageData(size,size);
 for(let frame=0;frame<frames;frame++){
  const t=frame/frames*Math.PI*2;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const nx=(x-size/2)/(size/2),ny=(y-size/2)/(size/2),r=Math.hypot(nx,ny);
   const strength=Math.min(1,r*1.6),a=Math.atan2(ny,nx);
   const pulse=1+.13*Math.sin(t+a*3)+.055*Math.sin(t*2-a*5);
   const sx=size/2+(x-size/2)/pulse+strength*(9*Math.sin(ny*5+t)+5*Math.sin(nx*7-t*2));
   const sy=size/2+(y-size/2)/pulse+strength*(10*Math.cos(nx*5-t)+4*Math.sin(ny*8+t*2));
   const ix=Math.floor(sx),iy=Math.floor(sy),f=sx-ix,g=sy-iy,d=(y*size+x)*4;
   for(let k=0;k<4;k++){
    let v=0;for(let j=0;j<2;j++)for(let i=0;i<2;i++)if(ix+i>=0&&ix+i<size&&iy+j>=0&&iy+j<size)v+=raw[((iy+j)*size+ix+i)*4+k]*(i?f:1-f)*(j?g:1-g);
    tile.data[d+k]=v;
   }
  }
  out.putImageData(tile,(frame%6)*size,Math.floor(frame/6)*size);
 }
 return atlas;
}
async function createEnemyCorruption(){
 if(enemyCorruption||!enemyMesh)return;
 const imageTexture=await new THREE.TextureLoader().loadAsync(ENEMY_CORRUPTION_TEXTURE);
 const atlas=makeCorruptionAtlas(imageTexture.image);imageTexture.dispose();
 const texture=new THREE.CanvasTexture(atlas);texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 const material=new THREE.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,side:THREE.DoubleSide,
  uniforms:{uAtlas:{value:texture},uTime:{value:0},uMotion:{value:1}},
  vertexShader:`varying vec2 vUv;uniform float uTime;uniform float uMotion;
 void main(){vUv=uv;float t=uTime*uMotion;vec3 p=position;float edge=smoothstep(.08,.48,length(uv-.5));
 p.x+=edge*uMotion*(.48*sin(p.y*1.6+t*2.4)+.22*cos(p.x*2.1-t*3.1));
 p.y+=edge*uMotion*(.55*cos(position.x*1.3-t*2.0)+.19*sin(position.y*2.4+t*3.3));
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
  fragmentShader:`precision mediump float;varying vec2 vUv;uniform sampler2D uAtlas;uniform float uTime;uniform float uMotion;
   vec4 frame(float i,vec2 uv){vec2 cell=vec2(mod(i,6.0),3.0-floor(i/6.0));return texture2D(uAtlas,(cell+clamp(uv,vec2(.003),vec2(.997)))/vec2(6.0,4.0));}
   void main(){float t=uTime*uMotion;vec2 uv=vUv;float edge=smoothstep(.12,.45,length(uv-.5));
    uv+=edge*.018*vec2(sin(uv.y*17.0+t*2.8),cos(uv.x*15.0-t*2.3));
    float f=mod(t*10.0,24.0);vec4 c=mix(frame(floor(f),uv),frame(mod(floor(f)+1.0,24.0),uv),fract(f));
    float rim=smoothstep(0.0,.04,vUv.x)*smoothstep(0.0,.04,vUv.y)*smoothstep(0.0,.04,1.0-vUv.x)*smoothstep(0.0,.04,1.0-vUv.y);
    c.a=(1.0-pow(1.0-c.a,2.8))*rim;if(c.a<.004)discard;gl_FragColor=vec4(c.rgb*.18,c.a);}`});
 material.toneMapped=false;
 enemyCorruption=new THREE.Mesh(new THREE.PlaneGeometry(10.2,10.2,24,24),material);enemyCorruption.name='enemy-animated-corruption';enemyCorruption.position.set(0,0,-.08);enemyCorruption.renderOrder=-1;enemyMesh.add(enemyCorruption);
 enemyCorruption.onBeforeRender=()=>animateEnemyCorruption();
}
function animateEnemyCorruption(){
 if(!enemyCorruption)return;
 const motion=settings.gentle?.35:1,t=elapsed*motion;
 enemyCorruption.material.uniforms.uTime.value=elapsed;enemyCorruption.material.uniforms.uMotion.value=motion;
 enemyCorruption.scale.set(1+motion*(.20*Math.sin(t*2.3)+.07*Math.sin(t*4.1)),1+motion*(.23*Math.cos(t*1.9)+.06*Math.sin(t*3.7)),1);
 enemyCorruption.rotation.z=motion*.055*Math.sin(t*1.6);
 enemyCorruption.position.x=motion*.13*Math.sin(t*2.7);enemyCorruption.position.y=motion*.15*Math.cos(t*2.1);
}
const corruptionInit=init;init=async function(){await corruptionInit();if(ready)await createEnemyCorruption();};
const corruptionEnemy=updateEnemy;updateEnemy=function(dt){const result=corruptionEnemy(dt);if(enemyCorruption){enemyCorruption.visible=enemyMesh.visible;animateEnemyCorruption();enemyCorruption.material.uniforms.uTime.value=elapsed;enemyCorruption.material.uniforms.uMotion.value=settings.gentle?.35:1;}return result;};
