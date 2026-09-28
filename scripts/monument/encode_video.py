"""Read-only comparison derivatives of the same 144 rendered frames."""
from pathlib import Path
import subprocess, os
ROOT=Path(__file__).resolve().parents[2]
source=Path('/tmp/adduco-monument-renders')
out=ROOT/'public/assets/pilot/video';out.mkdir(parents=True,exist_ok=True)
for orientation in ([os.environ['ADDUCO_ORIENTATION']] if os.environ.get('ADDUCO_ORIENTATION') else ['landscape','portrait']):
 if len(list((source/orientation).glob('*.png')))!=144:raise RuntimeError('Incomplete render: '+orientation)
 for gop in [1,4,8]:
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','24','-i',str(source/orientation/'%04d.png'),'-frames:v','144','-c:v','libx264','-preset','slow','-crf','20','-g',str(gop),'-keyint_min',str(gop),'-sc_threshold','0','-bf','0','-pix_fmt','yuv420p','-movflags','+faststart',str(out/f'{orientation}-g{gop}.mp4')],check=True)
for p in out.glob('*.mp4'):print(p.name,p.stat().st_size)
