"""Editable Wisp sculpt, shared-topology shape keys and weighted armature.
Run with Blender 4.5 --background --python source/wisp-3d/build_wisp.py.
Original painted texture sources are preserved, not raster-edited.
"""
import bpy, math, json, pathlib
from mathutils import Vector, Euler
from math import sin, cos, pi, exp
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/wisp-3d'; OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.65):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;return m
skin=mat('Painted ivory spirit',(1,.91,.76));p=skin.node_tree.nodes.get('Principled BSDF');p.inputs['Subsurface Weight'].default_value=.12
tex=skin.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'assets/wisp-v2/cute-body-core.png'));skin.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
white=mat('Porcelain eye whites',(.97,.98,1),.22);ink=mat('Deep indigo mouth',(.009,.015,.038),.6);browmat=mat('Expressive brows',(.105,.065,.05));lip=mat('Warm ivory lip',(.97,.86,.70));tooth=mat('Ivory fangs',(1,.96,.82),.32);pupilmat=mat('Deep blue pupils',(.002,.008,.022),.1);shine=mat('Corneal catchlight',(1,1,1),.12)
irismat=mat('Original painted blue iris',(1,1,1),.3);it=irismat.node_tree.nodes.new('ShaderNodeTexImage');it.image=bpy.data.images.load(str(ROOT/'assets/wisp-v2/cute-optics.png'));irismat.node_tree.links.new(it.outputs['Color'],irismat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
def mesh(name,verts,faces,material):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.data.materials.append(material)
 for f in me.polygons:f.use_smooth=True
 return o
def tube(name,points,material=skin,rings=14):
 # Parallel-frame circular sections produce genuine rounded volumes.
 verts=[];faces=[]
 for i,(co,radius) in enumerate(points):
  co=Vector(co);t=Vector(points[min(i+1,len(points)-1)][0])-Vector(points[max(0,i-1)][0]);t.normalize();u=t.cross(Vector((0,1,0))).normalized();v=t.cross(u).normalized()
  for j in range(rings):verts.append(co+radius*(u*cos(j*2*pi/rings)+v*sin(j*2*pi/rings)))
 for i in range(len(points)-1):
  for j in range(rings):a=i*rings+j;b=i*rings+(j+1)%rings;faces.append((a,b,b+rings,a+rings))
 faces+=[tuple(reversed(range(rings))),tuple((len(points)-1)*rings+j for j in range(rings))]
 return mesh(name,verts,faces,material)
def cat(a,b,c,d,t):return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)
keys=[(.08,.24,.025,.025),(.20,.32,.07,.06),(.38,.13,.16,.11),(.62,-.08,.25,.17),(.92,-.02,.32,.23),(1.22,.05,.37,.28),(1.55,0,.43,.33),(1.82,0,.49,.38),(2.05,0,.60,.42),(2.30,0,.68,.44),(2.55,0,.58,.40),(2.79,0,.46,.32),(3.02,.04,.34,.24),(3.23,.17,.23,.16),(3.43,.21,.14,.10),(3.57,.13,.08,.055),(3.64,.015,.025,.02)]
verts=[];faces=[];segments=64
for i in range(len(keys)-1):
 for step in range(5):
  vals=[cat(keys[max(0,i-1)][k],keys[i][k],keys[i+1][k],keys[min(len(keys)-1,i+2)][k],step/5)for k in range(4)];z,cx,rx,ry=vals
  for j in range(segments):a=j*2*pi/segments;verts.append((cx+rx*cos(a),ry*sin(a),z))
rows=len(verts)//segments
for i in range(rows-1):
 for j in range(segments):a=i*segments+j;b=i*segments+(j+1)%segments;faces.append((a,b,b+segments,a+segments))
faces+=[tuple(reversed(range(segments))),tuple((rows-1)*segments+j for j in range(segments))]
body=mesh('Wisp_Skin',verts,faces,skin);parts=[body];bone_specs=[('Root',(0,0,0),(0,0,.25),None),('Torso',(0,0,1.15),(0,0,1.8),'Root'),('Head',(0,0,1.8),(0,0,2.75),'Torso'),('Crest_1',(0,0,2.75),(.14,0,3.25),'Head'),('Crest_2',(.14,0,3.25),(.02,0,3.64),'Crest_1'),('Tail_1',(0,0,1.15),(-.06,0,.7),'Torso'),('Tail_2',(-.06,0,.7),(.16,0,.3),'Tail_1'),('Tail_Tip',(.16,0,.3),(.24,0,.08),'Tail_2')]
parts.append(tube('CrestCurl',[((.035,0,3.57),.045),((-.07,0,3.65),.04),((-.18,0,3.63),.032),((-.23,0,3.56),.02),((-.18,0,3.52),.009)]));parts.append(tube('TailCurl',[((.19,0,.31),.075),((.31,0,.18),.06),((.28,0,.07),.047),((.16,0,.04),.032),((.12,0,.12),.02),((.19,0,.17),.009)]));fingerlines={}
def hand_rest(co):
 x,y,z=co;t=max(0,min(1,(abs(x)-.35)/.75));return (x,y-.12*t if x<0 else y,z+(.08 if x<0 else -.20)*t)
for side,sign in [('L',-1),('R',1)]:
 pts=[((sign*.31,0,1.73),.155),((sign*.49,-.015,1.60),.15),((sign*.70,-.02,1.48),.13),((sign*.88,-.045,1.50),.13),((sign*1.04,-.07,1.52),.17)]
 pts=[(hand_rest(co),r)for co,r in pts];parts.append(tube('Arm_'+side,pts));bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=hand_rest((sign*1.09,-.07,1.52)));palm=bpy.context.object;palm.scale=(.18,.13,.19);bpy.ops.object.transform_apply(location=True,rotation=False,scale=True);parts.append(palm);bone_specs.extend([('UpperArm_'+side,pts[0][0],pts[2][0],'Torso'),('Forearm_'+side,pts[2][0],pts[3][0],'UpperArm_'+side),('Hand_'+side,pts[3][0],pts[4][0],'Forearm_'+side)])
 for n,points in enumerate([[(1.04,-.07,1.60),(1.13,-.08,1.77),(1.24,-.09,1.83),(1.31,-.09,1.79)],[(1.12,-.07,1.58),(1.29,-.08,1.72),(1.41,-.09,1.75),(1.46,-.09,1.69)],[(1.13,-.07,1.49),(1.32,-.08,1.59),(1.44,-.09,1.60),(1.48,-.09,1.54)],[(1.07,-.07,1.42),(1.13,-.17,1.30),(1.24,-.21,1.32),(1.27,-.21,1.40)]]):
  points=[hand_rest((x*sign,y,z))for x,y,z in points];samples=[]
  for i in range(len(points)-1):
   for step in range(4):
    t=step/4;co=cat(Vector(points[max(0,i-1)]),Vector(points[i]),Vector(points[i+1]),Vector(points[min(len(points)-1,i+2)]),t);f=(i+t)/(len(points)-1);samples.append((co,.082-.026*f))
  samples.append((points[-1],.056));parts.append(tube('Finger',samples,rings=16));bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=12,location=points[-1],radius=.057);parts.append(bpy.context.object);name='Digit%d_%s'%(n,side);bone_specs.append((name,points[0],points[-1],'Hand_'+side));fingerlines[name]=points
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.object.join();rem=body.modifiers.new('Continuous sculpted skin','REMESH');rem.mode='VOXEL';rem.voxel_size=.020;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
sm=body.modifiers.new('Sculpt polish','SMOOTH');sm.factor=.85;sm.iterations=4;bpy.ops.object.modifier_apply(modifier=sm.name)
dec=body.modifiers.new('Runtime topology','DECIMATE');dec.ratio=.58;bpy.ops.object.modifier_apply(modifier=dec.name)
for face in body.data.polygons:face.use_smooth=True
# Project the approved face-free painting onto the curved sculpt. Alpha-row
# analysis picks the painted body, never its transparent surrounding pixels.
uv=body.data.uv_layers.new(name='PaintedSkinUV');iw,ih=tex.image.size;pixels=list(tex.image.pixels);row_bounds={}
for row in range(ih):
 solid=[x for x in range(iw)if pixels[(row*iw+x)*4+3]>.55]
 row_bounds[row]=(solid[0],solid[-1])if solid else(iw*.4,iw*.6)
for loop in body.data.loops:
 co=body.data.vertices[loop.vertex_index].co;z=max(.08,min(3.64,co.z));row=int(max(0,min(ih-1,ih-1-(47+(3.64-z)/3.56*1425))));lo,hi=row_bounds[row]
 segment=next((i for i in range(len(keys)-1)if keys[i][0]<=z<=keys[i+1][0]),len(keys)-2);a,b=keys[segment],keys[segment+1];t=max(0,min(1,(z-a[0])/(b[0]-a[0])));cx=a[1]+(b[1]-a[1])*t;rx=a[2]+(b[2]-a[2])*t;u=(lo+hi)/2+max(-.82,min(.82,(co.x-cx)/max(.06,rx)))*(hi-lo)*.5
 arm=max(0,min(1,(abs(co.x)-.45)/.35))*max(0,min(1,(2-co.z)/.2));u=u*(1-arm)+(iw*.5+(abs(co.x)-1.05)*24)*arm;row=row*(1-arm)+(ih-600)*arm;uv.data[loop.index].uv=(u/iw,row/ih)
# Armature: all appendages remain genuinely skinned, including four finger controls per hand.
armdata=bpy.data.armatures.new('Wisp shared skeleton');arm=bpy.data.objects.new('Wisp_Rig',armdata);bpy.context.collection.objects.link(arm);bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,a,b,parent in bone_specs:
 bone=armdata.edit_bones.new(name);bone.head=a;bone.tail=b
 if parent:bone.parent=armdata.edit_bones[parent]
for side,sign in [('L',-1),('R',1)]:
 bone=armdata.edit_bones.new('Eye_'+side);bone.head=(sign*.28,-.325,2.44);bone.tail=(sign*.28,-.55,2.44);bone.parent=armdata.edit_bones['Head']
bpy.ops.object.mode_set(mode='OBJECT');arm.show_in_front=True

def attach(o,bone='Head'):
 group=o.vertex_groups.new(name=bone);group.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('Wisp shared armature','ARMATURE');mod.object=arm;o.parent=arm

def dist_segment(p,a,b):
 a,b=Vector(a),Vector(b);d=b-a;t=max(0,min(1,(p-a).dot(d)/d.length_squared));return(p-a-t*d).length
for name,*_ in bone_specs:body.vertex_groups.new(name=name)
for v in body.data.vertices:
 x,y,z=v.co;side='L'if x<0 else'R'
 if abs(x)>.42 and z<1.98:names=['Torso','UpperArm_'+side,'Forearm_'+side,'Hand_'+side]+[n for n in fingerlines if n.endswith(side)]
 elif z>2.7:names=['Head','Crest_1','Crest_2']
 elif z<1.15:names=['Torso','Tail_1','Tail_2','Tail_Tip']
 else:names=['Torso','Head']
 ranked=[]
 for n,a,b,parent in bone_specs:
  if n in names:ranked.append((dist_segment(v.co,a,b),n))
 ranked.sort();values=[(n,exp(-d*d/(.13 if z<1.98 and abs(x)>.42 else .3)**2))for d,n in ranked[:4]];total=sum(w for _,w in values)
 if total<1e-12:values=[(ranked[0][1],1)];total=1
 for n,w in values:body.vertex_groups[n].add([v.index],w/total,'REPLACE')
mod=body.modifiers.new('Wisp shared armature','ARMATURE');mod.object=arm;body.parent=arm

def shape(o,name,fn):
 if not o.data.shape_keys:o.shape_key_add(name='Basis')
 key=o.shape_key_add(name=name)
 for v in key.data:v.co=fn(v.co.copy())
 return key

def evil_skin(p):
 x,y,z=p;head=max(0,min(1,(z-1.8)/.25))*max(0,min(1,(3.0-z)/.25));x*=1+.09*head
 if z>2.9:x+=(z-2.9)*.18;z+=(z-2.9)*.12
 if abs(x)>.88 and z<1.95:
  side='L'if x<0 else'R';delta=Vector((0,0,0));total=0
  for name,line in fingerlines.items():
   if not name.endswith(side):continue
   best=None
   for i in range(len(line)-1):
    a,b=Vector(line[i]),Vector(line[i+1]);d=b-a;local=max(0,min(1,(p-a).dot(d)/d.length_squared));c=a+local*d;t=(i+local)/(len(line)-1);distance=(p-c).length
    if best is None or distance<best[0]:best=(distance,t,c)
   distance,t,c=best;weight=exp(-(distance/.105)**2);q=c+(p-c)*(1-.84*t*t)+Vector((math.copysign(.16*t*t,x),-.07*t*t,-.13*t*t));delta+=(q-p)*weight;total+=weight
  amount=max(0,min(1,(abs(p.x)-.95)/.20));q=p+delta*(amount/max(1,total));x,y,z=q


 if z<1.2:
  fade=max(0,min(1,(1.2-z)/.2));x+=sin(z*5)*.07*fade;y*=1-.10*fade
 # Recess the live mouth region rather than drawing a floating face card.
 d=(x/.43)**2+((z-1.99)/.24)**2
 if y<-.2 and d<1:y+=(1-d)**2*.30
 return(x,y,z)
shape(body,'Evil',evil_skin)
def jaw_skin(p):
 x,y,z=p;d=(x/.24)**2+((z-1.98)/.19)**2
 if y<-.2 and d<1:y+=(1-d)**2*.28
 return(x,y,z)
shape(body,'JawOpen',jaw_skin)
all_meshes=[body]
def feature(name,verts,faces,material,bone='Head'):
 o=mesh(name,verts,faces,material);attach(o,bone);all_meshes.append(o);return o
# Eye volumes, original painted iris textures, separate pupil and independent upper-lid surfaces.
for side,sign in [('L',-1),('R',1)]:
 center=Vector((sign*.28,-.325,2.44));bone='Eye_'+side
 bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=center);eye=bpy.context.object;eye.name='Sclera_'+side;eye.scale=(.245,.10,.215);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);bpy.ops.object.transform_apply(location=True,rotation=False,scale=False);eye.data.materials.append(white)
 for f in eye.data.polygons:f.use_smooth=True
 attach(eye,bone);all_meshes.append(eye)
 def eye_evil(p,sign=sign,center=center):
  d=p-center;d.z*=.70;d.z+=sign*d.x*.50;d.x*=.95;return center+d
 shape(eye,'Evil',eye_evil)
 # A curved iris dome, textured from the approved painted iris atlas.
 vv=[tuple(center+Vector((0,-.110,0)))];ff=[];uvcoords=[((100+567/2)/2172,1-(77+565/2)/724)]
 for ring in range(1,9):
  r=ring/8
  for j in range(48):
   a=j*2*pi/48;vv.append(tuple(center+Vector((.164*r*cos(a),-.111+.014*r*r,.164*r*sin(a)))));uvcoords.append(((100+567/2+567/2*r*cos(a))/2172,1-(77+565/2+565/2*r*sin(a))/724))
 for j in range(48):ff.append((0,1+j,1+(j+1)%48))
 for r in range(7):
  for j in range(48):a=1+r*48+j;b=1+r*48+(j+1)%48;ff.append((a,b,b+48,a+48))
 iris=feature('Iris_'+side,vv,ff,irismat,bone);uv=iris.data.uv_layers.new()
 for loop in iris.data.loops:uv.data[loop.index].uv=uvcoords[loop.vertex_index]
 shape(iris,'Evil',eye_evil)
 # Deep pupils are actual convex geometry; catchlights track with the eye.
 for label,pos,scale,material in [('Pupil',(0,-.122,0),(.073,.015,.097),pupilmat),('Catchlight',(-.048,-.142,.068),(.025,.008,.027),shine),('CatchlightSmall',(.046,-.132,-.048),(.010,.005,.011),shine)]:
  bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=center+Vector(pos));o=bpy.context.object;o.name=label+'_'+side;o.scale=scale;bpy.ops.object.transform_apply(location=True,rotation=False,scale=True);o.data.materials.append(material)
  for f in o.data.polygons:f.use_smooth=True
  attach(o,bone);all_meshes.append(o)
  def feature_evil(p,label=label,center=center):
   q=eye_evil(p)
   if label=='Pupil':
    d=q-center;d.x*=.58;d.z*=.58;q=center+d
   return q
  shape(o,'Evil',feature_evil)
 # Lid cap covers the front hemisphere continuously as its blink shape reaches one.
 def lid_point(u,v,cover):
  zz=1-2*v*cover;xx=u*math.sqrt(max(0,1-zz*zz));yy=-math.sqrt(max(0,1-xx*xx-zz*zz));return center+Vector((xx*.251,yy*.106-.005-.065*max(0,(cover-.055)/.945),zz*.221))
 vv=[];ff=[]
 for row in range(19):
  for col in range(25):vv.append(lid_point(col/12-1,row/18,.055))
 for row in range(18):
  for col in range(24):a=row*25+col;ff.append((a,a+1,a+26,a+25))
 lid=feature('UpperLid_'+side,vv,ff,skin,'Head');uv=lid.data.uv_layers.new()
 for loop in lid.data.loops:uv.data[loop.index].uv=(.5,.61)
 key=lid.shape_key_add(name='Basis');blink=lid.shape_key_add(name='Blink_'+side);evil=lid.shape_key_add(name='Evil')
 for i,v in enumerate(blink.data):v.co=lid_point((i%25)/12-1,(i//25)/18,1)
 for i,v in enumerate(evil.data):v.co=eye_evil(lid_point((i%25)/12-1,(i//25)/18,.46))
 compound=lid.shape_key_add(name='BlinkEvil_'+side)
 for i,v in enumerate(compound.data):v.co=2*key.data[i].co+eye_evil(lid_point((i%25)/12-1,(i//25)/18,1))-blink.data[i].co-evil.data[i].co
 # Sculpted brow ribbon with independent up/down targets and a menacing inner pinch.
 pts=[]
 for i in range(17):u=i/16;x=sign*(.06+.35*u);z=2.77+.08*sin(pi*u)-.04*u;depth=.31*math.sqrt(max(.06,1-(x/.48)**2));pts.append(((x,-depth-.018,z),.020*sin(pi*(.08+.84*u))))
 brow=tube('Brow_'+side,pts,browmat,10);attach(brow);all_meshes.append(brow)
 def evil_brow(p,sign=sign):
  u=max(0,min(1,(abs(p.x)-.06)/.35));i=min(16,round(u*16));center=Vector(pts[i][0]);delta=p-center
  # Substantial fleshy ivory ridge, tapered at its outer end, rather than a tilted line.
  return Vector((center.x*1.02,center.y-.055,center.z-.22*(1-u)))+Vector((delta.x*1.7,delta.y*3.0,delta.z*3.8))
 shape(brow,'Evil',evil_brow)
 shape(brow,'BrowUp_'+side,lambda p:(p.x,p.y-.01,p.z+.10));shape(brow,'BrowDown_'+side,lambda p:(p.x,p.y-.02,p.z-.065))
# The mouth is a real curved cavity with an ivory rim, shape-keyed visemes and growing fangs.
def mouth_position(angle,radius,kind='Basis',rim=False):
 w,h=.205,.014;smile=.038
 if kind=='Evil':w,h,smile=.425,.205,.10
 if kind=='JawOpen':h=.17
 if kind=='MouthFunnel':w,h=.115,.12
 if kind=='MouthWide':w,h=.29,.07
 if kind=='MouthSmile':w,h,smile=.24,.016,.085
 x=w*cos(angle)*radius;z=2.025+h*sin(angle)*radius+smile*(cos(angle)*radius)**2;depth={'Evil':-.448,'JawOpen':-.448,'MouthFunnel':-.448,'MouthWide':-.448}.get(kind,-.448);y=depth-.006*(radius**2)
 if rim:y-=.003
 return Vector((x,y,z))
vv=[mouth_position(0,0)];ff=[]
for r in range(1,9):
 for j in range(64):vv.append(mouth_position(j*2*pi/64,r/8))
for j in range(64):ff.append((0,1+(j+1)%64,1+j))
for r in range(7):
 for j in range(64):a=1+r*64+j;b=1+r*64+(j+1)%64;ff.append((a,a+64,b+64,b))
mouth=feature('MouthCavity',vv,ff,ink);mouth.shape_key_add(name='Basis')
for kind in ['Evil','JawOpen','MouthFunnel','MouthWide','MouthSmile']:
 k=mouth.shape_key_add(name=kind)
 for i,v in enumerate(k.data):v.co=mouth_position(0,0,kind)if i==0 else mouth_position((i-1)%64*2*pi/64,((i-1)//64+1)/8,kind)
# Rim loops have volumetric cross-section, rather than a flat mouth decal.
vv=[];ff=[]
for j in range(64):
 a=j*2*pi/64;center=mouth_position(a,1,rim=True)
 for k in range(8):b=k*2*pi/8;vv.append(center+Vector((cos(a)*.004*cos(b),.004*sin(b),sin(a)*.004*cos(b))))
for j in range(64):
 for k in range(8):a=j*8+k;b=j*8+(k+1)%8;c=((j+1)%64)*8;ff.append((a,b,c+(k+1)%8,c+k))
rim=feature('MouthRim',vv,ff,lip);rim.shape_key_add(name='Basis')
for kind in ['Evil','JawOpen','MouthFunnel','MouthWide','MouthSmile']:
 key=rim.shape_key_add(name=kind)
 for i,v in enumerate(key.data):a=(i//8)*2*pi/64;v.co+=mouth_position(a,1,kind,True)-mouth_position(a,1,'Basis',True)
for sign in [-1,1]:
 vv=[(sign*.28+.045*cos(i*2*pi/16),-.458+.02*sin(i*2*pi/16),2.075)for i in range(16)]+[(sign*.255,-.475,1.91)];ff=[(i,(i+1)%16,16)for i in range(16)];fang=feature('Fang_'+str(sign),[(x,-.25,2.05)for x,y,z in vv],ff,tooth);fang.shape_key_add(name='Basis');k=fang.shape_key_add(name='Evil')
 for i,v in enumerate(k.data):v.co=vv[i]
# Oral volume and tongue targets remain inside the head at rest.
tongue_mat=mat('Soft coral tongue',(.46,.12,.16),.55)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(0,-.29,1.99));tongue=bpy.context.object;tongue.name='Tongue';tongue.scale=(.085,.065,.022);bpy.ops.object.transform_apply(location=True,rotation=False,scale=True);tongue.data.materials.append(tongue_mat);attach(tongue);all_meshes.append(tongue)
shape(tongue,'TongueUp',lambda p:(p.x,p.y-.06,p.z+.075));shape(tongue,'TongueOut',lambda p:(p.x,p.y-.19,p.z))

# Exportable hand/head/tail motion clips are authored on the skeleton, not screen-space transforms.
bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=120;bpy.context.scene.render.fps=30
arm.animation_data_create()
for name,duration,kind in [('Float',120,'idle'),('Wave',84,'wave'),('TurnAway',108,'turn'),('MenacingPace',120,'pace')]:
 action=bpy.data.actions.new(name);arm.animation_data.action=action
 for frame in sorted(set(list(range(1,duration+1,4))+[duration])):
  t=(frame-1)/(duration-1)
  for bone in arm.pose.bones:bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0);bone.location=(0,0,0)
  arm.pose.bones['Root'].location.z=sin(t*2*pi)*.045
  for side,phase in [('L',0),('R',1.2)]:arm.pose.bones['Forearm_'+side].rotation_euler.y=sin(t*2*pi+phase)*.09;arm.pose.bones['Hand_'+side].rotation_euler.y=sin(t*2*pi+phase-.6)*.07
  arm.pose.bones['Tail_1'].rotation_euler.y=sin(t*2*pi-.5)*.14;arm.pose.bones['Tail_2'].rotation_euler.y=sin(t*2*pi-1.0)*.20;arm.pose.bones['Crest_1'].rotation_euler.y=sin(t*2*pi+.6)*.035
  if kind=='wave':arm.pose.bones['UpperArm_R'].rotation_euler.z=-sin(pi*t)*1.5;arm.pose.bones['Forearm_R'].rotation_euler.z=sin(t*pi*8)*sin(pi*t)*.35
  if kind=='turn':arm.pose.bones['Root'].rotation_euler.z=2*pi*(t*t*(3-2*t))
  if kind=='pace':arm.pose.bones['Root'].location.x=sin(t*2*pi)*.45;arm.pose.bones['Head'].rotation_euler.z=sin(t*2*pi)*.18
  for bone in arm.pose.bones:bone.keyframe_insert(data_path='rotation_euler',frame=frame);bone.keyframe_insert(data_path='location',frame=frame)
 track=arm.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);strip.action_frame_end=duration
arm.animation_data.action=None
for track in arm.animation_data.nla_tracks:track.mute=True
for bone in arm.pose.bones:bone.rotation_euler=(0,0,0);bone.location=(0,0,0)
# One artist-facing control set drives every matching shape in the Blender source.
control_names=sorted({k.name for o in all_meshes if o.data.shape_keys for k in o.data.shape_keys.key_blocks if k.name!='Basis' and not k.name.startswith('BlinkEvil')})
for name in control_names:
 arm[name]=0.0;arm.id_properties_ui(name).update(min=0,max=1,description='Wisp shared '+name+' control')
for o in all_meshes:
 if not o.data.shape_keys:continue
 for key in o.data.shape_keys.key_blocks:
  if key.name=='Basis':continue
  driver=key.driver_add('value').driver;driver.type='SCRIPTED'
  controls=['Evil','Blink_'+key.name[-1]]if key.name.startswith('BlinkEvil')else[key.name]
  for i,name in enumerate(controls):
   var=driver.variables.new();var.name='v'+str(i);var.type='SINGLE_PROP';var.targets[0].id=arm;var.targets[0].data_path='["'+name+'"]'
  driver.expression='*'.join('v'+str(i)for i in range(len(controls)))

# Inspectable model metadata and source scene.
arm['character']='Wisp';arm['rig_contract']='shared topology Evil [0,1], independent lids, expressive mouth and weighted full-body skeleton';arm['painted_sources']='cute-body-core.png; cute-optics.png'
for im in bpy.data.images:
 if im.source=='FILE':im.pack()
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);bpy.context.view_layer.objects.active=arm
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   space=area.spaces.active;space.shading.type='MATERIAL';space.region_3d.view_location=(0,0,1.85);space.region_3d.view_distance=6;space.region_3d.view_rotation=Euler((pi/2,0,0)).to_quaternion();space.region_3d.view_perspective='ORTHO'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'source/wisp-3d/Wisp.blend'))
for track in arm.animation_data.nla_tracks:track.mute=False
bpy.ops.export_scene.gltf(filepath=str(OUT/'wisp.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_morph=True,export_morph_normal=True,export_normals=True,export_yup=True,export_cameras=False,export_lights=False)
metadata={'character':'Wisp','source':'../../source/wisp-3d/Wisp.blend','body_vertices':len(body.data.vertices),'meshes':len(all_meshes),'bones':list(armdata.bones.keys()),'morphs':sorted({k.name for o in all_meshes if o.data.shape_keys for k in o.data.shape_keys.key_blocks if k.name!='Basis'}),'clips':['Float','Wave','TurnAway','MenacingPace'],'painted_sources':['../wisp-v2/cute-body-core.png','../wisp-v2/cute-optics.png'],'limits':['First sculpt requires visual review against the painted designs; seamless topology does not by itself guarantee artistic likeness.','Live acoustic mouth movement is an estimate, not phoneme alignment.']}
(OUT/'rig.json').write_text(json.dumps(metadata,indent=2)+'\n');print('WISP_RIG_BUILT',json.dumps(metadata))
