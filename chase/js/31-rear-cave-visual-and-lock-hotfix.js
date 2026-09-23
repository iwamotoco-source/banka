
(()=>{
 'use strict';
 // Opaque backing around the shrine-side cave mouth. This closes small gaps that can reveal the sky/background.
 const oldInit=init;
 init=async function(){
  const v=await oldInit();
  if(!ready||!world?.map)return v;
  try{
   const old=scene.getObjectByName('rear-cave-opaque-backing');if(old)scene.remove(old);
   const g=new THREE.Group();g.name='rear-cave-opaque-backing';
   const mat=material(0x39423b,{roughness:1,metalness:0,side:THREE.DoubleSide});
   const y=world.map.floor(rearPassage.x,rearPassage.z);
   // Side jambs + overhead lip, placed behind the iron gate and outside the walkable opening.
   box(1.35,5.0,2.6,mat,rearPassage.x-4.15,y+2.25,rearPassage.z,g);
   box(1.35,5.0,2.6,mat,rearPassage.x+4.15,y+2.25,rearPassage.z,g);
   box(9.0,1.25,2.6,mat,rearPassage.x,y+4.55,rearPassage.z,g);
   // dark shell just beyond the mouth prevents distant background leaking through cracks
   box(10.2,6.0,.28,material(0x171c19,{roughness:1,side:THREE.DoubleSide}),rearPassage.x,y+2.3,rearPassage.z-.95,g);
   scene.add(g);
  }catch(e){console.warn('rear cave backing',e);}
  return v;
 };
 // Rear lock: validate the entered three digits against the current run's code.
 // Do not re-test the tiny interaction hitbox after the modal has opened; that was causing valid codes to fail.
 PilgrimageRevision.prototype.unlockRear=function(code){
  const entered=String(code).padStart(3,'0').slice(-3);
  const expected=String(this.code).padStart(3,'0').slice(-3);
  if(!this.unlocked){$('shrine-feedback').textContent='正面の三桁錠を先に解錠する必要がある。';return false;}
  if(rearPassage.dialMode!=='rear')return false;
  if(entered!==expected){$('shrine-feedback').textContent='……開かない。正面と同じ番号が必要だ。';audio.tone(85,.2,.1);return false;}
  rearPassage.unlocked=true;if(rearPassage.gate)rearPassage.gate.visible=false;navReady=false;buildNav();enemy.path=[];enemy.repath=0;this.closeDial();audio.tone(170,.4,.14,'triangle',70);toast('裏口が開いた。洞窟と神社を行き来できる。',5);updateHUD();return true;
 };
})();
