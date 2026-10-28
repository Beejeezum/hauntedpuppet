const film=document.getElementById('film'),message=document.getElementById('message');
document.getElementById('listen').onclick=async()=>{
 film.pause();film.currentTime=0;film.muted=false;film.volume=.65;
 try{await film.play();message.textContent='Playing the complete rehearsal with sound. Use the video controls to adjust volume or pause.';}
 catch{film.muted=true;message.textContent='Playback could not start. Try the video’s play control.';}
};
for(const button of document.querySelectorAll('[data-time]'))button.onclick=()=>{
 film.pause();film.currentTime=Number(button.dataset.time);message.textContent='Chapter selected. Press play when ready; the current sound setting is kept.';
};
film.addEventListener('error',()=>{film.pause();film.muted=true;message.textContent='The review video could not load. Refresh this preview or return to the show desk.';});
window.addEventListener('pagehide',()=>{film.pause();film.muted=true;film.removeAttribute('src');film.querySelector('source')?.remove();film.load();},{once:true});
