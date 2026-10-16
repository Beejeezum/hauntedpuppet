/** Continuous local skin motion and premultiplied transmission. No screen overlay. */
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function spiritOffset(x,y,time,energy=1){
 const lower=smooth(720,1380,y),crest=1-smooth(230,430,y),phase=time*1.18-(y-720)*.0048;
 const bend=lower*lower*(48*Math.sin(phase)+18*Math.sin(time*.67-y*.006));
 const expansion=lower*.085*Math.sin(time*1.3-y*.005);
 return[energy*(bend+(x-512)*expansion+crest*10*Math.sin(time*1.25-y*.006)),energy*lower*9*Math.sin(phase-.8)];
}
export function spiritUniforms(zone=0){return{uSpiritTime:{value:0,type:'f32'},uSpiritStrength:{value:0,type:'f32'},uSpiritZone:{value:zone,type:'f32'}};}
export const SPIRIT_FRAGMENT=`
 uniform float uSpiritTime;
 uniform float uSpiritStrength;
 uniform float uSpiritZone;
 float spiritTransmission(vec2 p,vec4 ink){
  float lower=mix(smoothstep(0.38,0.93,p.y),0.48,uSpiritZone);
  float ribbon=0.5+0.5*sin(p.y*18.0-uSpiritTime*0.95+sin(p.x*9.0+uSpiritTime*0.42)*1.3);
  float lace=smoothstep(0.35,0.90,ribbon);
  float edge=abs(p.x-0.5)*2.0;
  float transmission=clamp(0.94-lower*0.40-lower*0.28*lace-edge*0.07,0.20,0.94);
  float cyan=clamp((ink.b-ink.r)/max(ink.a,0.001)*2.0,0.0,1.0);
  transmission=mix(transmission,max(transmission,0.82),cyan*0.8);
  return mix(1.0,transmission,uSpiritStrength);
 }
`;
