"""Shared local scene materials and modelling helpers for the full reference story."""
import bpy, math, json, os, random, sys
from pathlib import Path
from mathutils import Vector
random.seed(41)
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(os.environ.get('ADDUCO_RENDER_DIR','/tmp/adduco-monument-renders')); OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=int(os.environ.get('ADDUCO_SAMPLES','32')); scene.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
 prefs.compute_device_type='METAL'; prefs.get_devices()
 for d in prefs.devices: d.use=d.type=='METAL'
 scene.cycles.device='GPU'
except Exception: pass
scene.cycles.max_bounces=6; scene.cycles.diffuse_bounces=3; scene.cycles.glossy_bounces=4
scene.render.fps=24; scene.frame_start=1; scene.frame_end=144
scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGB'
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.view_settings.exposure=-.4
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.23,.34,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.18

def mat(name,color,rough=.5,metal=0,noise=0):
 m=bpy.data.materials.new(name); m.use_nodes=True
 n=m.node_tree.nodes; l=m.node_tree.links; p=n.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
 if noise:
  tex=n.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value=18; tex.inputs['Detail'].default_value=4
  ramp=n.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].position=.2; ramp.color_ramp.elements[0].color=(*(c*.78 for c in color),1)
  ramp.color_ramp.elements[1].position=.8; ramp.color_ramp.elements[1].color=(*color,1)
  l.new(tex.outputs['Fac'],ramp.inputs[0]); l.new(ramp.outputs[0],p.inputs['Base Color'])
  fine=n.new('ShaderNodeTexNoise'); fine.inputs['Scale'].default_value=240; fine.inputs['Detail'].default_value=2
  bump=n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=noise; bump.inputs['Distance'].default_value=.025
  l.new(fine.outputs['Fac'],bump.inputs['Height']); l.new(bump.outputs[0],p.inputs['Normal'])
 return m
concrete=mat('Cast concrete | pores and aggregate',(.34,.35,.35),.61,noise=.65)
steel=mat('Oxidised ribbed reinforcement',(.14,.11,.085),.57,.7,.35)
galvanized=mat('Galvanised steel',(.32,.37,.40),.32,.8,.12)
black=mat('Cable and dark steel',(.035,.04,.045),.43,.75)
wood=mat('Oiled plywood',(.18,.105,.052),.62,noise=.4)
yellow=mat('Crane safety ochre',(.49,.26,.065),.42,.6,noise=.15)
seam=mat('Pale joint backing',(.55,.55,.52),.55,.25)
ground=mat('Rain soaked concrete',(.14,.16,.175),.23,noise=.7)
# Spatially varying wetness rather than a uniform mirror.
p=ground.node_tree.nodes.get('Principled BSDF'); t=ground.node_tree.nodes.new('ShaderNodeTexNoise'); t.inputs['Scale'].default_value=.45;t.inputs['Detail'].default_value=3
r=ground.node_tree.nodes.new('ShaderNodeValToRGB'); r.color_ramp.elements[0].position=.38;r.color_ramp.elements[0].color=(.065,.065,.065,1);r.color_ramp.elements[1].position=.6;r.color_ramp.elements[1].color=(.62,.62,.62,1)
ground.node_tree.links.new(t.outputs['Fac'],r.inputs[0]);ground.node_tree.links.new(r.outputs[0],p.inputs['Roughness'])

# Photographed CC0 concrete and evening HDRI replace the procedural-only look.
textures=ROOT/'assets-source/monument'
wn=scene.world.node_tree.nodes;wl=scene.world.node_tree.links
env=wn.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(textures/'evening.hdr'))
wl.new(env.outputs['Color'],wn['Background'].inputs['Color']);wn['Background'].inputs['Strength'].default_value=.24
cn=concrete.node_tree.nodes;cl=concrete.node_tree.links;cp=cn.get('Principled BSDF')
coords=cn.new('ShaderNodeTexCoord');mapping=cn.new('ShaderNodeVectorMath');mapping.operation='SCALE';mapping.inputs[3].default_value=.5;cl.new(coords.outputs['Object'],mapping.inputs[0])
for filename,channel in [('Diffuse.jpg','Base Color'),('Rough.jpg','Roughness')]:
 tex=cn.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(textures/filename));tex.projection='BOX';tex.projection_blend=.15;cl.new(mapping.outputs[0],tex.inputs[0])
 if channel=='Roughness':tex.image.colorspace_settings.name='Non-Color';cl.new(tex.outputs['Color'],cp.inputs[channel])
 else:
  multiply=cn.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1;multiply.inputs[2].default_value=(.38,.42,.46,1);cl.new(tex.outputs['Color'],multiply.inputs[1]);cl.new(multiply.outputs[0],cp.inputs[channel])
height=cn.new('ShaderNodeTexImage');height.image=bpy.data.images.load(str(textures/'Displacement.jpg'));height.image.colorspace_settings.name='Non-Color';height.projection='BOX';height.projection_blend=.15;cl.new(mapping.outputs[0],height.inputs[0])
bump=cn.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.42;bump.inputs['Distance'].default_value=.018;cl.new(height.outputs['Color'],bump.inputs['Height']);cl.new(bump.outputs[0],cp.inputs['Normal'])

def finish(o,name,m,parent=None):
 o.name=name;o.data.materials.append(m)
 if parent:o.parent=parent
 return o

def cube(name,loc,size,m,bevel=.015,parent=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 finish(o,name,m,parent)
 if bevel:
  mod=o.modifiers.new('Machined edge','BEVEL');mod.width=bevel;mod.segments=2
  o.modifiers.new('Face normals','WEIGHTED_NORMAL')
 return o

def rod(name,a,b,radius,m,parent=None,vertices=10):
 a,b=Vector(a),Vector(b);delta=b-a
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=delta.length,location=(a+b)/2)
 o=bpy.context.object;o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();return finish(o,name,m,parent)

def empty(name):
 o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);return o

def extrude(name,poly,front,back,m,parent=None):
 n=len(poly);verts=[(x,y,z) for y in (front,back) for x,z in poly]
 faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);finish(o,name,m,parent)
 bevel=o.modifiers.new('Real edge radius','BEVEL');bevel.width=.012;bevel.segments=2;o.modifiers.new('Normals','WEIGHTED_NORMAL');return o

def aim(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
def light(name,loc,power,color,size,target):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;aim(o,target);return o
