"""Adduco Crveni monolit: original editable scene, generated in Higgsfield 3D Jutsu.
Embedded procedural surface maps are generated here and travel with the GLB.
"""
import bpy, math, random, numpy as np
from mathutils import Vector
random.seed(71)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)

N=512
rng=np.random.default_rng(17)
yy,xx=np.mgrid[0:N,0:N].astype(float)/N
noise=np.zeros((N,N))
for f,a in [(3,.4),(7,.24),(17,.16),(49,.12),(113,.08)]:
    grid=rng.random((f+1,f+1));grid[-1,:]=grid[0,:];grid[:,-1]=grid[:,0]
    u=xx*f;v=yy*f;ix=u.astype(int);iy=v.astype(int);fx=u-ix;fy=v-iy
    fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy)
    noise+=a*((1-fy)*((1-fx)*grid[iy,ix]+fx*grid[iy,ix+1])+fy*((1-fx)*grid[iy+1,ix]+fx*grid[iy+1,ix+1]))
noise=(noise-noise.min())/(noise.max()-noise.min())
fine=rng.random((N,N))
pores=np.zeros((N,N))
for _ in range(320):
    cx,cy=rng.integers(N,size=2);r=rng.uniform(.7,3.5)
    x0=max(0,int(cx-r*2));x1=min(N,int(cx+r*2)+1);y0=max(0,int(cy-r*2));y1=min(N,int(cy+r*2)+1)
    py,px=np.mgrid[y0:y1,x0:x1]
    pores[y0:y1,x0:x1]+=np.exp(-((px-cx)**2+(py-cy)**2)/(r*r))*.5
height=noise*.05+fine*.018-pores*.08

def image_map(name,rgb,noncolor=False):
    im=bpy.data.images.new(name,width=N,height=N,alpha=False)
    if noncolor: im.colorspace_settings.name='Non-Color'
    rgba=np.ones((N,N,4),dtype=np.float32)
    if rgb.ndim==2: rgba[:,:,:3]=rgb[:,:,None]
    else: rgba[:,:,:3]=rgb
    im.pixels.foreach_set(rgba.ravel());im.update()
    im.pack(); return im

def mat(name,color,rough=.65,metal=0,texture=False,detail=1):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    nt=m.node_tree;p=nt.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    if texture:
        # Color texture is sRGB; portable textures retain surface detail under the runtime lighting.
        rgb=np.clip(np.array(color)[None,None,:]*(.94+noise[:,:,None]*.11-fine[:,:,None]*.015-pores[:,:,None]*.2),0,1)
        tex=nt.nodes.new('ShaderNodeTexImage');tex.image=image_map(name+' base color',rgb);nt.links.new(tex.outputs['Color'],p.inputs['Base Color'])
        roughtex=nt.nodes.new('ShaderNodeTexImage');roughtex.image=image_map(name+' roughness',np.clip(rough+noise*.12-.06,0,1),True);nt.links.new(roughtex.outputs['Color'],p.inputs['Roughness'])
        gy,gx=np.gradient(height*detail);normal=np.stack([-gx*55,-gy*55,np.ones_like(gx)],axis=2);normal/=np.linalg.norm(normal,axis=2,keepdims=True)
        ntex=nt.nodes.new('ShaderNodeTexImage');ntex.image=image_map(name+' normal',(normal+1)/2,True)
        n=nt.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.6;nt.links.new(ntex.outputs['Color'],n.inputs['Color']);nt.links.new(n.outputs['Normal'],p.inputs['Normal'])
    return m
red=mat('Adduco red coated steel',(.76,.028,.052),.38,.3,True,.28)
concrete=mat('Neutral architectural concrete',(.61,.62,.63),.84,0,True,1)
lightstone=mat('Light cut concrete',(.73,.735,.74),.79,0,True,.65)
basalt=mat('Charcoal aggregate',(.145,.15,.16),.94,0,True,1.6)
steel=mat('Graphite fasteners',(.07,.08,.09),.31,.9)
leafmat=mat('Olive foliage',(.14,.19,.10),.9)
watermat=mat('Water surface',(.48,.51,.54),.13,.55)

def uv(me):
    layer=me.uv_layers.new(name='Material coordinates')
    for p in me.polygons:
        a=max(range(3),key=lambda i:abs(p.normal[i]));axes=[i for i in range(3) if i!=a]
        for li in p.loop_indices:
            c=me.vertices[me.loops[li].vertex_index].co;layer.data[li].uv=(c[axes[0]]*.62,c[axes[1]]*.62)

def finish(o,name,matl,bevel=.025):
    o.name=name;o.data.materials.append(matl);uv(o.data)
    if bevel:
        b=o.modifiers.new('Manufactured edge radius','BEVEL');b.width=bevel;b.segments=3
        o.modifiers.new('Face weighted normals','WEIGHTED_NORMAL')
    return o

def box(name,loc,dim,material,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,material,bevel)

def prism(name,points,y,depth,material,shrink=.965):
    cx=sum(p[0] for p in points)/3;cz=sum(p[1] for p in points)/3
    pts=[(cx+(x-cx)*shrink,cz+(z-cz)*shrink) for x,z in points]
    vs=[(x,y+d,z) for d in [-depth/2,depth/2] for x,z in pts]
    me=bpy.data.meshes.new(name);me.from_pydata(vs,[],[(0,1,2),(5,4,3),(3,4,1,0),(4,5,2,1),(5,3,0,2)]);me.update()
    o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);finish(o,name,material,.018)
    return o

def bolt(x,y,z):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=.034,depth=.025,location=(x,y,z),rotation=(math.pi/2,0,0))
    finish(bpy.context.object,'Recessed hex fastener',steel,.005)

def triangles(s=1.22):
    h=s*math.sqrt(3)/2;H=h*4;ts=[]
    for r in range(4):
        for j in range(r+1):
            if (r==2 and j==1) or (r==3 and j in [1,2]):continue
            x=(j-r/2)*s;z=H-r*h;ts.append([(x,z),(x-s/2,z-h),(x+s/2,z-h)])
        for j in range(r):
            if r==3 and j==1:continue
            x=(j-r/2)*s;z=H-r*h;ts.append([(x,z),(x+s/2,z-h),(x+s,z)])
    ts.append([(0,h),(-s/2,0),(s/2,0)])
    return ts

def emblem(sx,cy,base,kind):
    ts=triangles()
    for i,t in enumerate(ts):
        t=[(x+sx,z+base) for x,z in t]
        name=('portal_fragment_' if kind==3 else 'Vision triangular module ')+str(i)
        if kind==0:
            prism(name,t,cy,.86,red)
        elif kind==2:
            # A deliberate structural assembly: concrete cores, red faceplates, open joints.
            shift=.13 if i%3==1 else 0
            t=[(x,z+shift) for x,z in t]
            prism('Precision precast core '+str(i),t,cy,1.06,lightstone,.945)
            prism('Precision red faceplate '+str(i),t,cy-.555,.055,red,.86)
        else:
            prism(name,t,cy,1.05,red if i%3!=1 else concrete,.972)
        if kind!=3:
            cx=sum(p[0] for p in t)/3;cz=sum(p[1] for p in t)/3
            for x,z in t:bolt(cx+(x-cx)*.78,cy-(.59 if kind==2 else .445),cz+(z-cz)*.78)

# Sculptures share one coherent landscape, in metres (Blender +Y becomes glTF -Z).
centers=[(3.8,0),(-2,25),(3.2,50),(-.5,75)]
for idx,(sx,cy) in enumerate(centers):
    if idx in [0,2,3]:emblem(sx,cy,.4,idx)
    else:
        # Two interdependent concrete wedges with a crafted red steel connection.
        prism('Trust west concrete support',[(sx-2.1,.4),(sx-.4,4.3),(sx+.15,.4)],cy,1.35,concrete)
        prism('Trust east concrete support',[(sx-.1,.4),(sx+.45,3.9),(sx+2.15,.4)],cy+.15,1.35,lightstone)
        box('Trust red structural connection',(sx,cy-.75,2.15),(2.4,.28,.48),red,.035)
        box('Trust deep connection web',(sx,cy,2.15),(.32,1.5,.48),red,.025)
        for x in [-.9,.9]:
            for z in [2.04,2.26]:bolt(sx+x,cy-.91,z)
box('Reflective pool',(0,35,-.06),(180,200,.1),watermat,0)
world=bpy.data.worlds.new('Neutral overcast daylight');bpy.context.scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.81,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.45
light=bpy.data.lights.new('Directional daylight','SUN');light.energy=2.5;light.angle=.11
ob=bpy.data.objects.new('Directional daylight',light);bpy.context.collection.objects.link(ob);ob.rotation_euler=(.5,-.65,-.35)
light=bpy.data.lights.new('Large sky fill','AREA');light.energy=1300;light.shape='DISK';light.size=12
ob=bpy.data.objects.new('Large sky fill',light);bpy.context.collection.objects.link(ob);ob.location=(-4,-6,12)
camdata=bpy.data.cameras.new('Delivery camera');cam=bpy.data.objects.new('Delivery camera',camdata);bpy.context.collection.objects.link(cam)
cam.location=(-2.5,-15,2.4);target=Vector((.2,0,2.6));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camdata.lens=40
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.media_type='IMAGE';scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
# Approximate sRGB samples from the supplied logo, assigned by triangle position.
palette = ['830108','ED0F19','E70104','C60816','C70817','C70817','E30A16','E30A16','830108','830108','9D0512','9D0512','E70104']
source=bpy.data.materials['Adduco red coated steel']
def linear(v):
    v=v/255
    return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
materials={}
for hexcode in set(palette):
    m=source.copy();m.name='Adduco enamel '+hexcode
    p=m.node_tree.nodes.get('Principled BSDF')
    for link in list(p.inputs['Base Color'].links):m.node_tree.links.remove(link)
    color=tuple(linear(int(hexcode[i:i+2],16)) for i in (0,2,4))
    p.inputs['Base Color'].default_value=(*color,1);m.diffuse_color=(*color,1)
    p.inputs['Metallic'].default_value=.18
    materials[hexcode]=m
counts={}
for o in bpy.data.objects:
    if o.type!='MESH':continue
    if o.name.startswith(('Vision triangular module ','Precision red faceplate ','portal_fragment_')):
        i=int(o.name.split('_')[-1]) if o.name.startswith('portal') else int(o.name.rsplit(' ',1)[-1])
        if source in list(o.data.materials):
            o.data.materials[0]=materials[palette[i]];counts[o.name]=palette[i]

scene=bpy.context.scene
for name,factor in [('Neutral architectural concrete',.38),('Light cut concrete',.50),('Charcoal aggregate',.65)]:
    m=bpy.data.materials[name]
    p=m.node_tree.nodes.get('Principled BSDF')
    for link in p.inputs['Base Color'].links:
        image=link.from_node.image
        values=np.empty(len(image.pixels),dtype=np.float32);image.pixels.foreach_get(values)
        rgba=values.reshape(-1,4);rgba[:,:3]*=factor;image.pixels.foreach_set(values);image.update();image.pack()
    p.inputs['Roughness'].default_value=.6
for m in bpy.data.materials:
    if m.name.startswith('Adduco enamel'):
        m.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.32
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.012,.023,.04,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.25
for o in list(bpy.data.objects):
    if o.type=='LIGHT':bpy.data.objects.remove(o,do_unlink=True)
sun=bpy.data.lights.new('Cool evening sky','SUN');sun.energy=1.15;sun.color=(.62,.76,1);sun.angle=.12
o=bpy.data.objects.new('Cool evening sky',sun);bpy.context.collection.objects.link(o);o.rotation_euler=(.4,-.65,-.4)
for i,(x,y) in enumerate([(3.8,0),(-2,25),(3.2,50),(-.5,75)]):
    for label,loc,energy,color in [('key',(x-4,y-6,7),1900,(1,.89,.79)),('rim',(x+4,y+3,6),2400,(.61,.76,1))]:
        light=bpy.data.lights.new('Sculpture '+label+' '+str(i),'AREA');light.energy=energy;light.shape='DISK';light.size=5;light.color=color
        ob=bpy.data.objects.new(light.name,light);bpy.context.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((x,y,2.2))-ob.location).to_track_quat('-Z','Y').to_euler()

# Contemporary structural environment, replacing the initial garden treatment.
concrete=bpy.data.materials['Neutral architectural concrete'].copy();concrete.name='Construction fairfaced concrete'
board=concrete.copy();board.name='Construction boardformed concrete'
wet=concrete.copy();wet.name='Construction wet foundation'
p=wet.node_tree.nodes.get('Principled BSDF')
for link in list(p.inputs['Roughness'].links):wet.node_tree.links.remove(link)
p.inputs['Roughness'].default_value=.22
steel=bpy.data.materials['Graphite fasteners'].copy();steel.name='Construction reinforcing steel'
steel.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.11,.08,.065,1)
steel.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.57
joint=bpy.data.materials['Graphite fasteners']
strip=bpy.data.materials.new('Construction warm linear light');strip.use_nodes=True
p=strip.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(1,.82,.65,1);p.inputs['Emission Color'].default_value=(1,.78,.52,1);p.inputs['Emission Strength'].default_value=3
def uv(o):
    layer=o.data.uv_layers.new(name='Construction metre coordinates')
    for face in o.data.polygons:
        axis=max(range(3),key=lambda a:abs(face.normal[a])); axes=[a for a in range(3) if a!=axis]
        for li in face.loop_indices:
            v=o.data.vertices[o.data.loops[li].vertex_index].co;layer.data[li].uv=(v[axes[0]]*.5,v[axes[1]]*.5)
def box(name,loc,dim,mat,bevel=.018):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=dim
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);uv(o)
    if bevel:
        b=o.modifiers.new('Cast edge chamfer','BEVEL');b.width=bevel;b.segments=2;o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
    return o
def tube(vs,fs,a,b,r=.021,sides=8):
    a=Vector(a);b=Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,0,1)))
    if u.length<.001:u=axis.cross(Vector((0,1,0)))
    u.normalize();v=axis.cross(u);q=len(vs)
    for c in (a,b):
        for k in range(sides):vs.append(tuple(c+r*(math.cos(k*math.tau/sides)*u+math.sin(k*math.tau/sides)*v)))
    fs.extend([(q+k,q+(k+1)%sides,q+(k+1)%sides+sides,q+k+sides) for k in range(sides)])
    fs.extend([tuple(q+k for k in reversed(range(sides))),tuple(q+sides+k for k in range(sides))])
def cage(x,y,z,h,width=.62):
    vs=[];fs=[]
    for dx in (-width/2,width/2):
        for dy in (-width/2,width/2):
            tube(vs,fs,(x+dx,y+dy,z),(x+dx,y+dy,z+h),.028)
            for j in range(int(h/.11)):
                zz=z+j*.11;tube(vs,fs,(x+dx,y+dy,zz),(x+dx,y+dy,zz+.018),.035)
    for j in range(int(h/.2)):
        zz=z+j*.2
        pts=[(x-width/2-.015,y-width/2-.015,zz),(x+width/2+.015,y-width/2-.015,zz),(x+width/2+.015,y+width/2+.015,zz),(x-width/2-.015,y+width/2+.015,zz)]
        for k in range(4):tube(vs,fs,pts[k],pts[(k+1)%4],.017)
    me=bpy.data.meshes.new('Ribbed steel cage');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Construction exposed ribbed reinforcement',me);bpy.context.collection.objects.link(o);o.data.materials.append(steel)
    for f in me.polygons:f.use_smooth=True
def ties(x,y,z,w,h):
    # Inset formwork tie holes on the exposed front face, at a plausible 1.2m grid.
    for dx in range(int(w/1.2)):
        for dz in range(int(h/1.2)):
            xx=x-w/2+.6+dx*1.2;zz=z-h/2+.6+dz*1.2
            bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.028,depth=.008,location=(xx,y,zz),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name='Construction recessed formwork tie';o.data.materials.append(joint)
centers=[(3.8,0),(-2,25),(3.2,50),(-.5,75)]
for i,(x,y) in enumerate(centers):
    box('Construction continuous footing',(x,y,.15),(8.6,5.2,.3),wet,.035)
    box('Construction display plinth',(x,y,.35),(5.8,1.55,.12),concrete)
    for dx in (-4.1,4.1):
        box('Construction portal reinforced pier',(x+dx,y+1.7,3.3),(.7,1.1,6.6),concrete,.035)
        box('Construction portal foundation pad',(x+dx,y+1.7,.23),(1.35,1.8,.46),wet,.025)
        ties(x+dx,y+1.144,3.3,.7,6.6)
    box('Construction deep portal beam',(x,y+1.7,6.3),(8.9,1.1,.8),concrete,.03)
    ties(x,y+1.144,6.3,8.9,.8)
    box('Construction recessed beam light',(x,y+1.14,5.88),(7.6,.035,.025),strip,.004)
    # Large structural pieces beyond the subject leave a clear native camera corridor.
    box('Construction shear wall left',(-8.3,y+7,2.9),(.5,8,5.8),board,.025)
    box('Construction shear wall right',(10.8,y+7,3.9),(.55,9,7.8),board,.025)
    box('Construction unfinished slab',(0,y+13,6.55),(17,2.8,.32),concrete,.025)
    for xx in (-8,8):
        box('Construction rectangular floor support',(xx,y+13,3.25),(.65,.75,6.5),concrete,.028)
    box('Construction wall panel',(-5.5,y+9,1.9),(3.8,.42,3.8),board,.025)
    ties(-5.5,y+8.785,1.9,3.8,3.8)
    for xx in (-6.8,-5.5,-4.2):cage(xx,y+9,3.7,1.2,.18)
    box('Construction exposed column starter',(x+5.6,y-2.8,.72),(.9,.9,1.44),concrete,.03)
    cage(x+5.6,y-2.8,1.3,2.4)
    box('Construction stacked precast slab',(x-5.5,y-2.1,.24),(2.5,1.2,.22),concrete)
    box('Construction stacked precast slab',(x-5.35,y-2.05,.49),(2.5,1.2,.22),board)
    # Narrow casting joints make wall scale visible from the camera.
    for zz in (1.2,2.4):box('Construction horizontal casting joint',(-5.5,y+8.786,zz),(3.75,.012,.009),joint,.001)
    for xx in (-6.1,-4.9):box('Construction panel seam',(xx,y+8.785,1.9),(.012,.012,3.75),joint,.001)
    for j in range(7):
        xx=-7.4+j*.1; vs=[];fs=[];tube(vs,fs,(xx,y-3.8,.4),(xx,y+1.5,.4),.026)
        me=bpy.data.meshes.new('Rebar bundle');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Construction stacked reinforcement bars',me);bpy.context.collection.objects.link(o);o.data.materials.append(steel)
# First mark becomes a suspended engineered object, with its source geometry intact.
for o in bpy.data.objects:
    if o.name.startswith('Vision triangular module') or (o.name.startswith('Recessed hex fastener') and o.location.y<1):o.location.z+=.7
for xx in (3.55,4.05):
    for k in range(8):
        bpy.ops.mesh.primitive_torus_add(major_radius=.071,minor_radius=.014,major_segments=12,minor_segments=6,location=(xx,-.46,4.86+k*.15),rotation=(math.pi/2,0,0 if k%2 else math.pi/2))
        o=bpy.context.object;o.name='Construction lifting chain';o.scale=(.72,1.25,1);o.data.materials.append(joint)
    box('Construction lifting attachment lug',(xx,-.46,4.86),(.10,.10,.16),joint,0)
box('Construction lifting steel crossmember',(3.8,.64,6.04),(1,2.7,.14),joint,0)
scene=bpy.context.scene
scene.camera.location=(-1.8,-13.5,2.8);scene.camera.rotation_mode='QUATERNION';scene.camera.rotation_quaternion=(Vector((.2,0,2.4))-scene.camera.location).to_track_quat('-Z','Y');scene.camera.data.lens=32
scene.render.resolution_x=960;scene.render.resolution_y=600;scene.render.resolution_percentage=100;scene.render.engine='BLENDER_EEVEE'
scene.render.image_settings.media_type='IMAGE';scene.render.image_settings.file_format='PNG'
t=artifacts.file(name='adduco-structural-concrete.png',media_type='image/png');scene.render.filepath=str(t.path);bpy.ops.render.render(write_still=True);t.publish()
result={'direction':'contemporary construction','classical_columns':0,'construction_parts':len([o for o in bpy.data.objects if o.name.startswith('Construction')]),'original_red_palette':'preserved','geometry':'frames, shear walls, slabs, footings, ribbed rebar and lifting chains'}
