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
        # Color texture is sRGB; neutral surfaces remain neutral under white daylight.
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
    # Low irregular aggregate island with a narrow concrete waterline.
    n=64;radii=[1+random.uniform(-.025,.025) for _ in range(n)]
    vs=[(sx+3.75*radii[i]*math.cos(i*math.tau/n),cy+2.5*radii[i]*math.sin(i*math.tau/n),z) for z in [.025,.31] for i in range(n)]
    fs=[tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    me=bpy.data.meshes.new('Aggregate island');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Grounded aggregate island',me);bpy.context.collection.objects.link(o);finish(o,o.name,basalt,.045)
    for j in range(50):
        a=random.uniform(0,math.tau);rr=random.uniform(.73,.97)
        px=sx+3.4*rr*math.cos(a);py=cy+2.25*rr*math.sin(a)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=random.uniform(.045,.11),location=(px,py,.34));o=bpy.context.object;o.scale=(1.3,1,.55);finish(o,'Exposed aggregate stone',basalt,0)
    for j in range(9):
        a=random.uniform(0,math.tau);px=sx+3.35*math.cos(a);py=cy+2.1*math.sin(a)
        verts=[];faces=[]
        for k in range(9):
            aa=random.uniform(0,math.tau);h=random.uniform(.12,.36);w=.018;dx=.13*math.cos(aa);dy=.13*math.sin(aa);q=len(verts)
            verts.extend([(px-w,py,.32),(px+w,py,.32),(px+dx+w,py+dy,.32+h*.7),(px+dx,py+dy,.32+h)])
            faces.append((q,q+1,q+2,q+3))
        me=bpy.data.meshes.new('Coastal plant');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('Sparse coastal planting',me);bpy.context.collection.objects.link(o);finish(o,o.name,leafmat,0)

# Tightly grouped fluted concrete columns with segmented shafts and cut tops.
for sx,cy in centers:
    for x,y,h,r in [(-7.5,cy+4.5,7.6,.83),(-9.4,cy+5,9,.95),(-11.4,cy+5.9,7.3,.9),(-7.8,cy+7,8.3,.9),(8.3,cy+4,8,.87),(10.3,cy+5,9.4,.98),(8.5,cy+6.5,7,.88),(12.2,cy+6.5,8,.9),(-4.2,cy+12,8,.9),(-2.2,cy+13,7.5,.86),(5.4,cy+12.5,7.8,.88)]:
        for z,dim in [(.1,(r*2.75,r*2.75,.2)),(.28,(r*2.35,r*2.35,.16)),(.43,(r*2.1,r*2.1,.14))]:box('Concrete stepped plinth',(x,y,z),dim,concrete,.014)
        for j in range(3):
            n=120;unit=(h-.5)/3;vs=[]
            for lev in range(2):
                for i in range(n):
                    a=i*math.tau/n;rad=r*(1+.026*math.cos(a*20));z=lev*(unit-.022)+(.28*math.cos(a) if lev==1 and j==2 else 0)
                    vs.append((rad*math.cos(a),rad*math.sin(a),z))
            fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
            me=bpy.data.meshes.new('Fluted column segment');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Neutral fluted concrete shaft',me);bpy.context.collection.objects.link(o);o.location=(x,y,.5+j*unit);finish(o,o.name,concrete,0)
            for p in me.polygons:p.use_smooth=p.index>=2
            # Cylindrical UVs retain physical pore size without stretched cap mapping.
            layer=me.uv_layers.active
            for p in me.polygons[2:]:
                for li in p.loop_indices:
                    v=me.vertices[me.loops[li].vertex_index].co;a=math.atan2(v.y,v.x);layer.data[li].uv=(a*r*.62,v.z*.62)

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
t=artifacts.file(name='crveni-monolit-preview.png',media_type='image/png');scene.render.filepath=str(t.path);bpy.ops.render.render(write_still=True);t.publish()
result={'objects':len(bpy.data.objects),'materials':len(bpy.data.materials),'embedded_maps':len([i for i in bpy.data.images if i.packed_file]),'chapters':4,'identity':'red tessellated A','units':'metres'}
