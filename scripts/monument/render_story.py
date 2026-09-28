"""Resume only an unchanged baked master. Frames and reference films stay outside website payload."""
import bpy,os,time,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[2]
scene=bpy.context.scene
orientation=os.environ.get('ADDUCO_ORIENTATION','landscape')
output=Path(os.environ.get('ADDUCO_STORY_RENDER_DIR','/tmp/adduco-full-story'))
folder=output/orientation;folder.mkdir(parents=True,exist_ok=True)
engine=os.environ.get('ADDUCO_ENGINE','CYCLES');scene.render.engine=engine
scene.render.resolution_percentage=int(os.environ.get('ADDUCO_PERCENT','50'))
if engine=='CYCLES':
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
 for device in prefs.devices:device.use=device.type=='METAL'
 scene.cycles.device='GPU';scene.cycles.samples=int(os.environ.get('ADDUCO_SAMPLES','16'));scene.render.use_persistent_data=True
else:
 scene.eevee.taa_render_samples=int(os.environ.get('ADDUCO_SAMPLES','32'))
 scene.eevee.use_raytracing=True
frames=[int(x) for x in os.environ['ADDUCO_FRAMES'].split(',')] if os.environ.get('ADDUCO_FRAMES') else range(1,scene.frame_end+1)
settings={'engine':engine,'percent':scene.render.resolution_percentage,'samples':int(os.environ.get('ADDUCO_SAMPLES','16' if engine=='CYCLES' else '32')),'masterSha256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()}
manifest=folder/'render-settings.json'
if manifest.exists() and json.loads(manifest.read_text())!=settings and any(folder.glob('*.png')):raise RuntimeError('Changed master/settings: choose a new output directory, do not mix renders.')
manifest.write_text(json.dumps(settings,indent=2)+'\n')
start=time.monotonic()
for frame in frames:
 path=folder/f'{frame-1:04}.png'
 if os.environ.get('ADDUCO_RESUME')=='1' and path.exists():continue
 scene.frame_set(frame);scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)
 print('STORY_FRAME',orientation,frame,'seconds',round(time.monotonic()-start,1),flush=True)
print('ADDUCO_STORY_RENDER_COMPLETE',orientation,flush=True)
