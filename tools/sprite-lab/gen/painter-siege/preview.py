import re, sys
from PIL import Image, ImageDraw
src = open(sys.argv[1]).read(); out = sys.argv[2]; S = int(sys.argv[3]) if len(sys.argv) > 3 else 7
sets_only = sys.argv[4].split(',') if len(sys.argv) > 4 else None
pal = dict(re.findall(r"^\s+(\w): '([^']+)'", src, re.M))
team = {'team': '#2f6fd6', 'teamdark': '#1f4a94', 'teamlight': '#6f9ff0'}
fr = src[src.index('frames:'):]
sets = re.findall(r"^\s+(\w+): \[(.*?)\],$", fr, re.M | re.S)
rows = []
for name, body in sets:
    if sets_only and name not in sets_only: continue
    grids = re.findall(r'`([^`]*)`', body, re.S)
    rows.append((name, [[l for l in g.strip('\n').split('\n')] for g in grids]))
def hexc(c): c = team.get(c, c); return tuple(int(c[i:i+2], 16) for i in (1, 3, 5))
Wt = max(sum(len(g[0]) * S + 6 for g in gs) for _, gs in rows) + 10
Ht = sum(max(len(g) for g in gs) * S + 16 for _, gs in rows) + 10
im = Image.new('RGB', (Wt, Ht), (40, 36, 30)); dr = ImageDraw.Draw(im); y = 4
for name, gs in rows:
    dr.text((4, y), name, fill=(220, 200, 160)); y += 12; x = 4
    for g in gs:
        for j, l in enumerate(g):
            for i, ch in enumerate(l):
                col = (88, 140, 60) if ((i + j) % 2) else (96, 150, 66)
                if ch in pal: col = hexc(pal[ch])
                dr.rectangle([x + i * S, y + j * S, x + i * S + S - 1, y + j * S + S - 1], fill=col)
        x += len(g[0]) * S + 6
    y += max(len(g) for g in gs) * S + 4
im.save(out)
