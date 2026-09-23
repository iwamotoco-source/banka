
// Procedural branching ink: built once, deformed continuously on the GPU.
function createBranchingCorruption(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const c=canvas.getContext('2d');let seed=173;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 c.strokeStyle='#000';c.lineCap='round';c.lineJoin='round';
 function branch(x,y,a,len,width,depth){
  const steps=7;let px=x,py=y;
  c.beginPath();c.moveTo(x,y);
  for(let i=1;i<=steps;i++){a+=(random()-.5)*.7;px+=Math.cos(a)*len/steps;py+=Math.sin(a)*len/steps;c.lineTo(px,py);
   if(depth>0&&(i===3||i===6)){const bx=px,by=py,ba=a+(random()<.5?-1:1)*(.45+random()*.65);c.lineWidth=width;c.stroke();branch(bx,by,ba,len*.46,width*.48,depth-1);c.beginPath();c.moveTo(px,py);}
  }c.lineWidth=width;c.stroke();
 }
 for(let i=0;i<42;i++){const a=i/42*Math.PI*2+random()*.16,r=58+random()*28;branch(256+Math.cos(a)*r,256+Math.sin(a)*r,a,75+random()*90,1.4+random()*3.2,3);}
 const texture=new THREE.CanvasTexture(canvas);texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
 const mat=new THREE.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,side:THREE.DoubleSide,
 uniforms:{uMap:{value:texture},uTime:{value:0},uMotion:{value:1}},
 vertexShader:enemyCorruption.material.vertexShader,
 fragmentShader:`precision mediump float;varying vec2 vUv;uniform sampler2D uMap;uniform float uTime;uniform float uMotion;
 void main(){float t=uTime*uMotion;vec2 p=vUv-.5;float a=atan(p.y,p.x);float r=length(p);
 float boundary=.205+.034*sin(a*5.0+t*1.7)+.025*sin(a*9.0-t*2.1)+.013*cos(a*17.0+t*3.0);
 float core=1.0-smoothstep(boundary-.045,boundary+.035,r);
 vec2 uv=vUv+.011*vec2(sin(vUv.y*29.0+t*2.7),cos(vUv.x*25.0-t*2.3));
 float veins=texture2D(uMap,uv).a;float rim=1.0-smoothstep(.43,.50,max(abs(p.x),abs(p.y)));
 float alpha=max(core*.98,veins*.94)*rim;if(alpha<.005)discard;gl_FragColor=vec4(vec3(0.0),alpha);}`});
 mat.toneMapped=false;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(11.2,11.2,24,24),mat);mesh.name='living-black-branches';mesh.position.z=-.12;mesh.renderOrder=-2;enemyMesh.add(mesh);
 mesh.onBeforeRender=()=>{const m=settings.gentle?.35:1,t=elapsed*m;mat.uniforms.uTime.value=elapsed+1.3;mat.uniforms.uMotion.value=m;
 mesh.scale.set(1+m*.16*Math.sin(t*1.8+.8),1+m*.19*Math.cos(t*2.1),1);mesh.rotation.z=m*.09*Math.sin(t*.9);};
 return mesh;
}
let branchingCorruption=null;
const branchingInit=init;init=async function(){await branchingInit();if(ready&&enemyCorruption&&!branchingCorruption)branchingCorruption=createBranchingCorruption();};

