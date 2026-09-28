"""Deterministic pilot. Run with Blender -b --python; no network or paid assets."""
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

cube('Wet site slab',(0,0,-.28),(90,90,.5),ground,.035)
cube('Shared foundation',(0,.1,.22),(16,3.2,.52),concrete,.06)
# Cast panel seams, tie holes and concrete deck joints.
for x in range(-35,36,5):cube('Saw cut',(x,-10,-.018),(.018,65,.008),black,.0)
for y in range(-30,31,5):cube('Saw cut',(0,y,-.017),(70,.015,.008),black,.0)
raw=json.loads((ROOT/'scripts/monument/logo-panels.json').read_text())
polys=[[( (x-627)*12/395,(670-y)*12/395+.48) for x,y in p['pixels']] for p in raw]
# Continuous structural core bridges the graphic panel joints.
extrude('Continuous reinforced A core',[(0,12.48),(-6.83,.48),(-3.4,.48),(0,6.38),(3.4,.48),(6.83,.48)],-.39,.75,concrete)
# All thirteen silhouettes follow the exact source image; concrete stays rigid.
for i,poly in enumerate(polys):
 extrude(f'Concrete core {i:02}',poly,-.45,.55,concrete)
 # Existing neighboring finish provides material contrast without completing the whole story.
 if i in (10,11,12,9,4):
  c=raw[i]['rgb'];linear=tuple(((v/255+.055)/1.055)**2.4 for v in c)
  red=mat(f'Original logo enamel {i}',linear,.31,.45,.03)
  extrude(f'Installed panel {i}',poly,-.56,-.48,red)
# Fine casting tie holes and thin horizontal board imprint, limited to target/right leg.
for z in [1.1,2.05,3.0,3.95,4.9,5.85]:
 x=3.8-(z-3)*.56
 for dx in (-.44,.44):
  rod('Formwork tie recess',(x+dx,-.466,z),(x+dx,-.451,z),.026,black,vertices=16)
  rod('Tie sleeve rim',(x+dx,-.47,z),(x+dx,-.468,z),.032,galvanized,vertices=16)
# Reinforcement beside the active panel: dense cage, horizontal ties, ribs.
for x in [4.7,4.92,5.14,5.36]:
 for y in [.02,.43]:
  rod('Rebar vertical',(x,y,.6),(x-1.8,y,5.7),.019,steel)
  for k in range(58):
   z=.7+k*.084;xx=x-(z-.6)*1.8/5.1
   rod('Rebar rib',(xx-.012,y-.027,z-.008),(xx+.013,y+.027,z+.008),.007,steel,vertices=6)
for z in [1+i*.2 for i in range(23)]:
 shift=(z-.6)*1.8/5.1
 for y in [.0,.45]:rod('Cage tie',(4.67-shift,y,z),(5.4-shift,y,z),.011,steel)
 for x in [4.67,5.4]:rod('Cage return',(x-shift,0,z),(x-shift,.45,z),.011,steel)
# Active cladding panel: a traced face, not a triangle invented for this scene.
idx=7;poly=polys[idx];cx=sum(x for x,z in poly)/len(poly);cz=sum(z for x,z in poly)/len(poly)
assembly=empty('Cladding lift | rigid body')
c=raw[idx]['rgb'];red=mat('New red enamel',tuple(((v/255+.055)/1.055)**2.4 for v in c),.28,.45,.03)
extrude('Moving original-logo face',poly,-.59,-.49,red,assembly)
# Fixtures inset from vertices, distributed at material coordinates.
for x,z in poly[::max(1,len(poly)//3)]:
 x=cx+(x-cx)*.77;z=cz+(z-cz)*.77
 rod('Panel countersunk fixing',(x,-.615,z),(x,-.59,z),.034,galvanized,assembly,vertices=6)
# Anchor rails remain on the concrete behind the red plate.
for z in [cz-.45,cz+.2]:cube('Cladding rail',(cx,-.52,z),(1.1,.08,.045),galvanized,.009)
# Rectangular formwork face and timber/steel frame, lifted as one rigid unit.
form=empty('Formwork lift | rigid body')
for k in range(3):cube('Plywood board',(cx-.8+k*.8,-.79,cz),( .79,.075,2.85),wood,.012,form)
for x in [cx-1.21,cx,cx+1.21]:cube('Formwork strongback',(x,-.91,cz),(.1,.16,3.0),galvanized,.01,form)
for z in [cz-1.4,cz,cz+1.4]:
 cube('Formwork horizontal',(cx,-.93,z),(2.58,.13,.1),galvanized,.01,form)
 for x in [cx-.95,cx+.95]:rod('Wingnut',(x,-1.07,z),(x,-.99,z),.045,galvanized,form,vertices=6)
# Functional overhead lifting gantry, with two separate trolley hoists.
for x in [-9,10]:
 for y in [1,5]:cube('Gantry support',(x,y,7),( .38,.38,14),yellow,.02)
 cube('Gantry foot',(x,3,.32),(1.6,6,.25),black,.03)
cube('Gantry crossbeam',(.5,1,14.2),(20,.5,.7),yellow,.03)
for x in range(-9,10):rod('Gantry diagonal',(x,1,13.9),(x+1,1,14.5),.045,black)
# Cables recomputed at each frame; fixed endpoints have visible trolley supports.
cables=[]
for owner in [form,assembly]:
 for dx in [-.72,.72]:
  o=rod('Tensioned lifting sling',(cx+dx,-.8,cz+1.5),(cx,-.8,10),.017,black)
  cables.append((o,owner,dx,o.dimensions.z))
# Supported construction background, no classical columns.
for x in range(-21,22,7):
 for y in [12,20]:cube('Background column',(x,y,5),(.65,.7,10),concrete,.035)
for z in [4.3,8.5]:
 cube('Supported slab',(0,16,z),(44,10,.45),concrete,.035)
 for x in range(-21,22,7):cube('Downstand beam',(x,16,z-.48),(.65,10,.75),concrete,.025)
# Braced steel support and perimeter work platform beside the exposed cage.
for z in [1.0,3.0,5.0]:
 cube('Working scaffold deck',(5.9,.25,z),(1.4,2,.06),wood,.012)
 for y in [-.65,1.15]:rod('Scaffold handrail',(5.3,y,z+1),(6.55,y,z+1),.024,galvanized)
for x in [5.3,6.55]:
 for y in [-.65,1.15]:
  rod('Scaffold standard',(x,y,.5),(x,y,6.2),.03,galvanized)
  cube('Scaffold base',(x,y,.51),(.24,.24,.05),black,.005)
rod('Scaffold bracing',(5.3,-.65,1),(6.55,-.65,5),.018,galvanized)
# Site objects establish scale and function.
for j in range(8):cube('Stacked formwork',(8,5,.6+j*.10),(2.8,1.4,.08),wood,.012)
for j in range(7):rod('Stored reinforcement',(-8+j*.12,5,.12),(-8+j*.12,12,.12),.022,steel)
for x,y in [(-6,2),(8,3),(13,10)]:
 rod('Worklight mast',(x,y,0),(x,y,3),.045,galvanized)
 for dx,dy in [(.55,0),(-.3,.5),(-.3,-.5)]:rod('Tripod',(x,y,.7),(x+dx,y+dy,.04),.025,black)
 cube('Lamp housing',(x,y,3.15),(.42,.18,.32),black,.025)
 light('Warm worklight',(x,y-.15,3.2),850,(1,.61,.3),.4,(cx,0,3.5))
light('Overcast sky key',(-4,-10,16),850,(.62,.74,1),12,(0,0,4))
light('Warm construction rake',(8,-4,8),1050,(1,.69,.43),5,(cx,0,4))
light('Cool edge',(0,7,13),3000,(.45,.62,1),8,(0,0,6))
bpy.ops.object.camera_add();camera=bpy.context.object;camera.name='Pilot camera';scene.camera=camera;camera.data.lens=48
camera.data.clip_end=200

def pose(frame,orientation):
 p=(frame-1)/143
 # Form clears concrete first, panel then moves onto its fixed mounting plane.
 f=min(1,p/.4);f=f*f*(3-2*f)
 form.location=(-4*f,-1.6*f,3*f)
 q=max(0,min(1,(p-.35)/.5));q=q*q*(3-2*q)
 assembly.location=(3.3*(1-q),-1.5*(1-q),1.15*(1-q))
 for o,owner,dx,base_length in cables:
  end=Vector((cx+dx*.22,-.60 if owner==assembly else -.92, max(z for x,z in poly)-.3 if owner==assembly else cz+1.48))+owner.location
  top=Vector((cx+owner.location.x,-.8+owner.location.y,13.8))
  delta=top-end;o.location=(end+top)/2;o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();o.scale.z=delta.length/base_length
 # Portrait uses a separate camera path and keeps mount above caption area.
 if orientation=='portrait':
  camera.location=(7+2*p,-19-7*p,4+3*p);target=(cx-.25,0,cz+.4+.4*p)
 else:
  camera.location=(7+2*p,-13-7*p,3.5+2.5*p);target=(cx-.6,0,cz-.35+.5*p)
 aim(camera,target)

orientation=os.environ.get('ADDUCO_ORIENTATION','landscape')
scale=float(os.environ.get('ADDUCO_SCALE','.5'))
scene.render.resolution_x=1080 if orientation=='portrait' else 1920
scene.render.resolution_y=1920 if orientation=='portrait' else 1080
scene.render.resolution_percentage=int(scale*100)
frames=[int(f) for f in os.environ.get('ADDUCO_FRAMES','1,72,144').split(',')]
if os.environ.get('ADDUCO_ANIMATION')=='1':frames=list(range(1,145))
# Bake transforms, making the saved .blend editable independently of this script.
for f in range(1,145):
 pose(f,orientation)
 for o in [form,assembly,camera]+[a[0] for a in cables]:
  for prop in ['location','rotation_euler','scale']:o.keyframe_insert(data_path=prop,frame=f)
scene.frame_set(1)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'pilot-{orientation}.blend'))
for f in frames:
 scene.frame_set(f);scene.render.filepath=str(OUT/orientation/f'{f-1:04}.png');Path(scene.render.filepath).parent.mkdir(exist_ok=True)
 bpy.ops.render.render(write_still=True)
print('ADDUCO_RENDER_COMPLETE',orientation,len(frames))
