import {actionDuration} from '../wisp-choreography.js';
/** Art-directed landmarks in a registered1024×1536 acting canvas. */
export const POSES=[
 {id:'welcome',head:[526,588],chest:[526,930],tail:[530,1370],left:[190,970],right:[900,990],roll:0},
 {id:'listen',head:[650,590],chest:[570,940],tail:[620,1370],left:[230,1090],right:[875,820],roll:-.07},
 {id:'wave',head:[675,575],chest:[615,920],tail:[630,1370],left:[205,520],right:[910,1050],roll:.045},
 {id:'laugh',head:[535,590],chest:[530,950],tail:[530,1390],left:[395,975],right:[635,975],roll:-.035},
 {id:'swoop',head:[660,585],chest:[570,950],tail:[435,1380],left:[200,815],right:[920,1210],roll:.10},
 {id:'farewell',head:[570,590],chest:[560,950],tail:[590,1380],left:[390,975],right:[920,1010],roll:-.045}
];
export const BEATS={
 wave:[[0,'welcome'],[.22,'listen'],[.72,'wave'],[1.35,'wave'],[2,'farewell'],[2.7,'welcome']],
 dance:[[0,'welcome'],[.3,'laugh'],[.8,'swoop'],[1.35,'wave'],[1.9,'laugh'],[2.5,'swoop'],[3.1,'farewell'],[3.8,'welcome']],
 twirl:[[0,'welcome'],[.3,'laugh'],[.9,'swoop'],[1.7,'farewell'],[2.4,'wave'],[3.6,'welcome']],
 exit:[[0,'welcome'],[.45,'farewell'],[1.2,'swoop'],[3,'farewell']],
 enter:[[0,'swoop'],[.7,'wave'],[1.5,'welcome']],
 phantom:[[0,'listen'],[1,'swoop'],[3,'farewell'],[5,'welcome']],
 orbit:[[0,'welcome'],[.5,'swoop'],[1.5,'farewell'],[2.3,'wave'],[3.5,'welcome']],
 bow:[[0,'welcome'],[.5,'laugh'],[1.2,'farewell'],[2,'welcome']]
};
const q=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10)};
export function poseWeights({kind='',at=100,state='idle',mood='neutral'}={}){
 const beats=BEATS[kind]||(['swoop','pounce','peek'].includes(kind)?BEATS.orbit:null);
 if(beats&&actionDuration(kind)>0)at=at/actionDuration(kind)*beats.at(-1)[0];
 if(beats&&at>=0&&at<=beats.at(-1)[0]){let i=0;while(i<beats.length-2&&at>beats[i+1][0])i++;const[a,A]=beats[i],[b,B]=beats[i+1],t=q((at-a)/(b-a));return POSES.map(p=>(p.id===A?1-t:0)+(p.id===B?t:0));}
 const id=['listening','preparing'].includes(state)?'listen':mood==='amused'?'laugh':'welcome';return POSES.map(p=>+(p.id===id));
}
export function landmarks(weights){const out={};for(const key of['head','chest','tail','left','right'])out[key]=[0,1].map(axis=>POSES.reduce((n,p,i)=>n+p[key][axis]*weights[i],0));out.roll=POSES.reduce((n,p,i)=>n+p.roll*weights[i],0);return out;}


for(const[id,faceVisible,faceScale]of[['turn45',.85,.72],['profile',.25,.23],['rear135',0,0],['back',0,0]])POSES.push({id,head:[570,590],chest:[545,940],tail:[560,1380],left:[300,970],right:[790,990],roll:0,faceVisible,faceScale});
BEATS.twirl=[[0,'welcome'],[.4,'turn45'],[.85,'profile'],[1.25,'rear135'],[1.75,'back'],[2.2,'rear135'],[2.65,'profile'],[3.1,'turn45'],[3.6,'welcome']];
BEATS.exit=[[0,'welcome'],[.4,'farewell'],[.85,'turn45'],[1.3,'profile'],[1.8,'rear135'],[2.4,'back'],[3.6,'back']];

BEATS.laugh=[[0,'welcome'],[.25,'laugh'],[1.2,'laugh'],[1.7,'welcome']];
BEATS.shy=[[0,'welcome'],[.4,'listen'],[1.3,'laugh'],[2,'farewell'],[3.2,'welcome']];
BEATS.surprise=[[0,'welcome'],[.25,'laugh'],[.65,'wave'],[1.8,'welcome']];
BEATS.bounce=[[0,'welcome'],[.3,'laugh'],[.8,'wave'],[1.4,'laugh'],[2,'wave'],[3,'welcome']];
BEATS.celebrate=BEATS.dance;
BEATS.peekaboo=[[0,'welcome'],[.4,'listen'],[1,'turn45'],[1.8,'wave'],[2.5,'welcome']];
