/** Authored 2D puppet movement. Seconds in, bounded pose out; no timers, audio or randomness. */
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
export const WISP_CHOREOGRAPHY_ACTIONS=Object.freeze({wave:2.8,shy:3.2,laugh:2.8,surprise:2.6,dance:6.4,twirl:3.6,bounce:3.8,peekaboo:3.8,celebrate:4.2,orbit:6.4,enter:5,exit:5.4,phantom:6});
export const actionDuration=kind=>typeof kind==='string'&&Object.prototype.hasOwnProperty.call(WISP_CHOREOGRAPHY_ACTIONS,kind)?WISP_CHOREOGRAPHY_ACTIONS[kind]:0;
const fields=['dx','dy','rotation','scaleX','scaleY','left','right','tail'];
const pose=(values={})=>Object.assign({dx:0,dy:0,rotation:0,scaleX:1,scaleY:1,left:0,right:0,tail:0},values);
// Each beat includes anticipation, an unmistakable silhouette, and a complete return to rest.
const tracks={
 phantom:[[0,{}],[.35,{dy:18,scaleX:1.06,scaleY:.94}],[1.25,{dy:-45,rotation:-.04}],[3.9,{dy:-45,rotation:.04}],[4.9,{dy:12,scaleX:1.06,scaleY:.94}],[6,{}]],
 wave:[[0,{}],[.22,{dy:18,rotation:.08,scaleX:1.08,scaleY:.9}],[.58,{dy:-32,rotation:-.12,right:-1.55,left:.2}],[1.8,{dy:-24,rotation:-.08,right:-1.55,left:.22}],[2.3,{dy:12,rotation:.035,right:-.18}],[2.8,{}]],
 shy:[[0,{}],[.3,{dy:-12,rotation:.08}],[1,{dx:-44,dy:55,rotation:-.27,scaleX:.92,scaleY:.94,left:.35,right:-.35}],[2,{dx:-35,dy:42,rotation:-.2,left:.32,right:-.28}],[2.65,{dy:-12,rotation:.06}],[3.2,{}]],
 laugh:[[0,{}],[.25,{dy:24,scaleX:1.12,scaleY:.86}],[.6,{dy:-34,rotation:-.1,left:.34,right:-.34}],[2.15,{dy:-20,left:.3,right:-.3}],[2.5,{dy:14,scaleX:1.07,scaleY:.93}],[2.8,{}]],
 surprise:[[0,{}],[.22,{dy:28,scaleX:1.13,scaleY:.84,rotation:-.08}],[.48,{dy:-100,scaleX:.85,scaleY:1.16,rotation:.13,left:.62,right:-.68}],[.85,{dy:-72,rotation:-.06,left:.55,right:-.6}],[1.5,{dy:28,scaleX:1.12,scaleY:.87}],[2.05,{dy:-15,scaleX:.97,scaleY:1.04}],[2.6,{}]],
 dance:[[0,{}],[.3,{dy:26,scaleX:1.12,scaleY:.88}],[.75,{dx:-100,dy:-45,rotation:-.25,left:1.25,right:-.1}],[1.3,{dx:100,dy:12,rotation:.25,left:.05,right:-1.4}],[1.9,{dx:-100,dy:-48,rotation:-.28,left:1.25,right:-.08}],[2.5,{dx:100,dy:12,rotation:.28,left:.08,right:-1.4}],[3.1,{dx:-90,dy:-45,rotation:-.24,left:.6,right:-.1}],[3.7,{dx:90,dy:8,rotation:.24,left:.08,right:-.6}],[4.15,{dy:36,scaleX:1.18,scaleY:.8,left:.2,right:-.2}],[4.65,{dy:-105,rotation:-.22,scaleX:.88,scaleY:1.12,left:.65,right:-.65}],[5.25,{dy:22,rotation:.08,scaleX:1.1,scaleY:.9}],[5.8,{dy:-14,rotation:-.035}],[6.4,{}]],
 twirl:[[0,{}],[.3,{dx:-28,dy:20,rotation:-.22,scaleX:1.08,scaleY:.91}],[.7,{dy:-45,rotation:.3,left:.6,right:-.6}],[1.6,{dy:-65,rotation:Math.PI*1.1,scaleX:.92,scaleY:.92,left:.55,right:-.55}],[2.35,{dy:-35,rotation:Math.PI*2+.15,left:.45,right:-.45}],[2.8,{dy:20,rotation:Math.PI*2-.045,scaleX:1.1,scaleY:.9}],[3.6,{rotation:Math.PI*2}]],
 bounce:[[0,{}],[.28,{dy:32,scaleX:1.17,scaleY:.8}],[.65,{dy:-115,scaleX:.86,scaleY:1.17,left:.5,right:-.5}],[1.2,{dy:32,scaleX:1.17,scaleY:.8}],[1.65,{dy:-90,scaleX:.9,scaleY:1.12,left:.4,right:-.4}],[2.2,{dy:28,scaleX:1.13,scaleY:.85}],[2.55,{dy:-55,scaleX:.94,scaleY:1.07}],[3.1,{dy:18,scaleX:1.07,scaleY:.94}],[3.8,{}]],
 peekaboo:[[0,{}],[.3,{dy:18,rotation:.08}],[1,{dx:-160,dy:65,rotation:-.38,scaleX:.62,scaleY:.86,left:.4,right:-.45}],[1.7,{dx:-160,dy:65,rotation:-.38,scaleX:.62,scaleY:.86,left:.4,right:-.45}],[2.05,{dx:28,dy:-60,rotation:.16,scaleX:1.12,scaleY:1.1,left:.6,right:-.7}],[2.6,{dx:-12,dy:16,rotation:-.06}],[3.8,{}]],
 celebrate:[[0,{}],[.3,{dy:30,scaleX:1.15,scaleY:.82}],[.7,{dy:-100,rotation:-.18,left:1.8,right:-1.95,scaleX:.92,scaleY:1.08}],[1.25,{dx:70,dy:-30,rotation:.23,left:1.8,right:-1.95}],[1.8,{dx:-70,dy:-55,rotation:-.23,left:1.8,right:-1.95}],[2.35,{dx:55,dy:-25,rotation:.18,left:1.8,right:-1.95}],[2.9,{dy:20,scaleX:1.1,scaleY:.9,left:.35,right:-.35}],[3.5,{dy:-15}],[4.2,{}]],
 orbit:[[0,{}],[.3,{dy:24,scaleX:1.1,scaleY:.88,rotation:-.08}],[1.2,{dx:-185,dy:-40,rotation:-.28,scaleX:.5,scaleY:.5,left:.4}],[2.3,{dx:-70,dy:-105,rotation:-.1,scaleX:.12,scaleY:.12}],[2.9,{dx:70,dy:-110,rotation:.1,scaleX:.12,scaleY:.12}],[4,{dx:185,dy:-35,rotation:.28,scaleX:.5,scaleY:.5,right:-.4}],[4.85,{dy:30,rotation:-.06,scaleX:1.5,scaleY:1.5,left:.4,right:-.4}],[5.5,{dy:-15,scaleX:.96,scaleY:1.03}],[6.4,{}]],
 enter:[[0,{}],[.28,{dy:22,rotation:.08,scaleX:1.1,scaleY:.9}],[1.1,{dx:-140,dy:-95,rotation:-.02,scaleX:.01,scaleY:.01}],[2,{dx:-140,dy:-95,rotation:-.02,scaleX:.01,scaleY:.01}],[2.8,{dx:-60,dy:-55,rotation:-.13,scaleX:.22,scaleY:.22}],[3.35,{dx:20,dy:25,rotation:.09,scaleX:1.5,scaleY:1.5,left:.45,right:-.5}],[3.85,{dx:-12,dy:-16,rotation:-.045,scaleX:.94,scaleY:.98}],[5,{}]],
 exit:[[0,{}],[.3,{dy:24,rotation:.1,scaleX:1.13,scaleY:.87,left:.2,right:-.7}],[.8,{dx:35,dy:10,rotation:.13,scaleX:1.5,scaleY:1.5,left:.3,right:-.6}],[1.8,{dx:175,dy:-100,rotation:.02,scaleX:.01,scaleY:.01}],[3,{dx:175,dy:-100,rotation:.02,scaleX:.01,scaleY:.01}],[3.65,{dx:80,dy:-55,rotation:.15,scaleX:.22,scaleY:.22}],[4.15,{dx:-20,dy:22,rotation:-.08,scaleX:1.5,scaleY:1.5}],[4.65,{dy:-12,scaleX:.97,scaleY:1.03}],[5.4,{}]],

};
export function choreographyPose(kind,at,{intensity=1,reducedMotion=false}={}){
 const duration=actionDuration(kind),active=Number.isFinite(at)&&at>=0&&at<duration;
 if(!active)return {...pose(),active:false,kind:null,duration,progress:duration&&Number.isFinite(at)?clamp(at/duration):0,expression:null};
 const track=tracks[kind];let i=1;while(i<track.length-1&&at>track[i][0])i++;
 const [ta,va]=track[i-1],[tb,vb]=track[i],a=pose(va),b=pose(vb),q=ease((at-ta)/(tb-ta)),out=pose();
 for(const key of fields)out[key]=a[key]+(b[key]-a[key])*q;
 const envelope=Math.sin(Math.PI*clamp(at/duration))**2;
 if(kind==='wave')out.right+=Math.sin(at*20)*.13*envelope;
 if(kind==='laugh'){out.dy+=Math.sin(at*21)*17*envelope;out.rotation+=Math.sin(at*10)*.075*envelope;}
 if(kind==='dance'){out.tail+=Math.sin(at*9)*.14*envelope;out.left+=Math.sin(at*13)*.08*envelope;}
 const strength=clamp(Number.isFinite(intensity)?intensity:1,0,1.25),motion=reducedMotion?.13:1;
 for(const key of fields){const base=key==='scaleX'||key==='scaleY'?1:0;out[key]=base===1&&['enter','exit','orbit'].includes(kind)?1+(Math.exp(Math.log(out[key])*strength)-1)*motion:base+(out[key]-base)*strength*motion;}
 // Depth never reaches zero or inverts when the operator boosts intensity.
 out.scaleX=clamp(out.scaleX,.01,1.5);out.scaleY=clamp(out.scaleY,.01,1.5);
 // Reduced motion uses a small expressive lean instead of even a partial spin.
 if(reducedMotion&&kind==='twirl')out.rotation=Math.sin(Math.PI*at/duration)*.07*strength;
 return {...out,active:true,kind,duration,progress:at/duration,expression:['shy','peekaboo'].includes(kind)?'concerned':kind==='orbit'?'curious':'delighted'};
}

/** Uneven, repeatable attention beats: left/right glances, a downward visitor check, with no independent blink clock. */
export function idleAttention(clock){
 const t=Number.isFinite(clock)?Math.max(0,clock):0,cycle=Math.floor(t/15.7),at=t-cycle*15.7;
 const timings=[0,1.8,4.6,5.9,8.7,10.2,13.4,15.7],gazes=['center','left','center','down','right','center','left'];
 let i=0;while(i<gazes.length-1&&at>=timings[i+1])i++;
 const gaze=cycle%2&&gazes[i]==='left'?'right':cycle%2&&gazes[i]==='right'?'left':gazes[i];
 return {gaze,beat:i};
}
