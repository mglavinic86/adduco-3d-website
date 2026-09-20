import subprocess as sp,json,zipfile,hashlib,re,math
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image,ImageChops,ImageStat
root=Path('/home/user/adduco-all-scroll');root.mkdir(exist_ok=True)
sources={"portrait2":"https://d8j0ntlcm91z4.cloudfront.net/user_3EgWxUve03N2S8I03MuafhGEfbZ/hf_20260915_191145_460f59fb-41bc-4318-94d6-47dd2111df4b.mp4","portrait3":"https://d8j0ntlcm91z4.cloudfront.net/user_3EgWxUve03N2S8I03MuafhGEfbZ/hf_20260915_191835_a0a77647-21b8-4282-b9ea-dc9aa09b36d1.mp4","landscape2":"https://d8j0ntlcm91z4.cloudfront.net/user_3EgWxUve03N2S8I03MuafhGEfbZ/hf_20260915_190908_400576cb-2471-4ce8-bce0-4ebd5f8ac7f9.mp4","landscape3":"https://d8j0ntlcm91z4.cloudfront.net/user_3EgWxUve03N2S8I03MuafhGEfbZ/hf_20260915_191835_c08b95fa-4934-4e1c-ac9b-c49fde6f0c16.mp4"}
variants={'h264':['-c:v','libx264','-preset','slow','-crf','20','-g','24','-keyint_min','24','-sc_threshold','0','-bf','0','-threads','4'],'hevc':['-c:v','libx265','-preset','slow','-crf','22','-tag:v','hvc1','-x265-params','keyint=24:min-keyint=24:scenecut=0:bframes=0:open-gop=0:pools=4:frame-threads=2'],'av1':['-c:v','libsvtav1','-preset','6','-crf','25','-g','12','-svtav1-params','lp=4:fast-decode=1']}
def run(c):return sp.run(c,check=True,capture_output=True,text=True)
def probe(p):return json.loads(run(['ffprobe','-v','quiet','-show_entries','stream=codec_name,width,height,avg_frame_rate,nb_frames:format=duration,size','-of','json',str(p)]).stdout)
def encode(item):
 n,o,c=item;out=root/f'segment-{n}';out.mkdir(exist_ok=True);source=root/f'{o}{n}.mp4';p=out/f'{o}-{c}.mp4'
 scale='scale=900:1600:flags=lanczos' if o=='portrait' else 'null'
 run(['ffmpeg','-y','-v','error','-i',str(source),'-vf',f'{scale},settb=1/24,setpts=N','-r','24','-an',*variants[c],'-pix_fmt','yuv420p','-movflags','+faststart',str(p)])
 meta=probe(p);meta.update({'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 q=run(['ffmpeg','-v','info','-i',str(source),'-i',str(p),'-filter_complex',f'[0:v]{scale},settb=1/24,setpts=N[ref];[1:v]settb=1/24,setpts=N[dist];[dist][ref]ssim','-an','-f','null','-']).stderr;meta['ssim']=float(re.search(r'All:([0-9.]+)',q).group(1))
 last=int(meta['streams'][0]['nb_frames'])-1
 for label,idx in [('start',0),('end',last)]:
  png=out/f'{o}-{c}-{label}.png';run(['ffmpeg','-y','-v','error','-i',str(p),'-vf',f'select=eq(n\\,{idx})','-frames:v','1',str(png)])
  if c=='av1':Image.open(png).save(out/f'{o}-{label}.webp','WEBP',quality=92,method=6)
 print(f'segment{n}/{o}-{c}',meta['bytes'],meta['ssim'],meta['format']['duration'],flush=True)
 return p.name,meta
for n in [2,3]:
 for o in ['portrait','landscape']:run(['curl','-fsSL',sources[f'{o}{n}'],'-o',str(root/f'{o}{n}.mp4')])
 report={'sources':{o:sources[f'{o}{n}'] for o in ['portrait','landscape']},'variants':variants,'files':{}}
 with ThreadPoolExecutor(max_workers=2) as ex:
  for name,meta in ex.map(encode,[(n,o,c) for o in ['portrait','landscape'] for c in variants]):report['files'][name]=meta
 out=root/f'segment-{n}';(out/'manifest.json').write_text(json.dumps(report,indent=2))
 archive=root/f'segment-{n}.zip'
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_STORED) as z:
  for p in out.iterdir():z.write(p,p.name)

 print('Archive ready:',archive,flush=True)
