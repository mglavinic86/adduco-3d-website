"""Construction order is a public production contract, independent of Blender."""
import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts/monument'))
from story_timeline import panel_state, camera_pose, DURATION, FPS

class FullStory(unittest.TestCase):
 def test_opening_is_reinforcement_and_finale_has_all_thirteen_faces(self):
  for rank in range(13):
   self.assertFalse(panel_state(0,rank)['cast'])
   self.assertEqual(panel_state(DURATION,rank)['cladding'],1)
   self.assertEqual(panel_state(DURATION,rank)['form_removed'],1)
 def test_concrete_only_appears_behind_closed_formwork(self):
  for rank in range(13):
   previous=False
   for frame in range(int(DURATION*FPS)+1):
    state=panel_state(frame/FPS,rank)
    if state['cast'] and not previous:
     self.assertEqual(state['form_in'],1)
     self.assertEqual(state['form_removed'],0)
    if state['cladding']>0:self.assertEqual(state['form_removed'],1)
    previous=state['cast']
 def test_camera_continuously_retreats_and_rises_in_both_compositions(self):
  for orientation in ['landscape','portrait']:
   poses=[camera_pose(i/FPS,orientation)[0] for i in range(int(DURATION*FPS)+1)]
   for a,b in zip(poses,poses[1:]):
    self.assertLessEqual(b[1],a[1])
    self.assertGreaterEqual(b[2],a[2])
   self.assertNotEqual(poses[0],poses[-1])
if __name__=='__main__':unittest.main()
