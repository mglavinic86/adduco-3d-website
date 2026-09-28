"""Twenty-second editable brand-construction reference. No AI jobs or network access."""
import sys, os, math, itertools, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from scene_common import *
from story_timeline import DURATION,FPS,panel_state,camera_pose,smooth
OUT=Path(os.environ.get('ADDUCO_STORY_DIR',str(ROOT/'assets-source/monument/story')));OUT.mkdir(parents=True,exist_ok=True)
orientation=os.environ.get('ADDUCO_ORIENTATION','landscape')
scene.frame_end=DURATION*FPS;scene.render.fps=FPS
scene.cycles.samples=int(os.environ.get('ADDUCO_SAMPLES','16'))
scene.render.use_persistent_data=True
scene.render.resolution_x=1080 if orientation=='portrait' else 1920
scene.render.resolution_y=1920 if orientation=='portrait' else 1080
scene.render.resolution_percentage=int(float(os.environ.get('ADDUCO_SCALE','.5'))*100)
scene['reference_purpose']='Deterministic camera, geometry and construction reference for later Higgsfield treatment; not a built project.'
scene['duration_seconds']=DURATION
raw=json.loads((ROOT/'scripts/monument/logo-panels.json').read_text())
polys=[[((x-627)*12/395,(670-y)*12/395+.48) for x,y in p['pixels']] for p in raw]

# Batch reinforcement into meshes: deterministic ribs and ties without thousands of scene objects.
def bar_mesh(name,segments,material):
 verts=[];faces=[]
 for a,b,r in segments:
  a,b=Vector(a),Vector(b);axis=(b-a).normalized();side=axis.cross(Vector((0,1,0)))
  if side.length<.01:side=axis.cross(Vector((1,0,0)))
  side.normalize();up=axis.cross(side);offset=len(verts);n=8
  for end in [a,b]:
   for j in range(n):verts.append(end+r*(math.cos(j*math.tau/n)*side+math.sin(j*math.tau/n)*up))
  faces.extend([(offset+j,offset+(j+1)%n,offset+(j+1)%n+n,offset+j+n) for j in range(n)])
  faces.extend([tuple(offset+j for j in reversed(range(n))),tuple(offset+n+j for j in range(n))])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj);finish(obj,name,material);return obj

def cross_section(poly,value,axis):
 hits=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  if (a[axis]<=value<b[axis]) or (b[axis]<=value<a[axis]):
   q=(value-a[axis])/(b[axis]-a[axis]);hits.append(a[1-axis]+q*(b[1-axis]-a[1-axis]))
 return (min(hits),max(hits)) if len(hits)>=2 else None

def rigid_path(start,end,q,lift=2.0):
 # First transport parallel to the facade; approach normal to the mounting plane last.
 start,end=Vector(start),Vector(end)
 if start.length<.001 and end.length>.001:return rigid_path(end,start,1-q,lift)
 p=smooth(q,0,.72)
 value=start.lerp(end,p);value.y=start.y
 value.z+=lift*math.sin(math.pi*p)
 if q>.72:value.y=start.y+(end.y-start.y)*smooth(q,.72,1)
 return value

def visible(obj,value,frame):
 obj.hide_render=not value;obj.hide_viewport=not value
 obj.keyframe_insert(data_path='hide_render',frame=frame);obj.keyframe_insert(data_path='hide_viewport',frame=frame)

def transform_key(obj,frame):
 for prop in ['location','rotation_euler','scale']:obj.keyframe_insert(data_path=prop,frame=frame)

cube('Rain-soaked construction apron',(0,4,-.29),(110,110,.5),ground,.04)
cube('Shared reinforced foundation',(0,.2,.23),(16,3.6,.5),concrete,.04)
for x in range(-40,41,5):cube('Concrete saw-cut',(x,-10,-.02),(.018,70,.01),black,0)
for y in range(-35,36,5):cube('Concrete saw-cut',(0,y,-.019),(80,.018,.01),black,0)
# All panel shapes and colours come from the supplied mark.
ranked=sorted(range(13),key=lambda i:min(z for x,z in polys[i]))
assemblies=[]
for i,poly in enumerate(polys):
 rank=ranked.index(i);cx=sum(x for x,z in poly)/len(poly);cz=sum(z for x,z in poly)/len(poly);minz=min(z for x,z in poly);maxz=max(z for x,z in poly)
 # Secondary rear steel connections provide support across the graphic joints.
 tri=max(itertools.combinations(poly,3),key=lambda v:abs((v[1][0]-v[0][0])*(v[2][1]-v[0][1])-(v[1][1]-v[0][1])*(v[2][0]-v[0][0])))
 segments=[]
 for a,b in zip(tri,tri[1:]+tri[:1]):
  for y in [-.22,.52]:segments.append(((a[0],y,a[1]),(b[0],y,b[1]),.025))
 z=minz+.12
 while z<maxz-.06:
  bounds=cross_section(list(tri),z,1)
  if bounds and bounds[1]-bounds[0]>.09:
   lo,hi=bounds
   for y in [-.2,.5]:segments.append(((lo,y,z),(hi,y,z),.012))
   for x in [lo,hi]:segments.append(((x,-.2,z),(x,.5,z),.012))
  z+=.19
 x=min(x for x,z in poly)+.12
 while x<max(x for x,z in poly)-.06:
  bounds=cross_section(list(tri),x,0)
  if bounds and bounds[1]-bounds[0]>.1:
   lo,hi=bounds
   for y in [-.2,.5]:
    segments.append(((x,y,lo),(x,y,hi),.019))
    for k in range(int((hi-lo)/.075)):
     z=lo+k*.075;segments.append(((x-.023,y-.018,z-.008),(x+.023,y+.018,z+.008),.0055))
  x+=.26
 bar_mesh(f'Reinforcement cage {i:02}',segments,steel)
 core=extrude(f'Cast concrete {i:02}',poly,-.39,.68,concrete)
 form=empty(f'Formwork front assembly {i:02}')
 backform=empty(f'Formwork back assembly {i:02}')
 # Front and rear triangular shuttering enclose the cast volume.
 extrude(f'Formwork front {i:02}',poly,-.57,-.47,wood,form)
 extrude(f'Formwork back {i:02}',poly,.74,.83,wood,backform)
 for owner,y0,y1 in [(form,-.47,.15),(backform,.15,.74)]:
  sideverts=[];sidefaces=[]
  for a,b in zip(poly,poly[1:]+poly[:1]):
   n=len(sideverts);sideverts.extend([(a[0],y0,a[1]),(b[0],y0,b[1]),(b[0],y1,b[1]),(a[0],y1,a[1])]);sidefaces.append((n,n+1,n+2,n+3))
  mesh=bpy.data.meshes.new(f'Shuttering sides {i}');mesh.from_pydata(sideverts,[],sidefaces);mesh.update()
  side=bpy.data.objects.new(f'Closed shuttering sides {i}',mesh);scene.collection.objects.link(side);finish(side,side.name,wood,owner)

 for a,b in zip(tri,tri[1:]+tri[:1]):
  for y in [-.63,.88]:rod(f'Shuttering edge strongback {i}',(a[0],y,a[1]),(b[0],y,b[1]),.052,galvanized,form if y<0 else backform,8)
 for x,z in tri:
  xx=cx+(x-cx)*.64;zz=cz+(z-cz)*.64
  rod('Formwork through tie',(xx,-.69,zz),(xx,.91,zz),.017,galvanized,form,8)
  rod('Wing nut',(xx,-.73,zz),(xx,-.65,zz),.041,black,form,6)
 red=mat(f'Original enamel face {i:02}',tuple(((v/255+.055)/1.055)**2.4 for v in raw[i]['rgb']),.32,.42,.025)
 cladding=empty(f'Cladding rigid assembly {i:02}')
 face=extrude(f'Original logo metal {i:02}',poly,-.63,-.51,red,cladding)
 for x,z in tri:
  xx=cx+(x-cx)*.72;zz=cz+(z-cz)*.72
  rod('Countersunk metal fixing',(xx,-.66,zz),(xx,-.627,zz),.022,galvanized,cladding,6)
 # Fixed anchors on the cured substrate. Small enough to stay behind its traced silhouette.
 anchors=[]
 for dz in [-.12,.12]:anchors.append(cube('Concealed fixing rail',(cx,-.46,cz+dz),(.45,.09,.045),galvanized,.006))
 # A real rest position on a storage rack, with the lower edge at slab height.
 form_park=Vector((-15-cx,-1.8-rank*.13,.05-minz))
 red_park=Vector((15-cx,-2.2-rank*.13,.05-minz))
 lift=[]
 for label in ['form','back','red']:
  cables=[rod(f'{label} lifting sling {i}',(cx,-1,cz),(cx,-1,17),.013,black,vertices=8) for _ in range(2)]
  trolley=cube(f'{label} trolley {i}',(cx,0,17),(.48,.45,.2),yellow,.015)
  bridge=cube(f'{label} travelling bridge {i}',(0,0,17.2),(37,.14,.24),yellow,.012)
  lift.append((cables,trolley,bridge))
 assemblies.append(dict(i=i,rank=rank,poly=poly,cx=cx,cz=cz,maxz=maxz,form=form,back=backform,red=cladding,core=core,anchors=anchors,form_park=form_park,back_park=Vector((-15-cx,3.5+rank*.13,.05-minz)),red_park=red_park,lift=lift))
# Continuous rear A-shaped support follows the same silhouette and holds all construction stages.
for a,b in [((-6.4,1,.5),(0,1,12)),((0,1,12),(6.4,1,.5)),((-3.4,1,5.7),(3.4,1,5.7))]:rod('Rear structural steel',a,b,.105,galvanized,vertices=12)
for x in [-6.4,6.4,0]:
 cube('Foundation anchor shoe',(x,.65,.54),(.55,.6,.1),galvanized,.015)
 for dx in [-.2,.2]:rod('Foundation anchor bolt',(x+dx,.42,.47),(x+dx,.42,.67),.025,galvanized,vertices=8)
# Four supported rails span the storage area and active workfront.
for x in [-18.5,18.5]:
 for y in [-8,8]:
  cube('Gantry mast',(x,y,8.5),(.45,.5,17),yellow,.025)
  cube('Gantry foundation',(x,y,.15),(2,2,.3),concrete,.04)
  rod('Gantry knee brace',(x,y,12),(x,y+(2 if y<0 else -2),16.8),.09,black)
 cube('Travelling gantry rail',(x,0,17.35),(.35,17,.5),yellow,.025)
for x in [-15,15]:
 for y in [-2,-3,-4]:cube('Panel storage bearers',(x,y,.02),(6,.18,.12),wood,.008)
# Background structural frame with a clear contemporary construction scale.
for x in [-24,-16,-8,0,8,16,24]:
 for y in [17,26]:cube('Background column',(x,y,4.5),(.6,.6,9),concrete,.025)
for z in [4.4,8.8]:cube('Supported background slab',(0,21,z),(52,12,.38),concrete,.025)
# Pump truck and articulated delivery hose: active while shuttering is closed.
cube('Concrete pump chassis',(11,5,.8),(2.5,5.2,.42),black,.06)
cube('Concrete pump cab',(11,3.3,1.65),(2.2,1.6,1.9),yellow,.09)
glass=mat('Cab glazing',(.06,.1,.12),.19,.4)
cube('Cab windscreen',(11,2.47,2),(1.95,.04,.8),glass,.025)
for x in [9.72,12.28]:
 for y in [3.7,6.6]:rod('Pump truck tyre',(x-.16,y,.6),(x+.16,y,.6),.52,black,vertices=20)
for x in [8.7,13.3]:rod('Pump stabilizer',(11,5,.85),(x,5,.25),.08,galvanized);cube('Pump stabilizer pad',(x,5,.12),(.5,.5,.14),black,.015)
for a,b in [((11,5,1.5),(11,5,10)),((11,5,10),(4,3,12.5)),((4,3,12.5),(2,1,9.5))]:
 rod('Articulated pump boom',a,b,.12,yellow,vertices=10)
 rod('Concrete delivery pipe',(a[0]+.18,a[1],a[2]),(b[0]+.18,b[1],b[2]),.058,black,vertices=10)
rod('Flexible delivery hose',(2.18,1,9.5),(2.2,.4,7.4),.075,black,vertices=12)
# Working platforms are functional access, kept clear of the final face.
for x in [-8,8]:
 for y in [1,2.5]:
  for xx in [x-.65,x+.65]:rod('Scaffold standard',(xx,y,.5),(xx,y,6.6),.03,galvanized)
 for z in [1.5,3.5,5.5]:
  cube('Scaffold deck',(x,1.75,z),(1.45,1.7,.07),wood,.009)
  rod('Guard rail',(x-.65,1,z+.9),(x+.65,1,z+.9),.025,galvanized)
 rod('Scaffold diagonal',(x-.65,1,.7),(x+.65,1,6.2),.02,galvanized)
for x,y in [(-7,-2),(8,-1),(14,9)]:
 rod('Task light mast',(x,y,0),(x,y,3),.04,galvanized)
 for dx,dy in [(.55,0),(-.3,.5),(-.3,-.5)]:rod('Task light tripod',(x,y,.7),(x+dx,y+dy,.04),.025,black)
 cube('Task light housing',(x,y,3.15),(.4,.18,.3),black,.025)
 light('Warm practical',(x,y-.15,3.2),750,(1,.62,.32),.4,(0,0,4))
light('Overcast sky key',(-4,-10,16),1100,(.62,.74,1),12,(0,0,4))
light('Warm construction rake',(8,-4,8),1300,(1,.69,.43),5,(0,0,4))
light('Cool edge',(0,7,13),2500,(.45,.62,1),8,(0,0,6))
bpy.ops.object.camera_add();camera=bpy.context.object;camera.name=f'Full story camera {orientation}';scene.camera=camera
camera.data.lens=48;camera.data.clip_start=.05;camera.data.clip_end=250
if orientation=='portrait':camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=36

for frame in range(1,DURATION*FPS+1):
 t=(frame-1)/(DURATION*FPS-1)*DURATION
 for a in assemblies:
  state=panel_state(t,a['rank'])
  a['form'].location=rigid_path(a['form_park'],(0,0,0),state['form_in'],2.3) if state['form_removed']==0 else rigid_path((0,0,0),a['form_park'],state['form_removed'],2.8)
  a['back'].location=rigid_path(a['back_park'],(0,0,0),state['form_in'],2.3) if state['form_removed']==0 else rigid_path((0,0,0),a['back_park'],state['form_removed'],2.8)
  transform_key(a['back'],frame)
  a['red'].location=rigid_path(a['red_park'],(0,0,0),state['cladding'],2.3)
  transform_key(a['form'],frame);transform_key(a['red'],frame)
  visible(a['core'],state['cast'],frame)
  for anchor in a['anchors']:visible(anchor,state['cast'],frame)
  for owner,rig,active in [(a['form'],a['lift'][0],0<state['form_in']<1 or 0<state['form_removed']<1),(a['back'],a['lift'][1],0<state['form_in']<1 or 0<state['form_removed']<1),(a['red'],a['lift'][2],0<state['cladding']<1)]:
   cables,trolley,bridge=rig
   base_y=.88 if owner==a['back'] else -.63
   top=Vector((a['cx']+owner.location.x,base_y+owner.location.y,17.05))
   trolley.location=top;bridge.location.y=top.y
   for obj in [trolley,bridge]:visible(obj,active,frame);transform_key(obj,frame)
   for j,cable in enumerate(cables):
    end=Vector((a['cx']+(-.1 if j==0 else .1),base_y,a['maxz']-.12))+owner.location
    delta=top-end;cable.location=(top+end)/2;cable.rotation_euler=delta.to_track_quat('Z','Y').to_euler();cable.scale.z=delta.length/(17-a['cz'])
    visible(cable,active,frame);transform_key(cable,frame)
 camera.location,target=camera_pose(t,orientation);aim(camera,target);transform_key(camera,frame)
scene.frame_set(1)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'adduco-story-{orientation}.blend'))
frames=[int(f) for f in os.environ.get('ADDUCO_FRAMES','1,120,192,288,384,480').split(',')]
for frame in frames:
 scene.frame_set(frame);scene.render.filepath=str(OUT/'controls'/orientation/f'{frame-1:04}.png');Path(scene.render.filepath).parent.mkdir(parents=True,exist_ok=True);bpy.ops.render.render(write_still=True)
print('ADDUCO_STORY_BUILT',orientation,len(bpy.data.objects),flush=True)
