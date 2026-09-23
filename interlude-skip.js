(()=>{
 'use strict';
 const end=document.getElementById('end');
 const button=document.createElement('button');button.id='banka-story-skip';button.type='button';button.textContent='シナリオをスキップ';button.hidden=true;document.body.appendChild(button);
 const sync=()=>{let on=false;try{on=localStorage.getItem('banka_story_skip_enabled')==='1';}catch(_){}button.hidden=!on||!end.hidden;};
 button.addEventListener('click',()=>{if(!button.hidden)window.bankaChapter1Interlude?.skipToEnd?.();});
 new MutationObserver(sync).observe(end,{attributes:true,attributeFilter:['hidden']});sync();
})();
