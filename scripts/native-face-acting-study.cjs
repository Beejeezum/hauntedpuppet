/** Nondefault visual experiment; intercept only in local proof capture.
 * Same source paint + oral cavity, broader smooth cheeks/jaw displacement.
 * Not human approved or a published runtime change.
 */
exports.transform=function(source){
 const old=`if(p.y<top&&p.y>=u-16.)sy=u-16.+(p.y-u+16.)*16./max(top-u+16.,1.);
if(p.y>bottom&&p.y<=l+36.)sy=l+(p.y-bottom)*36./max(l+36.-bottom,1.);`;
 const next=`// A shared facial field, zero displacement/derivative at its outer edge.
float center=(u+l)*.5;
float broadX=clamp((p.x-mouthLeft+20.)/(mouthWidth+40.),0.,1.);
float cheek=pow(max(0.,sin(broadX*3.14159265)),1.4);
float above=1.-smoothstep(0.,14.,max(0.,center-p.y));
float below=1.-smoothstep(0.,64.,max(0.,p.y-center));
float displacement=opening*cheek*(p.y<center?-3.1*above:10.9*below);
sy=p.y-displacement;`;
 if(!source.includes(old))throw Error('Native face study source changed');
 source=source.replace(old,next);
 // Include the whole influence domain; unchanged outer pixels match the film.
 const bounds='const x=Math.floor(xs[0])-3,y=Math.floor(Math.min(...upper))-20,width=Math.ceil(xs.at(-1))+4-x,height=Math.ceil(Math.max(...lower))+48-y;';
 if(!source.includes(bounds))throw Error('Native face study bounds changed');
 source=source.replace(bounds,'const x=Math.floor(xs[0])-24,y=Math.floor(Math.min(...upper))-48,width=Math.ceil(xs.at(-1))+25-x,height=Math.ceil(Math.max(...lower))+72-y;');
 if(process.env.HAUNT_NATIVE_FACE_SHAPES==='1'){
  source=source.replace('columns,opening;', 'columns,opening,roundness,spread;');
  source=source.replace('vec2 p=uv*size-.5;vec2 lip=', `vec2 p=uv*size-.5;
float mid=mouthLeft+mouthWidth*.5;
vec2 originalLip=lips(p.x);
float verticalInfluence=smoothstep(originalLip.x-8.,originalLip.x-2.,p.y)*(1.-smoothstep(originalLip.y+10.,originalLip.y+35.,p.y));
float influence=(1.-smoothstep(mouthWidth*.5,mouthWidth*.5+22.,abs(p.x-mid)))*verticalInfluence;
float horizontal=1.-.36*roundness+.10*spread;
p.x=mid+(p.x-mid)*mix(1.,1./horizontal,influence);
vec2 lip=`);
  source=source.replace('float gap=14.*opening*profile;', 'float gap=14.*opening*(1.+.60*roundness-.50*spread)*profile;');
  source=source.replace("'columns','opening'].map", "'columns','opening','roundness','spread'].map");
  source=source.replace("g.uniform1f(this.uniforms.opening,Math.min(1,opening));", `g.uniform1f(this.uniforms.opening,Math.min(1,opening));
const weights=this.studyWeights?.()||{},total=(weights.AH||0)+(weights.OO||0)+(weights.EE||0);
g.uniform1f(this.uniforms.roundness,total>0?(weights.OO||0)/total:0);
g.uniform1f(this.uniforms.spread,total>0?(weights.EE||0)/total:0);`);
 }
 return source;
};
