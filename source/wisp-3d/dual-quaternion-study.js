/** Local GPU skinning experiment; never enabled by the live runtime.
 * Rigid bone transforms only. Original implementation of normalized dual-quaternion
 * blending; preserves existing morph targets and material hooks. No new dependency.
 */
const helpers=`
#ifdef USE_SKINNING
vec4 wispQmul(vec4 a,vec4 b){return vec4(a.w*b.xyz+b.w*a.xyz+cross(a.xyz,b.xyz),a.w*b.w-dot(a.xyz,b.xyz));}
vec4 wispRotation(mat4 m){
 float trace=m[0][0]+m[1][1]+m[2][2];vec4 q;
 if(trace>0.){float s=2.*sqrt(trace+1.);q=vec4((m[1][2]-m[2][1])/s,(m[2][0]-m[0][2])/s,(m[0][1]-m[1][0])/s,.25*s);}
 else if(m[0][0]>m[1][1]&&m[0][0]>m[2][2]){float s=2.*sqrt(1.+m[0][0]-m[1][1]-m[2][2]);q=vec4(.25*s,(m[1][0]+m[0][1])/s,(m[2][0]+m[0][2])/s,(m[1][2]-m[2][1])/s);}
 else if(m[1][1]>m[2][2]){float s=2.*sqrt(1.+m[1][1]-m[0][0]-m[2][2]);q=vec4((m[1][0]+m[0][1])/s,.25*s,(m[2][1]+m[1][2])/s,(m[2][0]-m[0][2])/s);}
 else{float s=2.*sqrt(1.+m[2][2]-m[0][0]-m[1][1]);q=vec4((m[2][0]+m[0][2])/s,(m[2][1]+m[1][2])/s,.25*s,(m[0][1]-m[1][0])/s);}
 return normalize(q);
}
vec3 wispRotate(vec4 q,vec3 p){return p+2.*cross(q.xyz,cross(q.xyz,p)+q.w*p);}
void wispAccumulate(mat4 matrix,float weight,vec4 reference,inout vec4 real,inout vec4 dual){
 vec4 q=wispRotation(matrix);weight*=dot(q,reference)<0.?-1.:1.;
 real+=weight*q;dual+=weight*.5*wispQmul(vec4(matrix[3].xyz,0.),q);
}
#endif
`;
const blend=`
#include <skinbase_vertex>
#ifdef USE_SKINNING
vec4 wispReal=vec4(0.),wispDual=vec4(0.),wispReference=wispRotation(bindMatrixInverse*boneMatX*bindMatrix);
wispAccumulate(bindMatrixInverse*boneMatX*bindMatrix,skinWeight.x,wispReference,wispReal,wispDual);
wispAccumulate(bindMatrixInverse*boneMatY*bindMatrix,skinWeight.y,wispReference,wispReal,wispDual);
wispAccumulate(bindMatrixInverse*boneMatZ*bindMatrix,skinWeight.z,wispReference,wispReal,wispDual);
wispAccumulate(bindMatrixInverse*boneMatW*bindMatrix,skinWeight.w,wispReference,wispReal,wispDual);
float wispNorm=max(length(wispReal),.000001);wispReal/=wispNorm;wispDual/=wispNorm;wispDual-=wispReal*dot(wispReal,wispDual);
#endif
`;
const skin=`
#ifdef USE_SKINNING
vec3 wispPosition=transformed;
vec3 wispTranslation=2.*(wispReal.w*wispDual.xyz-wispDual.w*wispReal.xyz+cross(wispReal.xyz,wispDual.xyz));
transformed=wispRotate(wispReal,wispPosition)+wispTranslation;
#endif
`;
const normal=`
#ifdef USE_SKINNING
objectNormal=wispRotate(wispReal,objectNormal);
#ifdef USE_TANGENT
objectTangent=wispRotate(wispReal,objectTangent);
#endif
#endif
`;
export function enableDualQuaternionStudy(material){
 const previous=material.onBeforeCompile,cache=material.customProgramCacheKey;
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  for(const chunk of['skinning_pars_vertex','skinbase_vertex','skinning_vertex','skinnormal_vertex'])if(!shader.vertexShader.includes('#include <'+chunk+'>'))throw Error('Unsupported skin shader: '+chunk);
  shader.vertexShader=shader.vertexShader.replace('#include <skinning_pars_vertex>','#include <skinning_pars_vertex>\n'+helpers).replace('#include <skinbase_vertex>',blend).replace('#include <skinning_vertex>',skin).replace('#include <skinnormal_vertex>',normal);
 };
 material.customProgramCacheKey=function(){return cache.call(this)+'-dq-study-v1';};material.needsUpdate=true;
 let restored=false;return()=>{if(restored)return;restored=true;material.onBeforeCompile=previous;material.customProgramCacheKey=cache;material.needsUpdate=true;};
}
// Expose the exact chunks for isolated WebGL transform-feedback verification.
export const DQStudyChunks={helpers,blend,skin,normal};
