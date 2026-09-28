import importlib.util
from pathlib import Path
import unittest
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('trace',ROOT/'scripts/monument/trace_logo.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class LogoGeometry(unittest.TestCase):
 def test_original_thirteen_panels_preserve_negative_space(self):
  panels=module.trace(ROOT/'adduco logo/adduco logo.png')
  self.assertEqual(len(panels),13)
  original=np.array(Image.open(ROOT/'adduco logo/adduco logo.png').convert('RGB'))
  mask=(original[:,:,0]>65)&(original[:,:,0]>original[:,:,1]*1.8)&(original[:,:,0]>original[:,:,2]*1.7)
  mask[700:]=False; mask[:250]=False
  image=Image.new('1',(original.shape[1],original.shape[0]))
  draw=ImageDraw.Draw(image)
  for panel in panels: draw.polygon([tuple(v) for v in panel['pixels']],fill=1)
  reconstructed=np.array(image,dtype=bool)
  self.assertGreater((mask&reconstructed).sum()/(mask|reconstructed).sum(),.98)
if __name__=='__main__': unittest.main()
