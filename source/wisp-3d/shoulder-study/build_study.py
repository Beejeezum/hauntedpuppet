"""Localized anatomical support correction; isolated candidate, original rig untouched."""
import bpy,pathlib,json,math,hashlib,struct
from mathutils import Vector
HERE=pathlib.Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE.parent/'material-study/Wisp-material-study.blend'))
body=bpy.data.objects['Wisp_Skin'];rig=bpy.data.objects['Wisp_Rig'];groups={g.index:g.name for g in body.vertex_groups};by_name={g.name:g for g in body.vertex_groups}
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def distance(point,bone):
 a=bone.head_local;b=bone.tail_local;d=b-a;t=max(0,min(1,(point-a).dot(d)/d.length_squared));return(point-a-d*t).length
def weights(v):return{groups[g.group]:g.weight for g in v.groups if g.weight>0}
def arm_amount(w):return sum(value for name,value in w.items() if name.startswith(('UpperArm','Forearm','Hand','Digit')))
def jumps():
 values=[arm_amount(weights(v)) for v in body.data.vertices];d=[]
 for edge in body.data.edges:
  a,b=[body.data.vertices[i] for i in edge.vertices]
  if all(1.15<v.co.z<2.2 and abs(v.co.x)<.8 for v in[a,b]):d.append(abs(values[a.index]-values[b.index]))
 return {'maximum':max(d),'edgesAboveQuarter':sum(x>.25 for x in d),'edgesAboveHalf':sum(x>.5 for x in d)}
before=jumps();modified=0;max_merged=0;prune_cases=[]
for vertex in body.data.vertices:
 x,y,z=vertex.co;ax=abs(x);region=(1-smooth(.55,.66,ax))*smooth(1.0,1.1,z)*(1-smooth(2.15,2.25,z))
 old=weights(vertex);old_arm=arm_amount(old)
 if region<=0 or old_arm<1e-8:continue
 side='L' if x<0 else 'R'
 nearest=min(distance(vertex.co,rig.data.bones[name+'_'+side]) for name in['UpperArm','Forearm'])
 waist_guard=smooth(.46,.56,ax)+(1-smooth(.46,.56,ax))*smooth(1.30,1.43,z)
 support=(1-smooth(.12,.30,nearest))*smooth(.34,.68,ax)*waist_guard
 amount=old_arm*(1-region+region*support)
 body_raw={name:math.exp(-distance(vertex.co,rig.data.bones[name])**2/.3**2) for name in['Torso','Head']};total=sum(body_raw.values());body_raw={name:value/total for name,value in body_raw.items()}
 updated={name:value*amount/old_arm for name,value in old.items() if name.startswith(('UpperArm','Forearm','Hand','Digit'))}
 updated.update({name:(1-amount)*value for name,value in body_raw.items()})
 full=updated.copy();merged=0
 while len(updated)>4:
  candidates=[name for name in updated if rig.data.bones[name].parent and rig.data.bones[name].parent.name in updated]
  name=min(candidates,key=lambda n:updated[n]);value=updated.pop(name);updated[rig.data.bones[name].parent.name]+=value;merged+=value
 max_merged=max(max_merged,merged)
 kept=list(updated.items());normalizer=sum(value for _,value in kept)
 if merged:prune_cases.append((vertex.co.copy(),full,updated.copy()))
 for index in [g.group for g in vertex.groups]:body.vertex_groups[index].remove([vertex.index])
 for name,value in kept:by_name[name].add([vertex.index],value/normalizer,'REPLACE')
 modified+=1
after=jumps();max_prune_error=0
for upper in[-1.5,0,1.5]:
 for lower in[-1,0,1]:
  for bone in rig.pose.bones:bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0)
  for side,sign in[('L',1),('R',-1)]:
   rig.pose.bones['UpperArm_'+side].rotation_euler.z=upper*sign;rig.pose.bones['Forearm_'+side].rotation_euler.z=lower*sign
  rig.pose.bones['Torso'].rotation_euler.z=.2;rig.pose.bones['Head'].rotation_euler.z=-.2
  bpy.context.view_layer.update();evaluated=rig.evaluated_get(bpy.context.evaluated_depsgraph_get());matrices={bone.name:bone.matrix@bone.bone.matrix_local.inverted() for bone in evaluated.pose.bones}
  for point,full,pruned in prune_cases:
   delta=Vector((0,0,0))
   for name in set(full)|set(pruned):delta+=(matrices[name]@point)*(full.get(name,0)-pruned.get(name,0))
   max_prune_error=max(max_prune_error,delta.length)
assert max_prune_error<.005,('Four-influence merge displaced surface too far',max_prune_error)
for bone in rig.pose.bones:bone.rotation_euler=(0,0,0)
bpy.context.view_layer.update()
for track in rig.animation_data.nla_tracks:track.mute=True
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'Wisp-shoulder-study.blend'))
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.ops.export_scene.gltf(filepath=str(HERE/'wisp-shoulder-study.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_morph=True,export_morph_normal=True,export_normals=True,export_yup=True,export_cameras=False,export_lights=False)
report={'modifiedVertices':modified,'before':before,'after':after,'maximumMergedInfluence':max_merged,'maximumMergePositionError':max_prune_error,'mergePoseCases':9,'scope':'Localized source shoulder weighting; visual/deformation acceptance required'}
(HERE/'build-validation.json').write_text(json.dumps(report,indent=2)+'\n');print('SHOULDER_STUDY',json.dumps(report))
