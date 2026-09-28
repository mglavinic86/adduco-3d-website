"""Audit the baked Blender artifact through its final world geometry and camera projection."""
import bpy,json,os,math
from pathlib import Path
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector
root=Path(__file__).resolve().parents[2];scene=bpy.context.scene
raw=json.loads((root/'scripts/monument/logo-panels.json').read_text())
faces=sorted((o for o in scene.objects if o.name.startswith('Original logo metal')),key=lambda o:o.name)
assert len(faces)==13, 'The original mark has thirteen faces'
scene.frame_set(480);bounds=[];max_error=0
for i,obj in enumerate(faces):
 expected=[Vector(((x-627)*12/395,-.63,(670-y)*12/395+.48)) for x,y in raw[i]['pixels']]
 actual=[obj.matrix_world@v.co for v in obj.data.vertices[:len(expected)]]
 for a,b in zip(expected,actual):max_error=max(max_error,(a-b).length)
 assert obj.parent.scale==Vector((1,1,1)), 'Rigid cladding must not be stretched'
 for v in actual:bounds.append(world_to_camera_view(scene,scene.camera,v))
assert max_error<1e-5, 'Final world-space face must equal the traced source coordinates'
bbox={'left':min(v.x for v in bounds),'right':max(v.x for v in bounds),'bottom':min(v.y for v in bounds),'top':max(v.y for v in bounds)}
assert bbox['left']>=.04 and bbox['right']<=.96 and bbox['bottom']>=.04 and bbox['top']<=.96, str(bbox)
for frame,expected in [(1,False),(192,True),(480,True)]:
 scene.frame_set(frame)
 assert all((not o.hide_render)==expected for o in scene.objects if o.name.startswith('Cast concrete ')), (frame,'cast state')
result={'master':Path(bpy.data.filepath).name,'faces':len(faces),'maxFinalVertexErrorMetres':max_error,'finalCameraBoundingBoxNormalized':bbox,'castVisibilityChecks':[1,192,480],'frameEnd':scene.frame_end}
out=root/'assets-source/monument/story'/('audit-'+os.environ.get('ADDUCO_ORIENTATION','landscape')+'.json');out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
