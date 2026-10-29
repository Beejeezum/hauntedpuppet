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
float above=1.-smoothstep(0.,42.,max(0.,center-p.y));
float below=1.-smoothstep(0.,64.,max(0.,p.y-center));
float displacement=opening*cheek*(p.y<center?-3.1*above:10.9*below);
sy=p.y-displacement;`;
 if(!source.includes(old))throw Error('Native face study source changed');
 source=source.replace(old,next);
 // Include the whole influence domain; unchanged outer pixels match the film.
 const bounds='const x=Math.floor(xs[0])-3,y=Math.floor(Math.min(...upper))-20,width=Math.ceil(xs.at(-1))+4-x,height=Math.ceil(Math.max(...lower))+48-y;';
 if(!source.includes(bounds))throw Error('Native face study bounds changed');
 return source.replace(bounds,'const x=Math.floor(xs[0])-24,y=Math.floor(Math.min(...upper))-48,width=Math.ceil(xs.at(-1))+25-x,height=Math.ceil(Math.max(...lower))+72-y;');
};
