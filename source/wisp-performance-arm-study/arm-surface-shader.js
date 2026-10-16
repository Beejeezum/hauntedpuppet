import {SPIRIT_FRAGMENT,spiritUniforms} from '../../assets/wisp-performance/spirit-flow.js';
/** Experimental single-paint material. Same premultiplied coverage partition as production,
 * with the production front crossover and hand readability protected independently of the shoulder.
 */
export function armSurfaceShader(P,painting,foreground=false){return new P.Shader({glProgram:P.GlProgram.from({name:'wisp-arm-surface-study',vertex:`
 in vec2 aPosition;in vec2 aUV;in float aFrontWeight;
 uniform mat3 uProjectionMatrix;uniform mat3 uWorldTransformMatrix;uniform mat3 uTransformMatrix;
 uniform vec4 uColor;uniform vec4 uWorldColorAlpha;
 out vec2 vUV;out vec4 vColor;out float vFrontWeight;
 void main(){vec3 p=uProjectionMatrix*uWorldTransformMatrix*uTransformMatrix*vec3(aPosition,1.0);gl_Position=vec4(p.xy,0.,1.);vUV=aUV;vColor=uColor*uWorldColorAlpha;vFrontWeight=aFrontWeight;}
 `,fragment:`
 ${SPIRIT_FRAGMENT}
 in vec2 vUV;in vec4 vColor;in float vFrontWeight;
 uniform sampler2D uPainting;uniform float uForeground;uniform float uFrontAmount;
 out vec4 finalColor;
 void main(){vec4 ink=texture(uPainting,vUV);float transmission=spiritTransmission(vUV,ink);
 transmission=mix(transmission,max(transmission,.90),smoothstep(.65,1.,vFrontWeight));
 vec4 painted=ink*vColor*transmission*smoothstep(0.,.18,vFrontWeight);
 float front=smoothstep(.08,.70,vFrontWeight)*uFrontAmount;
 float rear=(1.-front)/max(.001,1.-painted.a*front);
 finalColor=painted*mix(rear,front,uForeground);}
 `}),resources:{uPainting:painting.source,spiritUniforms:spiritUniforms(1),morphUniforms:{uForeground:{value:foreground?1:0,type:'f32'},uFrontAmount:{value:1,type:'f32'}}}});}
