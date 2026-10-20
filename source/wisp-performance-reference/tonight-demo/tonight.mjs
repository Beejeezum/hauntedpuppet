import {mountPairedControls} from './paired-controls.mjs';
import {mountFilmOutput} from '../runway-pilots/wisp-film-output.js';
const $=id=>document.getElementById(id),v=$('picture'),audio=$('soundtrack'),canvas=$('stage'),ctx=canvas.getContext('2d');
let disposed=false,black=true,paused=false,epoch=0,draws=0,lastTime=-1,lastFresh=performance.now(),raf,starting=false;
const output=mountFilmOutput(canvas,()=>({black,paused:v.paused,disposed,metrics:{draws}}));
function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);output.blackout();}
function silence(){audio.pause();}
function controls(){ $('pause').disabled=black||starting;$('pause').textContent=paused?'Resume':'Pause';$('play').disabled=starting;}
function stop(){epoch++;starting=false;black=true;paused=false;v.pause();silence();v.currentTime=0;audio.currentTime=0;clear();$('status').textContent='Stage black · stopped';controls();}
async function alignSound(){
 if(!$('sound').checked||black||v.paused){silence();return;}
 audio.volume=Number($('level').value)/100;if(Math.abs(audio.currentTime-v.currentTime)>.12)audio.currentTime=v.currentTime;
 const token=epoch;try{await audio.play();if(token!==epoch||disposed||black||v.paused)silence();}catch{if(token===epoch){$('sound').checked=false;$('status').textContent='Sound unavailable · picture continues';}}
}
async function play({resume=false}={}){
 if(disposed||starting||!resume&&!v.paused&&!black)return;const token=++epoch;starting=true;controls();if(!resume){v.currentTime=0;audio.currentTime=0;}black=false;paused=false;lastFresh=performance.now();
 try{const playing=v.play();alignSound();await playing;if(token!==epoch||disposed)return;$('status').textContent='Playing · '+($('sound').checked?'laptop sound on':'sound off');}
 catch{if(token===epoch){stop();$('status').textContent='Film unavailable · stage black';}}
 finally{if(token===epoch){starting=false;controls();}}
}
$('play').onclick=()=>play();$('pause').onclick=()=>{if(paused)play({resume:true});else{epoch++;v.pause();silence();paused=true;black=true;clear();$('status').textContent='Paused · output black';$('pause').disabled=false;$('pause').textContent='Resume';}};
$('stop').onclick=stop;$('sound').onchange=alignSound;$('level').oninput=()=>audio.volume=Number($('level').value)/100;
document.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});
v.onended=()=>{silence();if($('repeat').checked&&!disposed)play();else{stop();$('status').textContent='Story complete · empty stage';}};
v.addEventListener('error',()=>{stop();$('status').textContent='Film unavailable · stage black';});
function tick(now){if(disposed)return;if(!v.paused&&v.readyState>=2&&v.currentTime!==lastTime){lastTime=v.currentTime;lastFresh=now;draws++;if(!paused&&!starting)black=false;if(!black){ctx.drawImage(v,0,0,canvas.width,canvas.height);if($('sound').checked&&audio.paused)alignSound();else if(!audio.paused&&Math.abs(audio.currentTime-v.currentTime)>.16)audio.currentTime=v.currentTime;}}
 if(!v.paused&&now-lastFresh>1200){black=true;clear();silence();$('status').textContent='Waiting for film · output black';}
 const t=v.currentTime;$('chapter').textContent=t<11.333?'1 · A visitor in the mist':t<37.333?'2 · A mischievous haunting':'3 · A friendly goodbye';raf=requestAnimationFrame(tick);}
controls();tick(performance.now());
const paired=mountPairedControls(document.querySelector('main'),{stop,canvas,remote:{remoteState:()=>({state:{workspace:'films',blackout:black,status:black?'Tonight story · stage black':paused?'Tonight story · paused':'Tonight story · playing',volume:Number($('level').value)/100},cues:['Play-Tonight','Pause-Story','Resume-Story','Repeat-On','Repeat-Off','Restore-Picture']}),remoteCommand:async(command,value)=>{if(command==='stop'||command==='blackout'&&value==='on'){stop();return{accepted:true};}if(command==='volume'){const n=Number(value);if(!Number.isFinite(n)||n<0||n>1)throw Error('Invalid level');$('level').value=Math.min(70,n*100);$('level').dispatchEvent(new Event('input'));return{accepted:true};}if(command==='blackout'&&value==='off'||command==='cue'&&['Play-Tonight','Restore-Picture'].includes(value)){await play();return{accepted:true};}if(command==='cue'&&value==='Pause-Story'){if(!black&&!paused)$('pause').click();return{accepted:true};}if(command==='cue'&&value==='Resume-Story'){if(paused)await play({resume:true});return{accepted:true};}if(command==='cue'&&['Repeat-On','Repeat-Off'].includes(value)){$('repeat').checked=value==='Repeat-On';return{accepted:true};}throw Error('This control is not enabled for Tonight’s story');}}});
window.TonightDemo={stop,inspect:()=>({black,paused,starting,disposed,time:v.currentTime,duration:v.duration,draws,soundEnabled:$('sound').checked,audioPaused:audio.paused,audioTime:audio.currentTime,mutedPicture:v.muted,operator:paired.inspect()})};
window.addEventListener('pagehide',()=>{stop();disposed=true;cancelAnimationFrame(raf);v.removeAttribute('src');v.load();audio.removeAttribute('src');audio.load();paired.dispose();output.dispose();},{once:true});
