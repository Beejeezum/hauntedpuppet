import {createFogStudyKit} from './native-kit.mjs';
import {createEvilTurnContext} from './evil-turn-context.mjs';
import {eyeTurnSurface} from './eye-turn-surface.mjs';
// Local art candidate only; never selected by the public app.
export async function createTurnStudyKit(){
 const kit=await createFogStudyKit({pairedArms:true,implicitHands:true});
 kit.createBodyViews=P=>createEvilTurnContext(P);
 kit.shoulderPoint=({side,attach,bodyViews})=>bodyViews.shoulderSurface(side,attach[1]);
 kit.eyeSurface=(angle,side)=>eyeTurnSurface(angle,side,15);
 kit.eyeMaterial=value=>{const u=Math.max(0,Math.min(1,(value-.4)/.6));return u*u*(3-2*u);};
 kit.mouthPerspective=angle=>Math.max(.08,Math.cos(angle*Math.PI/180));
 return kit;
}
