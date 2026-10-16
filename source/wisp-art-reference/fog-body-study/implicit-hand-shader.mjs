import {SPIRIT_FRAGMENT,spiritUniforms} from '/assets/wisp-performance/spirit-flow.js';
import {paintedDistanceTexture} from './hand-distance-field.mjs';
/** Experimental implicit contour blend; painted color and low-density fog survive.
 * Not a guarantee of finger topology, anatomical volume or continuous acting.
 */
export function implicitHandShaderFactory(reports=[]){
 const pairs=new WeakMap();
 return(P,cute,evil,foreground,{image,evilImage})=>{
  let pair=pairs.get(cute);if(!pair){const start=performance.now();pair={a:paintedDistanceTexture(P,image),b:paintedDistanceTexture(P,evilImage),references:0};pairs.set(cute,pair);reports.push({prepareMs:performance.now()-start,size:[image.width,image.height],range:64});}pair.references++;
  const shader=new P.Shader({glProgram:P.GlProgram.from({name:'wisp-implicit-hand-morph',vertex:`
 in vec2 aPosition;in vec2 aUV;in float aFrontWeight;
 uniform mat3 uProjectionMatrix;uniform mat3 uWorldTransformMatrix;uniform mat3 uTransformMatrix;uniform vec4 uColor;uniform vec4 uWorldColorAlpha;
 out vec2 vUV;out vec4 vColor;out float vFrontWeight;
 void main(){vec3 p=uProjectionMatrix*uWorldTransformMatrix*uTransformMatrix*vec3(aPosition,1.0);gl_Position=vec4(p.xy,0.,1.);vUV=aUV;vColor=uColor*uWorldColorAlpha;vFrontWeight=aFrontWeight;}
 `,fragment:`${SPIRIT_FRAGMENT}
 in vec2 vUV;in vec4 vColor;in float vFrontWeight;
 uniform sampler2D uCute;uniform sampler2D uEvil;uniform sampler2D uCuteShape;uniform sampler2D uEvilShape;
 uniform float uBlend;uniform float uForeground;uniform float uFrontAmount;uniform float uShapeRange;uniform float uFeather;
 out vec4 finalColor;
 void main(){
  vec4 a=texture(uCute,vUV),b=texture(uEvil,vUV),ink=mix(a,b,uBlend);
  float weight=smoothstep(0.,.15,uBlend)*smoothstep(0.,.15,1.-uBlend);
  if(weight>0.00001){
   float da=(texture(uCuteShape,vUV).a-.5)*2.*uShapeRange,db=(texture(uEvilShape,vUV).a-.5)*2.*uShapeRange;
   float contour=smoothstep(-uFeather,uFeather,mix(da,db,uBlend));
   // Coverage-weighted unassociated paint avoids importing the shadow/color
   // of a mostly empty endpoint into the currently solid finger.
   vec3 color=ink.rgb/max(.001,ink.a);
   float alpha=max(contour*max(a.a,b.a),min(ink.a,.06));
   ink=mix(ink,vec4(clamp(color,0.,1.)*alpha,alpha),weight);
  }
  vec4 painted=ink*vColor*spiritTransmission(vUV,ink)*smoothstep(0.,.18,vFrontWeight);
  float front=smoothstep(.08,.70,vFrontWeight)*uFrontAmount,rear=(1.-front)/max(.001,1.-painted.a*front);
  finalColor=painted*mix(rear,front,uForeground);
 }
 `}),resources:{uCute:cute.source,uEvil:evil.source,uCuteShape:pair.a.source,uEvilShape:pair.b.source,spiritUniforms:spiritUniforms(1),morphUniforms:{uBlend:{value:0,type:'f32'},uForeground:{value:foreground?1:0,type:'f32'},uFrontAmount:{value:0,type:'f32'}},shapeUniforms:{uShapeRange:{value:64,type:'f32'},uFeather:{value:10,type:'f32'}}}});
  const destroy=shader.destroy.bind(shader);let closed=false;shader.destroy=(...args)=>{if(closed)return;closed=true;destroy(...args);if(--pair.references===0){pair.a.destroy(true);pair.b.destroy(true);}};
  return shader;
 };
}
