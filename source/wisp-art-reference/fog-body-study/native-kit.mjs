// Explicit local character kit. Not approved for evil/morph or public default use.
import {paintedAreaConstraints,correctAreas} from './area-corrective.mjs';
import {eyeTurnSurface} from './eye-turn-surface.mjs';
import {armVolumeFloor} from './pose-volume.mjs';
export async function createFogStudyKit({pairedArms=false,implicitHands=false}={}){
 if(implicitHands&&!pairedArms)throw Error('Implicit hand pilot requires registered paired art');
 const url=file=>new URL(file,import.meta.url).href;
 const response=await fetch(url('arm-left-raised-rig.json'));if(!response.ok)throw Error('Fog arm registration unavailable');
 const binding=await response.json(),mirror=p=>[binding.sourceSize[0]-p[0],p[1]];
 const registration=pairedArms?await import('./arm-registration.mjs'):null,reports=[],shapeReports=[];let registered;
 const createArmShader=implicitHands?(await import('./implicit-hand-shader.mjs')).implicitHandShaderFactory(shapeReports):undefined;
 return {
  id:'fog-cute-study',createArmShader,shapeReports,eyeSurface:eyeTurnSurface,base:url('./'),bodyBase:url('./'),handScale:.95,
  images:{body:url('body.png'),'arm-left':url(binding.source),'arm-right':url(binding.source),'arm-left-evil':pairedArms?url('arm-left-evil-fog-v1.png'):'/assets/wisp-performance/front-kit/arm-left-evil.png','arm-right-evil':pairedArms?url('arm-left-evil-fog-v1.png'):'/assets/wisp-performance/front-kit/arm-right-evil.png'},
  mirrorImages:pairedArms?['arm-right','arm-right-evil']:['arm-right'],registrationReports:reports,
  preparePainting(name,image){if(!pairedArms||!name.endsWith('-evil'))return image;if(!registered){registered=registration.registerPainting(image,registration.EVIL_POINTS,registration.CUTE_POINTS);reports.push(registered.registrationReport);}const copy=document.createElement('canvas');copy.width=registered.width;copy.height=registered.height;copy.getContext('2d').drawImage(registered,0,0);return copy;},
  arms:{left:structuredClone(binding.arm),right:{...structuredClone(binding.arm),pivot:mirror(binding.arm.pivot),attach:[640,870],rotation:-binding.arm.rotation,joints:binding.arm.joints.map(mirror)}},
  digits:{left:structuredClone(binding.digits),right:binding.digits.map(d=>({...d,root:mirror(d.root),tip:mirror(d.tip)}))},
  prepareArm(g,image,side,evil){if(!pairedArms)return paintedAreaConstraints(g,image);const union=document.createElement('canvas');union.width=image.width;union.height=image.height;const ctx=union.getContext('2d');ctx.drawImage(image,0,0);ctx.globalCompositeOperation='lighter';ctx.drawImage(evil,0,0,image.width,image.height);return paintedAreaConstraints(g,union);},
  transformBone(bone,{index,joints}){
   if(index===2)return bone;const width=Math.max(bone.width,armVolumeFloor(joints));
   return {...bone,width,m00:bone.tx*bone.scale*bone.sx+bone.ty*width*bone.sy,m01:bone.tx*bone.scale*bone.sy-bone.ty*width*bone.sx,m10:bone.ty*bone.scale*bone.sx-bone.tx*width*bone.sy,m11:bone.ty*bone.scale*bone.sy+bone.tx*width*bone.sx};
  },
  deformArm(vertices,{arm}){correctAreas(vertices,arm.corrective);}
 };
}
