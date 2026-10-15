// Approximate semantic gesture timing over the actual audio duration. Mouth cues remain phoneme aligned.
export function buildActingCues(text='',duration=0,visemes=[]){
 const voiced=visemes.filter(c=>c.shape!=='rest'&&c.end>c.start),voicedDuration=voiced.reduce((n,c)=>n+c.end-c.start,0);const speechTime=f=>{if(!voicedDuration)return duration*f;let left=f*voicedDuration;for(const c of voiced){if(left<=c.end-c.start)return c.start+left;left-=c.end-c.start}return voiced.at(-1).end};
 const words=text.match(/[\w’'-]+[!?.,…:]*/g)||[],total=words.reduce((s,w)=>s+w.length+2,0)||1;let weight=0;const cues=[];
 for(const word of words){const at=speechTime((weight+(word.length+2)*.35)/total);weight+=word.length+2;let kind=null;
 if(/^(hello|hi|hey|welcome|greetings)\b/i.test(word))kind='greet';
 else if(/[?]/.test(word)||/^(what|why|how|who|where|really)\b/i.test(word))kind='question';
 else if(/^(wow|wonderful|wonderfully|amazing|yay|candy|love|fun|great)\b/i.test(word))kind='delight';
 else if(/^(no|never|not|don't|stop)\b/i.test(word))kind='no';
 else if(/^(boo|beware|haunt|scary|spooky)\b/i.test(word))kind='spooky';
 if(kind&&(!cues.length||at-cues[cues.length-1].at>.65))cues.push({at,kind});
 }
 let previous=-1;for(const c of visemes)if(['A','E','O'].includes(c.shape)&&c.start-previous>.34){cues.push({at:c.start,kind:'beat'});previous=c.start}
 return cues.sort((a,b)=>a.at-b.at);
}
const moodPoses={neutral:{wide:.04,brow:.08,tilt:0,arms:.05},curious:{wide:.20,brow:.40,tilt:.09,arms:.23},amused:{wide:.12,brow:.24,tilt:-.04,arms:.45},sinister:{wide:-.12,brow:-.18,tilt:-.07,arms:.15},angry:{wide:-.18,brow:-.38,tilt:.03,arms:.36}};
export function actingPose(cues,at,mood='neutral',intensity=.5,speaking=false){
 const base=moodPoses[mood]||moodPoses.neutral,k=.45+.55*intensity,p={wide:base.wide*k,brow:base.brow*k,tilt:base.tilt*k,left:base.arms*k,right:base.arms*k,nod:0,round:0,beat:0};if(!speaking){p.left*=.18;p.right*=.18;return p}
 for(const c of cues){const t=at-c.at;if(t<-.18||t>1.1)continue;const pulse=t<0?Math.sin((t+.18)/.18*Math.PI/2)**2:Math.exp(-t*3.7)*(1-Math.exp(-(t+.18)*15));
 if(c.kind==='beat'){p.beat+=pulse*.28;p.nod+=pulse*.035;continue}
 const v=pulse*k;
 if(c.kind==='greet'){p.right+=v*1.35;p.left+=v*.3;p.wide+=v*.22;p.brow+=v*.4;p.tilt-=v*.10}
 if(c.kind==='question'){p.left+=v*.85;p.right+=v*.38;p.brow+=v*.65;p.wide+=v*.26;p.tilt+=v*.14}
 if(c.kind==='delight'){p.left+=v*1.05;p.right+=v*1.05;p.wide+=v*.38;p.brow+=v*.4;p.nod-=v*.055}
 if(c.kind==='no'){p.right+=v*.8;p.tilt+=Math.sin(t*12)*v*.10;p.brow-=v*.16}
 if(c.kind==='spooky'){p.left+=v*.65;p.right+=v*.65;p.tilt-=v*.08;p.brow+=v*.22}
 }
 p.left+=p.beat*.7;p.right+=p.beat;p.wide=Math.max(-.25,Math.min(.65,p.wide));p.brow=Math.max(-.5,Math.min(.9,p.brow));p.left=Math.min(1.55,p.left);p.right=Math.min(1.55,p.right);return p;
}
