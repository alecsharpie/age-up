import sys
from PIL import Image
# crop.py <png> x y w h scale out
im = Image.open(sys.argv[1]); x,y,w,h,s = map(int, sys.argv[2:7])
im.crop((x,y,x+w,y+h)).resize((w*s,h*s), Image.NEAREST).save(sys.argv[7])
