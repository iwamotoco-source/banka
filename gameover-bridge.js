(()=>{
 'use strict';
 let result={time:'00:00:00',lamps:0,total:7};
 try{result={...result,...JSON.parse(sessionStorage.getItem('banka_chase_result')||'{}')};}catch(_){}
 window.BankaGameOver?.setResult(result);
 window.addEventListener('banka:retryChase',event=>{event.preventDefault();try{sessionStorage.setItem('banka_chase_autostart','1');}catch(_){}location.href='chase/index.html?autostart=1';});
 window.addEventListener('banka:returnTitle',event=>{event.preventDefault();location.href='index.html';});
})();
