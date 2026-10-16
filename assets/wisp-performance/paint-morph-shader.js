/** Mix premultiplied paintings before source-over compositing, avoiding a gray midpoint.
 * Uses the existing Pixi mesh uniform contract: https://pixijs.com/8.x/guides/components/scene-objects/mesh
 */
export function paintMorphShader(P,cute,evil,foreground=false){
 return new P.Shader({glProgram:P.GlProgram.from({name:'wisp-painted-morph',vertex:`
 in vec2 aPosition;
 in vec2 aUV;
 in float aFrontWeight;
 uniform mat3 uProjectionMatrix;
 uniform mat3 uWorldTransformMatrix;
 uniform mat3 uTransformMatrix;
 uniform vec4 uColor;
 uniform vec4 uWorldColorAlpha;
 out vec2 vUV;
 out vec4 vColor;
 out float vFrontWeight;
 void main(){
  vec3 p=uProjectionMatrix*uWorldTransformMatrix*uTransformMatrix*vec3(aPosition,1.0);
  gl_Position=vec4(p.xy,0.0,1.0);vUV=aUV;vColor=uColor*uWorldColorAlpha;vFrontWeight=aFrontWeight;
 }`,fragment:`
 in vec2 vUV;
 in vec4 vColor;
 in float vFrontWeight;
 uniform sampler2D uCute;
 uniform sampler2D uEvil;
 uniform float uBlend;
 uniform float uForeground;
 out vec4 finalColor;
 void main(){float depth=mix(1.0,smoothstep(0.08,0.70,vFrontWeight),uForeground);finalColor=mix(texture(uCute,vUV),texture(uEvil,vUV),uBlend)*vColor*depth;}
 `}),resources:{uCute:cute.source,uEvil:evil.source,morphUniforms:{uBlend:{value:0,type:'f32'},uForeground:{value:foreground?1:0,type:'f32'}}}});
}
