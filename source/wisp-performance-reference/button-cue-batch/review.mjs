const film=document.getElementById('film'),message=document.getElementById('message');
const films={
 morph:{src:'wisp-morph-roundtrip-review-v7.mp4',title:'One spirit, two sides',description:'One continuous 25-second review: friendly drift, authored transformation, scary drift, authored return and friendly drift again. Framing stays fixed so the character does not shrink at the joins.',warning:'Manual spooky review. Identity, motion and four joins are approved; dry sound direction is endorsed, with effects raised by6dB in this revision.',facts:'607 original-order frames at24fps. Four cuts at5.08,10.13,15.17 and20.21seconds. All frames retain15percent effect reserve. No body crossfade, reversed performance, interpolated frames or animated resize. This is not a perfect-loop or physical projection claim.'},
 rehearsal:{src:'first-batch-rehearsal-v2.mp4',title:'Three little hauntings',description:'One continuous 31-second rehearsal: a friendly wave, a failed scare, then a menacing reach. Each performance leaves an intentional empty stage before the next arrival.',warning:'The last chapter is a manual scare.',facts:'All 735 frames decode at 24 fps. Both joins have exact-black frames and silent sound tails. These technical checks do not prove artistic quality or physical projection performance.'},
 departure:{src:'friendly-depart-runtime-candidate-v1.mp4',title:'Off to the next haunting',description:'A side/back turn, a look-back wave, then flight into depth and a contained vapor disappearance. One continuous performance with native sound effects.',warning:'Its visible opening pose still needs an approved incoming transition.',facts:'241 frames at 24 fps; no animated resize, crop or retiming. Every decoded frame passes the 15% fog reserve. The ending has 16 exact-black frames and a silent sound tail. Full motion, sound and incoming seam review remain open.'},
 handoff:{src:'friendly-idle-departure-review-v1.mp4',title:'From living idle to departure',description:'One 15-second file: the existing friendly idle flows directly into the new departure. Judge the handoff at about 5.08 seconds, then the flight and vapor ending.',warning:'This is an exact-cut review, not an approved seamless transition.',facts:'363 frames at 24 fps. Original frame order and durations, fixed framing, no visual crossfade or pose interpolation. Candidate soundtracks are joined at the same frame boundary. Pixel similarity alone does not approve motion or sound continuity.'}
};
let selected='rehearsal',epoch=0,disposed=false;
for(const button of document.querySelectorAll('[data-review]'))button.onclick=()=>{
 if(disposed)return;const next=films[button.dataset.review];if(!next)return;
 epoch++;film.pause();film.muted=true;selected=button.dataset.review;film.src=next.src;film.load();
 film.setAttribute('aria-label',next.title+' review with generated sound effects');
 document.getElementById('reviewTitle').textContent=next.title;document.getElementById('reviewDescription').textContent=next.description;document.getElementById('reviewWarning').textContent=next.warning;document.getElementById('reviewFacts').textContent=next.facts;document.getElementById('knownLimit').hidden=selected!=='rehearsal';
 for(const b of document.querySelectorAll('[data-review]'))b.setAttribute('aria-pressed',String(b.dataset.review===selected));
 for(const b of document.querySelectorAll('[data-time]'))b.disabled=selected!=='rehearsal';
 message.textContent='Film selected and paused. Choose Play from start with sound when ready.';
};
document.getElementById('listen').onclick=async()=>{
 if(disposed)return;const attempt=++epoch;film.pause();film.load();film.muted=false;film.volume=.65;
 try{await film.play();if(attempt===epoch&&!disposed)message.textContent='Playing the selected film with sound. Use the video controls to adjust volume or pause.';}
 catch{if(attempt===epoch&&!disposed){film.muted=true;message.textContent='Playback could not start. Try the video’s play control.';}}
};
for(const button of document.querySelectorAll('[data-time]'))button.onclick=()=>{
 if(disposed||selected!=='rehearsal')return;epoch++;film.pause();film.currentTime=Number(button.dataset.time);message.textContent='Chapter selected. Press play when ready; the current sound setting is kept.';
};
film.addEventListener('error',()=>{if(disposed)return;epoch++;film.pause();film.muted=true;message.textContent='The review video could not load. Refresh this preview or return to the show desk.';});
window.addEventListener('pagehide',()=>{disposed=true;epoch++;film.pause();film.muted=true;film.removeAttribute('src');film.querySelector('source')?.remove();film.load();},{once:true});

// Bookmark a finite review choice without ever starting sound.
const requestedReview=new URL(location.href).searchParams.get('review');
if(Object.hasOwn(films,requestedReview)&&requestedReview!==selected)document.querySelector('[data-review="'+requestedReview+'"]')?.click();
