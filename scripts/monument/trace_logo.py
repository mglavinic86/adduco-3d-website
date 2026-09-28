"""Trace the supplied raster's thirteen disconnected red faces; never synthesize a mark."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

def hull(points):
 p=sorted(set(points))
 def cross(a,b,c): return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
 def half(seq):
  out=[]
  for v in seq:
   while len(out)>1 and cross(out[-2],out[-1],v)<=0: out.pop()
   out.append(v)
  return out
 return half(p)[:-1]+half(p[::-1])[:-1]

def trace(path):
 a=np.array(Image.open(path).convert('RGB')).astype(float)
 mask=(a[:,:,0]>65)&(a[:,:,0]>a[:,:,1]*1.8)&(a[:,:,0]>a[:,:,2]*1.7)
 mask[700:]=False; mask[:250]=False
 panels=[]
 for y,x in zip(*np.where(mask)):
  if not mask[y,x]: continue
  stack=[(int(x),int(y))]; mask[y,x]=False; points=[]
  while stack:
   xx,yy=stack.pop(); points.append((xx,yy))
   for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
    nx,ny=xx+dx,yy+dy
    if 0<=ny<mask.shape[0] and 0<=nx<mask.shape[1] and mask[ny,nx]:
     mask[ny,nx]=False; stack.append((nx,ny))
  if len(points)<1000: continue
  polygon=hull(points)
  rgb=np.median([a[yy,xx] for xx,yy in points],axis=0).astype(int).tolist()
  panels.append({'pixels':polygon,'rgb':rgb})
 return sorted(panels,key=lambda p:sum(v[1] for v in p['pixels']))
if __name__=='__main__':
 root=Path(__file__).resolve().parents[2]
 panels=trace(root/'adduco logo/adduco logo.png')
 (Path(__file__).parent/'logo-panels.json').write_text(json.dumps(panels,indent=2)+'\n')
 print(f'Traced {len(panels)} panels')
