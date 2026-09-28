"""Orthographic unlit geometry reference. Does not overwrite either animated master."""
import bpy,json,sys
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[2];out=root/'deliverables/adduco-story';out.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene;scene.frame_set(480)
faces=[o for o in scene.objects if o.name.startswith('Original logo metal')]
for o in scene.objects:
 o.animation_data_clear()
 o.hide_render=o not in faces
scene.render.engine='BLENDER_EEVEE';scene.eevee.taa_render_samples=16;scene.eevee.use_raytracing=False
scene.render.resolution_x=1024;scene.render.resolution_y=1024;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=0
bpy.ops.object.camera_add(location=(0,-30,6.48));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,6.48))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=16;scene.camera=camera
raw=json.loads((root/'scripts/monument/logo-panels.json').read_text());materials=[]
for i,o in enumerate(sorted(faces,key=lambda o:o.name)):
 m=bpy.data.materials.new('Flat brand reference');m.use_nodes=True;m.node_tree.nodes.clear()
 shader=m.node_tree.nodes.new('ShaderNodeEmission');shader.inputs['Color'].default_value=(*tuple(((v/255+.055)/1.055)**2.4 for v in raw[i]['rgb']),1)
 output=m.node_tree.nodes.new('ShaderNodeOutputMaterial');m.node_tree.links.new(shader.outputs[0],output.inputs['Surface']);o.data.materials.clear();o.data.materials.append(m);materials.append(shader)
scene.render.filepath=str(out/'brand-front.png');bpy.ops.render.render(write_still=True)
for m in materials:m.inputs['Color'].default_value=(1,1,1,1)
scene.render.filepath=str(out/'brand-mask.png');bpy.ops.render.render(write_still=True)
print('EXPORTED_SYMBOL_REFERENCES')
