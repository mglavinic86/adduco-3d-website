"""Encode locally authored Blender outputs; never alter the supplied brand image."""
from pathlib import Path
from PIL import Image
import json, hashlib
ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path('/tmp/adduco-monument-renders')
report={}
for orientation in ['landscape','portrait']:
 out=ROOT/'public/assets/pilot'/orientation;out.mkdir(parents=True,exist_ok=True)
 sizes=[]
 for source in sorted((SOURCE/orientation).glob('*.png')):
  try:
   image=Image.open(source);image.load()
  except OSError:continue
  target=out/(source.stem+'.webp');image.save(target,'WEBP',quality=78,method=6)
  sizes.append(target.stat().st_size)
 report[orientation]={'frames':len(sizes),'bytes':sum(sizes),'width':image.width if sizes else None,'height':image.height if sizes else None}
print(json.dumps(report,indent=2))
(ROOT/'scripts/monument/render-manifest.json').write_text(json.dumps({'fps':24,'intendedFrames':144,'sourceLogoSha256':hashlib.sha256((ROOT/'adduco logo/adduco logo.png').read_bytes()).hexdigest(),'variants':report},indent=2)+'\n')
