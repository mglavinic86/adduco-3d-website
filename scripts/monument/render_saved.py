"""Render the approved pilot's baked camera; resume existing frames safely."""
import bpy,os
from pathlib import Path
out=Path(os.environ.get('ADDUCO_RENDER_DIR','/tmp/adduco-monument-renders'))
orientation=os.environ.get('ADDUCO_ORIENTATION','landscape')
prefs=bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
scene=bpy.context.scene;scene.cycles.device='GPU';scene.render.use_persistent_data=True
scene.cycles.samples=32
for frame in range(1,145):
 path=out/orientation/f'{frame-1:04}.png'
 if path.exists() and os.environ.get('ADDUCO_RESUME')=='1':continue
 scene.frame_set(frame);scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)
print('ADDUCO_FULL_PILOT_COMPLETE',orientation)
