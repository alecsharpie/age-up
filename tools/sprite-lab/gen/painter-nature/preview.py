import json,sys
from PIL import Image,ImageDraw
d=json.load(open(sys.argv[1])); S=int(sys.argv[3]) if len(sys.argv)>3 else 10
pal={k:(v[0] if isinstance(v,list) else v) for k,v in d['palette'].items()}
def col(c):
    c=c.lstrip('#')
    if c.startswith('rgba'): return (0,0,0,40)
    r,g,b=int(c[0:2],16),int(c[2:4],16),int(c[4:6],16); a=int(c[6:8],16) if len(c)>=8 else 255
    return (r,g,b,a)
rows=[]
for name,L in d['frames'].items():
    if len(sys.argv)>4 and name not in sys.argv[4].split(','): continue
    imgs=[]
    for t in L:
        lines=[l for l in t.split('\n')]
        if lines and not lines[0].strip(): lines=lines[1:]
        if lines and not lines[-1].strip(): lines=lines[:-1]
        h=len(lines); w=max(len(l) for l in lines)
        im=Image.new('RGBA',(w*S,h*S),(110,160,80,255))
        dr=ImageDraw.Draw(im)
        for y,l in enumerate(lines):
            for x,ch in enumerate(l):
                if ch in pal:
                    c=col(pal[ch]); bg=im.getpixel((x*S,y*S))
                    a=c[3]/255; cc=tuple(int(c[i]*a+bg[i]*(1-a)) for i in range(3))+(255,)
                    dr.rectangle([x*S,y*S,x*S+S-1,y*S+S-1],fill=cc)
        imgs.append(im)
    rows.append(imgs)
W=max(sum(i.width+6 for i in r) for r in rows); Ht=sum(max(i.height for i in r)+6 for r in rows)
out=Image.new('RGBA',(W,Ht),(30,24,20,255)); y=0
for r in rows:
    x=0
    for i in r: out.paste(i,(x,y)); x+=i.width+6
    y+=max(i.height for i in r)+6
out.save(sys.argv[2])
