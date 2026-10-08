import json, sys
from PIL import Image
# zoom.py type set frameIdx scale [x0 y0 x1 y1]
S='tools/sprite-lab/gen/econ/'
t=sys.argv[1]; st=sys.argv[2]; fi=int(sys.argv[3]); sc=int(sys.argv[4])
d=json.load(open(S+t+'.json')); rows=[r for r in d['frames'][st][fi].split('\n') if r!='' ]
W=max(len(r) for r in rows); H=len(rows)
box=[int(v) for v in sys.argv[5:9]] if len(sys.argv)>8 else [0,0,W,H]
im=Image.new('RGB',((box[2]-box[0])*sc,(box[3]-box[1])*sc),(95,154,62))
px=im.load()
for y in range(box[1],box[3]):
  for x in range(box[0],box[2]):
    ch=rows[y][x] if y<H and x<len(rows[y]) else '.'
    if ch in '. ': 
      col=(95,154,62) if ((x//4+y//4)%2) else (100,160,66)
    else:
      h=d['pal'][ch].lstrip('#'); col=tuple(int(h[i:i+2],16) for i in (0,2,4))
    for yy in range(sc):
      for xx in range(sc): px[(x-box[0])*sc+xx,(y-box[1])*sc+yy]=col
out=S+'z_%s_%s%d.png'%(t,st,fi); im.save(out); print(out)
