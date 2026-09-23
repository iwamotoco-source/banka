
(()=>{
  'use strict';
  const pad=document.getElementById('joystick');
  if(!pad)return;

  const center=()=>{
    const r=pad.getBoundingClientRect();
    return {x:r.left+r.width*.5,y:r.top+r.height*.5};
  };

  const beginMove=e=>{
    if(state!=='playing'||input.moveId!==null)return;
    e.preventDefault();
    e.stopPropagation();
    const c=center();
    input.moveId=e.pointerId;
    input.originX=c.x;
    input.originY=c.y;
    input.mx=input.my=0;
    try{pad.setPointerCapture(e.pointerId);}catch(_){}
    updateMovePad(e.clientX-c.x,e.clientY-c.y);
  };

  const movePad=e=>{
    if(state!=='playing'||e.pointerId!==input.moveId)return;
    e.preventDefault();
    e.stopPropagation();
    updateMovePad(e.clientX-input.originX,e.clientY-input.originY);
  };

  const endMove=e=>{
    if(e.pointerId!==input.moveId)return;
    e.preventDefault();
    e.stopPropagation();
    input.moveId=null;
    input.mx=input.my=0;
    runHeld=false;
    pad.classList.remove('sprinting');
    const stick=document.getElementById('stick');
    if(stick)stick.style.transform='translate(0,0)';
    try{if(pad.hasPointerCapture(e.pointerId))pad.releasePointerCapture(e.pointerId);}catch(_){}
  };

  pad.addEventListener('pointerdown',beginMove,{passive:false});
  pad.addEventListener('pointermove',movePad,{passive:false});
  pad.addEventListener('pointerup',endMove,{passive:false});
  pad.addEventListener('pointercancel',endMove,{passive:false});
  pad.addEventListener('lostpointercapture',endMove,{passive:false});
  pad.addEventListener('contextmenu',e=>e.preventDefault());

  // Safety reset for Safari when the app loses focus mid-drag.
  window.addEventListener('blur',()=>{
    if(input.moveId===null)return;
    input.moveId=null;input.mx=input.my=0;runHeld=false;
    pad.classList.remove('sprinting');
    const stick=document.getElementById('stick');if(stick)stick.style.transform='translate(0,0)';
  });
})();
