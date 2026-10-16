"""Isolated painted-material/UV study. Never writes production assets or Wisp.blend."""
import bpy, pathlib, json, math, hashlib, struct
ROOT=pathlib.Path(__file__).resolve().parents[3]
STUDY=pathlib.Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'source/wisp-3d/Wisp.blend'))
body=bpy.data.objects['Wisp_Skin']
def topology_fingerprint():
 h=hashlib.sha256()
 for vertex in body.data.vertices:h.update(struct.pack('3f',*vertex.co))
 for face in body.data.polygons:
  for i in face.vertices:h.update(struct.pack('I',i))
 if body.data.shape_keys:
  for key in body.data.shape_keys.key_blocks:
   h.update(key.name.encode())
   for vertex in key.data:h.update(struct.pack('3f',*vertex.co))
 return h.hexdigest()
before=topology_fingerprint()
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
body.data.uv_layers.active.name='PaintedIslandUV'
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.015,area_weight=.3,correct_aspect=True,scale_to_bounds=False)
bpy.ops.object.mode_set(mode='OBJECT')
assert topology_fingerprint()==before,'UV study changed geometry or morph shapes'
image=bpy.data.images.load(str(STUDY/'ivory-paint-v1.png'));image.pack()
material=next(m for m in body.data.materials if 'Painted ivory' in m.name)
textures=[n for n in material.node_tree.nodes if n.type=='TEX_IMAGE'];assert len(textures)==1
textures[0].image=image
arm=bpy.data.objects['Wisp_Rig']
for track in arm.animation_data.nla_tracks:track.mute=True
bpy.ops.wm.save_as_mainfile(filepath=str(STUDY/'Wisp-material-study.blend'))
for track in arm.animation_data.nla_tracks:track.mute=False
bpy.ops.export_scene.gltf(filepath=str(STUDY/'wisp-material-study.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_morph=True,export_morph_normal=True,export_normals=True,export_yup=True,export_cameras=False,export_lights=False)
report={'geometryAndMorphFingerprint':before,'bodyVertices':len(body.data.vertices),'bones':len(arm.data.bones),'uvLoops':len(body.data.uv_layers.active.data),'texture':image.name,'scope':'Isolated UV/material candidate only; no geometry or production asset modification'}
(STUDY/'build-validation.json').write_text(json.dumps(report,indent=2)+'\n');print('MATERIAL_STUDY',json.dumps(report))
