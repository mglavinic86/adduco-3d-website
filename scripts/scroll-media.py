# Run only in Higgsfield sandbox. Original-source encodes; no new video generation.
import subprocess as sp,json,zipfile,re,time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
root=Path('/home/user/adduco-scroll-selected');root.mkdir(exist_ok=True);out=root/'output';out.mkdir(exist_ok=True)
sources={'landscape':'https://d8j0ntlcm91z4.cloudfront.net/user_3EgWxUve03N2S8I03MuafhGEfbZ/hf_20260915_190739_83bee30f-abd2-4f75-9d09-5c1af2921dfa.mp4','portrait':'https://d8j0ntlcm91z4.cloudfront.net/user_3EgWxUve03N2S8I03MuafhGEfbZ/hf_20260915_191145_6d658000-6802-4572-8356-74c5eb5b0138.mp4'}
def run(a):return sp.run(a,check=True,capture_output=True,text=True)
for orient,url in sources.items():
 p=root/f'{orient}-source.mp4'
 if not p.exists():run(['curl','-fsSL',url,'-o',str(p)])
variants={
'h264':['-c:v','libx264','-preset','slow','-crf','20','-g','24','-keyint_min','24','-sc_threshold','0','-bf','0','-threads','4'],
'hevc':['-c:v','libx265','-preset','slow','-crf','22','-tag:v','hvc1','-x265-params','keyint=24:min-keyint=24:scenecut=0:bframes=0:open-gop=0:pools=4:frame-threads=2'],
'av1':['-c:v','libsvtav1','-preset','6','-crf','25','-g','12','-svtav1-params','lp=4:fast-decode=1']}
report={'sources':sources,'variants':variants,'results':{}}
def encode(item):
 orient,name=item;source=root/f'{orient}-source.mp4';p=out/f'{orient}-{name}.mp4'
 scale='scale=900:1600:flags=lanczos' if orient=='portrait' else 'null'
 t=time.time()
 run(['ffmpeg','-y','-v','error','-i',str(source),'-vf',f'{scale},settb=1/24,setpts=N','-r','24','-an',*variants[name],'-pix_fmt','yuv420p','-movflags','+faststart',str(p)])
 quality=run(['ffmpeg','-v','info','-i',str(source),'-i',str(p),'-filter_complex',f'[0:v]{scale},settb=1/24,setpts=N[ref];[1:v]settb=1/24,setpts=N[dist];[dist][ref]ssim','-an','-f','null','-']).stderr
 ssim=float(re.search(r'All:([0-9.]+)',quality).group(1))
 result={'bytes':p.stat().st_size,'ssim':ssim,'seconds':round(time.time()-t,1),'probe':json.loads(run(['ffprobe','-v','quiet','-show_entries','stream=codec_name,profile,width,height,avg_frame_rate,nb_frames:format=duration','-of','json',str(p)]).stdout)}
 print(p.name,result,flush=True)
 # Same decoded middle frame for visual comparison.
 run(['ffmpeg','-y','-v','error','-i',str(p),'-vf','select=eq(n\\,96)','-frames:v','1',str(out/f'{orient}-{name}.png')])
 return p.name,result
with ThreadPoolExecutor(max_workers=2) as ex:
 for name,result in ex.map(encode,[(o,v) for o in sources for v in variants]):report['results'][name]=result
(out/'report.json').write_text(json.dumps(report,indent=2))
with zipfile.ZipFile(root/'candidates.zip','w',zipfile.ZIP_STORED) as z:
 for p in out.iterdir():z.write(p,p.name)
print('DONE',flush=True)

