"""Package both complete, validated reference timelines; never download or generate AI media."""
from pathlib import Path
import json,subprocess,shutil,hashlib,sys,zipfile
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parent))
from story_timeline import FPS,DURATION,camera_pose
ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path('/tmp/adduco-full-story')
OUT=ROOT/'deliverables/adduco-story';OUT.mkdir(parents=True,exist_ok=True)
CUTS=[0,96,192,288,384,479]
PHASES=['armatura','oplata','beton','montaza','otkrivanje']
manifest={'purpose':'Local Blender reference for later Higgsfield treatment; no AI generation/upload performed','fps':FPS,'durationSeconds':DURATION,'framesPerOrientation':480,'keyframeIndices':CUTS,'variants':{},'shots':[]}

def encode(source,dest,first=0,last=479):
 dest.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate',str(FPS),'-start_number',str(first),'-i',str(source/'%04d.png'),'-frames:v',str(last-first+1),'-c:v','libx264','-preset','slow','-crf','18','-g','8','-keyint_min','8','-sc_threshold','0','-bf','0','-pix_fmt','yuv420p','-movflags','+faststart',str(dest)],check=True)

def bundle():
 with zipfile.ZipFile(OUT.parent/'adduco-higgsfield-reference.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
  for p in OUT.rglob('*'):
   if p.is_file() and p.suffix!='.zip':archive.write(p,'reference/'+str(p.relative_to(OUT)))
  for orientation in ['landscape','portrait']:
   p=ROOT/'assets-source/monument/story'/f'adduco-story-{orientation}.blend';archive.write(p,'blender/'+p.name)
  archive.write(ROOT/'adduco logo/adduco logo.png','brand/original-adduco-logo.png')
 shutil.move(str(OUT.parent/'adduco-higgsfield-reference.zip'),str(OUT/'adduco-higgsfield-reference.zip'))

if "--zip-only" in sys.argv:
 bundle();raise SystemExit(0)

for orientation in ['landscape','portrait']:
 source=SOURCE/orientation
 files=sorted(source.glob('*.png'))
 if [p.stem for p in files]!=[f'{i:04}' for i in range(480)]:raise RuntimeError('Incomplete story: '+orientation)
 sizes=set()
 for p in files:
  with Image.open(p) as image:image.verify()
  with Image.open(p) as image:image.load();sizes.add(image.size)
 if len(sizes)!=1:raise RuntimeError('Mixed render dimensions')
 film=OUT/f'adduco-story-{orientation}.mp4';encode(source,film)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=nb_frames,r_frame_rate,duration','-of','json',str(film)]))['streams'][0]
 if int(probe['nb_frames'])!=480 or probe['r_frame_rate']!='24/1' or abs(float(probe['duration'])-20)>.001:raise RuntimeError('Unexpected encoded timeline')
 for i,frame in enumerate(CUTS):
  target=OUT/'keyframes'/orientation;target.mkdir(parents=True,exist_ok=True)
  shutil.copy2(source/f'{frame:04}.png',target/f'{i:02}-{frame:04}.png')
  # Comparison export of the exact same sampled image, not an invented AI endpoint.
  Image.open(source/f'{frame:04}.png').save(target/f'{i:02}-{frame:04}.webp','WEBP',quality=88,method=6)
 for index,name in enumerate(PHASES):
  clip=OUT/'clips'/orientation/f'{index+1:02}-{name}.mp4';encode(source,clip,CUTS[index],CUTS[index+1])
  manifest['shots'].append({'orientation':orientation,'phase':name,'clip':str(clip.relative_to(OUT)),'firstSourceFrame':CUTS[index],'lastSourceFrame':CUTS[index+1],'firstImage':f'keyframes/{orientation}/{index:02}-{CUTS[index]:04}.png','lastImage':f'keyframes/{orientation}/{index+1:02}-{CUTS[index+1]:04}.png','durationSeconds':(CUTS[index+1]-CUTS[index]+1)/FPS})
 camera=[{'frame':i,'sourceSeconds':i/FPS,'choreographySeconds':i/479*20,'position':camera_pose(i/479*20,orientation)[0],'target':camera_pose(i/479*20,orientation)[1]} for i in range(480)]
 (OUT/f'camera-{orientation}.json').write_text(json.dumps({'lensMm':48,'sensorFit':'VERTICAL' if orientation=='portrait' else 'AUTO','poses':camera},indent=2)+'\n')
 manifest['variants'][orientation]={'render':json.loads((source/'render-settings.json').read_text()),'width':next(iter(sizes))[0],'height':next(iter(sizes))[1],'filmBytes':film.stat().st_size,'filmSha256':hashlib.sha256(film.read_bytes()).hexdigest(),'frameHashes':[hashlib.sha256(p.read_bytes()).hexdigest() for p in files]}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
shutil.copy2(ROOT/'public/assets/adduco-logo-dark.webp',OUT/'adduco-logo.webp')
bundle()
print(json.dumps({k:{key:v[key] for key in ['width','height','filmBytes']} for k,v in manifest['variants'].items()},indent=2))
