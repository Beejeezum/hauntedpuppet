/** Repeatable, silent 15-second art-review performance. Not provider speech. */
export const REEL_DURATION=15;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return Math.max(0,Math.min(1,x*x*x*(x*(x*6-15)+10)));};
export function performanceFrame(seconds){
 const t=Math.max(0,Math.min(REEL_DURATION,seconds));
 let phase='Notice',state='idle',kind='',at=100,mood='curious',evil=0;
 if(t<.7){phase='Notice';state='listening';}
 else if(t<3.5){phase='Greet and wave';kind='wave';at=t-.7;mood='amused';}
 else if(t<5.5){phase='Listen';state='listening';}
 else if(t<7.8){phase='Speak';state='speaking';mood='amused';}
 else if(t<11.4){phase='Turn and return';kind='twirl';at=t-7.8;}
 else if(t<13.2){phase='Become spooky';evil=smooth((t-11.4)/1.3);mood='angry';}
 else if(t<14){phase='Spooky hold';evil=1;mood='angry';}
 else {phase='Welcome back';evil=1-smooth((t-14)/.9);mood='amused';}
 const speech=state==='speaking',jaw=speech?(.18+.62*Math.abs(Math.sin((t-5.5)*8))):0;
 return{phase,evil,params:{clock:t,dt:1/60,state,action:{kind,at},mood,jaw,
  weights:speech?{A:jaw,O:(1-jaw)*.4}: {},syncMode:'amplitude-fallback',
  blink:0,gaze:'audience',visible:1,motion:{float:80,gesture:100}}};
}
