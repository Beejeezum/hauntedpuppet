import {mountFilmOutput} from './wisp-film-output.js';
/** Mirror the owner's decoded full-film frame; the output creates no media element. */
export function mountWholeFilmOutput(host, player){
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;canvas.hidden=true;host.after(canvas);
 const context=canvas.getContext('2d');let disposed=false,frame=0,draws=0,lastVideo=null,lastTime=-1;
 const output=mountFilmOutput(canvas,()=>({black:!player.active,disposed:disposed||player.disposed,metrics:{draws}}));
 function paint(){if(disposed)return;const video=player.active;if(!video){context.clearRect(0,0,canvas.width,canvas.height);lastVideo=null;lastTime=-1;}
  else if(video.readyState>=2&&(video!==lastVideo||video.currentTime!==lastTime)){
   context.fillStyle='#000';context.fillRect(0,0,canvas.width,canvas.height);
   const fit=Math.min(canvas.width/video.videoWidth,canvas.height/video.videoHeight),w=video.videoWidth*fit,h=video.videoHeight*fit;
   context.drawImage(video,(canvas.width-w)/2,(canvas.height-h)/2,w,h);draws++;lastVideo=video;lastTime=video.currentTime;
  }
  frame=requestAnimationFrame(paint);
 }
 paint();
 return {blackout:()=>{context.clearRect(0,0,canvas.width,canvas.height);output.blackout();},inspect:()=>({draws,disposed}),dispose:()=>{disposed=true;cancelAnimationFrame(frame);output.dispose();canvas.remove();}};
}
