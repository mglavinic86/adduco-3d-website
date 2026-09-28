"""Seconds-based deterministic construction choreography, shared by both cameras."""
DURATION=20
FPS=24

def smooth(t,a,b):
 p=max(0,min(1,(t-a)/(b-a)))
 return p*p*(3-2*p)

def panel_state(t,rank):
 return {'form_in':smooth(t,3.2+rank*.09,4.7+rank*.09),
         'cast':t>=6.6+rank*.015,
         'form_removed':smooth(t,8+rank*.09,9.4+rank*.09),
         'cladding':smooth(t,11+rank*.24,12.8+rank*.24)}

def camera_pose(t,orientation):
 if orientation=='portrait':
  keys=[(0,(5.7,-3.7,2.35),(4.65,0,2.3)),(4,(7,-8,4.2),(3.6,0,3.5)),(8,(8,-15,6.2),(1.8,0,4.4)),(12,(6,-26,8),(0,0,4.8)),(16,(3,-34,9),(0,0,4.5)),(20,(1,-38,9.8),(0,0,4.5))]
 else:
  keys=[(0,(5.8,-3.5,2.3),(4.45,0,2.4)),(4,(8,-8,4.1),(3.2,0,3.5)),(8,(10,-15,6.1),(1.6,0,5)),(12,(9,-23,8),(0,0,5.6)),(16,(7,-31,9.3),(-1.8,0,5.8)),(20,(5,-38,10.4),(-3,0,5.8))]
 for k,((a,pa,ta),(b,pb,tb)) in enumerate(zip(keys,keys[1:])):
  if t<=b:
   p=max(0,min(1,(t-a)/(b-a)));h=b-a
   before=keys[max(0,k-1)];after=keys[min(len(keys)-1,k+2)]
   def interpolate(slot):
    result=[]
    for j in range(3):
     va,vb=keys[k][slot][j],keys[k+1][slot][j]
     ma=(vb-before[slot][j])/(b-before[0]);mb=(after[slot][j]-va)/(after[0]-a)
     result.append((2*p**3-3*p*p+1)*va+(p**3-2*p*p+p)*h*ma+(-2*p**3+3*p*p)*vb+(p**3-p*p)*h*mb)
    return tuple(result)
   return interpolate(1),interpolate(2)
 return keys[-1][1:]
