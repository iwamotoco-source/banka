// Real mouth frames: open 32..39, hold 39, enter, then close 0..9.
function devourPose(seconds){
 const t=clamp(seconds/2.1,0,1),smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
 const frame=t<.27?32+Math.min(7,Math.floor(t/.27*8)):t<.73?39:Math.min(9,Math.floor(clamp((t-.73)/.19,0,1)*10));
 const approach=smooth(t/.36),dive=Math.pow(clamp((t-.30)/.43,0,1),3),close=smooth((t-.73)/.19);
 return {t,frame,approach,dive,close,scale:.78+approach*.78+dive*8.8+close,black:clamp((t-.89)/.085,0,1)};
}
const swallowing={canvas:null,ctx:null,background:null,time:0,active:false,throat:false,
 setup(){if(this.canvas)return;const c=document.createElement('canvas');c.id='swallow-cinematic';c.setAttribute('aria-hidden','true');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:42;pointer-events:none;display:none;background:#000';document.body.appendChild(c);this.canvas=c;this.ctx=c.getContext('2d');this.background=document.createElement('canvas');},
 start(){this.setup();this.time=0;this.active=true;this.throat=false;this.canvas.style.display='block';state='swallowed';hide('scare');hide('hud');resetInput();chaseMusic.stop(false);revision?.stopAudio();
  // Capture the actual place of capture, rather than the demo's artificial forest.
  const bg=this.background;bg.width=Math.min(innerWidth,900);bg.height=Math.round(bg.width*innerHeight/innerWidth);
  const visible=enemyMesh.visible;enemyMesh.visible=false;
  try{renderer.render(scene,camera);bg.getContext('2d').drawImage($('world'),0,0,bg.width,bg.height);}finally{enemyMesh.visible=visible;}
  this.draw();
 },
 stop(){this.active=false;if(this.canvas)this.canvas.style.display='none';if(this.background)this.background.width=this.background.height=1;},
 update(dt){if(!this.active)return;this.time+=dt;if(this.time>=2.1*.73&&!this.throat){this.throat=true;audio.tone(65,.5,.065,'sine',25);}this.draw();if(this.time>=2.4){this.stop();state='dying';revealGameOver();$('death-summary').textContent='老婆に呑み込まれた。　·　'+formatTime(elapsed)+'　·　部品 '+partsFound+'/7';}},
 draw(){const c=this.canvas,ctx=this.ctx,w=Math.min(innerWidth,900),h=Math.round(w*innerHeight/innerWidth);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const p=devourPose(this.time);
  ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
  if(this.background?.width>1){ctx.save();ctx.globalAlpha=1-p.dive*.84;const z=1+p.approach*.09+p.dive*.27;ctx.drawImage(this.background,w*(1-z)/2,h*(1-z)/2,w*z,h*z);ctx.restore();}
  const image=classic?.faces?.animationFrames?.[p.frame]?.image;if(!image)return;
  const baseWidth=Math.min(w*.56,250*w/innerWidth),fw=baseWidth*p.scale,fh=fw*375/384;
  const mouthX=w*.5,mouthY=h*(.53-.03*p.dive),left=mouthX-fw*.5,top=mouthY-fh*(250/375);
  // The supplied face animates without stretching; zoom is centred on the mouth.
  if(enemyCorruption?.material?.uniforms?.uAtlas){
   const atlas=enemyCorruption.material.uniforms.uAtlas.value.image,i=Math.floor(this.time*10)%24,s=192,aw=fw*2.35;
   ctx.save();ctx.globalAlpha=.78+p.approach*.18;ctx.drawImage(atlas,i%6*s,Math.floor(i/6)*s,s,s,left+fw/2-aw/2,top+fh/2-aw/2,aw,aw);ctx.restore();
  }
  ctx.save();ctx.filter='brightness('+(1-p.dive*.4-p.close*.28)+') contrast(1.15)';ctx.drawImage(image,left,top,fw,fh);ctx.restore();
  const shade=ctx.createRadialGradient(w/2,h*.53,Math.min(w,h)*.20,w/2,h*.53,Math.max(w,h)*.65);shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.86)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
  if(p.t<.14){ctx.fillStyle='rgba(65,0,0,'+Math.sin(p.t/.14*Math.PI)*.22+')';ctx.fillRect(0,0,w,h);}
  ctx.fillStyle='rgba(0,0,0,'+p.black+')';ctx.fillRect(0,0,w,h);
 }
};
const swallowEnd=endGame;endGame=function(won){const captured=!won&&state==='playing'&&enemyHasSpawned&&!classic?.battery?.cause&&Math.hypot(player.x-enemy.x,player.z-enemy.z)<2;
 swallowEnd(won);if(captured&&state==='dying'&&!settings.gentle)swallowing.start();};
const swallowStart=GameManager.prototype.start;GameManager.prototype.start=function(){swallowing.stop();swallowStart.call(this);};
const swallowHome=returnHome;returnHome=function(){swallowing.stop();swallowHome();};
