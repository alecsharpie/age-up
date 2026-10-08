import json,sys
from PIL import Image
TEAM={'team':'#cf3b2b','teamdark':'#8a2418','teamlight':'#ef7a6a'}
def grid_img(spec,set_,k):
    rows=[r for r in spec['frames'][set_][k%len(spec['frames'][set_])].split('\n') if r!='' ]
    h=len(rows);w=max(len(r) for r in rows)
    im=Image.new('RGBA',(w,h),(0,0,0,0))
    for y,r in enumerate(rows):
        for x,ch in enumerate(r):
            c=spec['palette'].get(ch)
            if not c: continue
            c=TEAM.get(c,c); im.putpixel((x,y),tuple(int(c[i:i+2],16) for i in (1,3,5))+(255,))
    return im
def scene(items,out,W=420,H=260,ox=210,oy=60,zoom=3,bg=(95,154,62)):
    # items: (spec,set,k,tx,ty)
    im=Image.new('RGBA',(W,H),bg+(255,))
    items=sorted(items,key=lambda it:it[3]+it[4])
    for spec,s,k,tx,ty in items:
        g=grid_img(spec,s,k); ax,ay=spec['anchor']
        bxp=ox+(tx-ty)*32; byp=oy+(tx+ty)*16+32*1  # bottom corner of a 1x1 tile
        w=spec.get('footprint',[1,1])
        byp=oy+(tx+ty)*16+(w[0]+w[1])*16; bxp=ox+(tx-ty)*32+(w[0]-w[1])*32//2*0
        im.alpha_composite(g,(bxp-ax,byp-ay))
    im=im.resize((W*zoom,H*zoom),Image.NEAREST); im.save(out)
if __name__=='__main__':
    pass
