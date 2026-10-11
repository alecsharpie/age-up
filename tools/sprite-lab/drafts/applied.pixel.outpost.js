// @pixel outpost
// Outpost 1×1, one variant per age (AGE, AK = pixAgeKit(AGE) come from gen/ages/wrap.mjs):
//   Dark     a slim timber lookout — four log posts on stone pads, X-bracing, a ladder, a plank platform behind a boarded parapet
//            with team shields hung on it, a thatched roof on posts, a brazier on the deck, a torch and a banner below.
//   Feudal   the same lookout on squared stone footings, taller plank screens round the deck with team-shuttered lookout holes, a
//            higher brown oak shingle roof.
//   Castle   one structure: a slim dressed-stone shaft (door, arrow slits, moss at the foot) carries the timber lookout directly —
//            a jettied plank deck on joists and knee braces, a boarded breastwork with loopholes and team shields, the roof posts
//            and a single red clay tile roof; a long team banner hangs from an iron rod under the jetty.
//   Imperial a slim limestone lantern tower: a tall shaft with gilt string courses and an arched door, a balustraded stone gallery,
//            four stone piers framing the fire, a steep slate cap with gilt trim and an orb finial; gilt-fringed banners.
// Natural lines: Dark posts splay out at the foot, every age gets grass tufts and rubble at its feet, ragged / uneven eaves, moss
// and worn edges on the stone.
// Frames: idle 4 — a torch (or the lantern fire) flickers; a team banner ripples.
// ---- fortification kit (local to this draft): ashlar faces, flagstones, shingles, parapets, ink outline, banners, flames ----
// Age variants (gen/ages/wrap.mjs): the generator runs per age; AGE 0 Dark … 3 Imperial, AK = pixAgeKit(AGE).
const make = (AGE) => {
const AK = pixAgeKit(AGE);
function hash3(a,b,c){let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul(c|0,1442695041))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
const cloneG=g=>g.map(r=>r.slice());
const LIT={m:'m',h:'h',t:['a','A','f'],q:'q',p:'p',j:'K'}, SHD={m:'M',h:'H',t:['b','B','n'],q:'Q',p:'P',j:'M'};
/** Re-paint every cell == tmp on the wall face whose base edge runs A→B (A left) as staggered block courses with mortar,
 *  2–3 block tones, a lit lip under every joint, quoins at both corners and a plinth course. */
function ashlar(g,tmp,A,B,T,o={}){
  const CH=o.ch||5,BL=o.bl||8,seed=o.seed||1,PL=o.plinth||0,len=Math.round(B[0]-A[0]),sl=(B[1]-A[1])/(B[0]-A[0]);
  const qL=o.qL!==false,qR=o.qR!==false;
  for(let y=0;y<g.length;y++)for(let x=o.any?0:Math.max(0,Math.floor(A[0])-1);x<=(o.any?g[0].length-1:Math.min(g[0].length-1,Math.ceil(B[0])+1));x++){
    if(g[y][x]!==tmp)continue;
    const u=Math.floor(x+0.5-A[0]),h=Math.max(0,Math.floor(A[1]+(x+0.5-A[0])*sl-(y+0.5)));
    if(h<PL){g[y][x]=h===PL-1?T.h:T.p;continue}
    const hh=h-PL,c=Math.floor(hh/CH),r=hh%CH;
    if(r===CH-1){g[y][x]=T.m;continue}
    const qw=len<24?(c%2?2:4):(c%2?3:6);
    if((qL&&u<qw)||(qR&&len-1-u<qw)){g[y][x]=(qL&&u===qw-1&&u<len/2)||(qR&&len-1-u===qw-1&&u>=len/2)?T.m:r===CH-2?T.h:T.q;continue}
    const off=(c%2)*Math.floor(BL/2)+Math.floor(hash3(c,seed,7)*3),k=Math.floor((u+off)/BL),j=(u+off)%BL;
    if(j===0){g[y][x]=T.m;continue}
    if(r===CH-2||(j===1&&T===LIT)){g[y][x]=T.h;continue}
    g[y][x]=T.t[Math.floor(hash3(c,k,seed)*3)];
  }
}
/** Flagstones on a top face (cells == tmp); top = corners at height. n stones per tile edge. */
function flagstones(g,tmp,top,o={}){
  const n=o.n||4,T0=top.T,id=(x,y)=>{const s=((x+0.5-T0[0])/32+(y+0.5-T0[1])/16)/2*n,t=((y+0.5-T0[1])/16-(x+0.5-T0[0])/32)/2*n;const ti=Math.floor(t);return [Math.floor(s+(ti%2)*0.5),ti]};
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){if(g[y][x]!==tmp)continue;const a=id(x,y),b=id(x+1,y),c=id(x,y+1);
    g[y][x]=(a[0]!==b[0]||a[1]!==b[1]||a[0]!==c[0]||a[1]!==c[1])?(o.j||'j'):(hash3(a[0],a[1],o.seed||3)<0.5?(o.t1||'c'):(o.t2||'C'))}
}
/** Shingle / slate courses on a roof face (cells == tmp): courses run parallel to the eave E0→E1, a lit lip and a dark underside per course. */
function shingles(g,tmp,E0,E1,tn,o={}){
  const CH=o.ch||3,BL=o.bl||4,sl=(E1[1]-E0[1])/(E1[0]-E0[0]);
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){if(g[y][x]!==tmp)continue;
    const d=Math.floor(E0[1]+(x+0.5-E0[0])*sl-(y+0.5)+(o.up?0:0)),dd=o.up?-d:d,c=Math.floor(dd/CH),r=((dd%CH)+CH)%CH;
    if(r===0){g[y][x]=tn.u;continue}
    const k=Math.floor((x+(c%2)*2)/BL);g[y][x]=r===CH-1?tn.l:(hash3(c,k,o.seed||5)<0.35?tn.s:tn.m)}
}
/** A parapet along one edge of a top face: low wall + merlons. edge: 'LB','BR' (front) or 'TL','TR' (back). */
function parapet(g,top,W,H,edge,o){
  const th=o.th||0.12,lo=o.lo||3,hi=o.hi||7,n=o.n||2,ml=o.ml||0.24,ch=o.ch||{left:'a',right:'b',top:'h'};
  const along=edge==='LB'||edge==='TR'?W:H;
  const base=edge==='LB'||edge==='BR'?top.Bm:edge==='TL'?[top.L[0]+32*th,top.L[1]+16*th]:[top.Rr[0]-32*th,top.Rr[1]+16*th];
  const box=(f,len,z)=>{if(edge==='LB'||edge==='TR'){const B=[base[0]-f*along*32,base[1]-f*along*16];return pixIsoBox(g,B[0],B[1],len*along,th,z,1,ch)}
    const B=[base[0]+f*along*32,base[1]-f*along*16];return pixIsoBox(g,B[0],B[1],th,len*along,z,1,ch)};
  if(lo>0)box(0,1,lo);
  const tops=[];for(let i=0;i<n;i++){const f=(i+(o.f0??0.18))/n;if(f+ml/n*0>1)continue;tops.push(box(f,Math.min(ml,1-f),hi))}
  return tops;
}
/** Battlements on a top face: shadow cast by the back-left parapet onto the walkway, back parapets now; returns a function that
 *  draws the front parapets (call it after anything that stands on the walkway). n = [merlons along W, along H]. */
function crenels(g,top,W,H,o={}){
  const th=o.th||0.1,n=o.n||[2,2],ml=o.ml||0.24,f0=o.f0??0.18,lo=o.lo??3,hi=o.hi??7,ch=o.chs||(o.tex?{left:'7',right:'8',top:'h'}:{left:'a',right:'b',top:'h'}),walk=/[cCjS]/,sk=o.skip||{};
  const B0=[top.L[0]+32*th,top.L[1]+16*th],nb=n[1];
  if(!sk.TL)for(let x=Math.ceil(B0[0]);x<=B0[0]+H*32;x++){const f=(x-B0[0])/(H*32),y=B0[1]-(x-B0[0])*0.5;
    let inM=false;for(let i=0;i<nb;i++){const a=(i+f0)/nb;if(f>=a&&f<=a+ml)inM=true}
    const dep=((inM?hi:lo)>>1)+1;for(let d=1;d<=dep;d++){const yy=Math.floor(y)+d;if(walk.test(pixGet(g,x,yy)))pixSet(g,x,yy,'S')}}
  const P=(e,nn)=>parapet(g,top,W,H,e,{th,lo,hi,n:nn,ml,f0,ch});
  if(!sk.TL)P('TL',nb);if(!sk.TR)P('TR',n[0]);
  // o.tex = {L:[A,B],R:[A,B]}: parapet faces get the courses of the wall faces below (outer faces are coplanar with them)
  return ()=>{if(!sk.LB)P('LB',n[0]);if(!sk.BR)P('BR',n[1]);
    if(o.tex){ashlar(g,'7',o.tex.L[0],o.tex.L[1],LIT,{ch:o.tex.ch||5,bl:o.tex.bl||8,seed:o.tex.seed||2,qL:false,qR:false,any:true});ashlar(g,'8',o.tex.R[0],o.tex.R[1],SHD,{ch:o.tex.ch||5,bl:o.tex.bl||8,seed:(o.tex.seed||2)+1,qL:false,qR:false,any:true})}};
}
/** Machicolation / corbel table along the top edge A→B of a face, dy px below it: corbels with dark murder-holes between. */
function machi(g,A,B,dy,lit){
  const sl=(B[1]-A[1])/(B[0]-A[0]),c1=lit?'q':'Q',c2=lit?'h':'H';
  for(let x=Math.ceil(A[0]);x<=Math.floor(B[0]);x++){const u=x-Math.ceil(A[0]),y=Math.floor(A[1]+(x-A[0])*sl)+dy;
    pixSet(g,x,y,c2);const m=u%4;pixSet(g,x,y+1,m===0?'e':m===3?'K':c1);pixSet(g,x,y+2,m===0?'e':m===1?c1:'k');if(m===0)pixSet(g,x,y+3,'k')}
}
/** Selective ink outline: solid cells touching transparency become ink; on the lit upper-left the ink lightens to K.
 *  solid(x,y) may claim empty cells as covered (a neighbouring segment), so joints get no ink. */
function inkOutline(g,skip,solid){
  const H=g.length,W=g[0].length,e=(x,y)=>(x<0||y<0||x>=W||y>=H||g[y][x]==='.')&&!(solid&&solid(x,y)),mark=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(g[y][x]==='.'||(skip&&skip.includes(g[y][x])))continue;
    const l=e(x-1,y),r=e(x+1,y),u=e(x,y-1),d=e(x,y+1);if(l||r||u||d)mark.push([x,y,(r||d)?'k':'K'])}
  for(const [x,y,c] of mark)g[y][x]=c;
}
/** Hanging team banner (rod at x,y; w×h) lying on a face of slope sl (0.5 lit face, -0.5 shaded face, 0 flat).
 *  Folds ripple with phase ph (0..3), swallow-tail bottom, gold cross charge, team-dark edges. */
function banner(g,x,y,w,h,ph,o={}){
  const sl=o.sl||0,oy=c=>Math.floor((c+0.5)*sl),wave=c=>Math.sin(c*1.3-ph*Math.PI/2);
  for(let c=-1;c<=w;c++)pixSet(g,x+c,y+oy(c),'y');pixSet(g,x-1,y+oy(-1)-1,'o');pixSet(g,x+w,y+oy(w)-1,'o');
  for(let c=0;c<w;c++){const s=wave(c),notch=Math.abs(c-(w-1)/2)<1?2:Math.abs(c-(w-1)/2)<2?1:0,len=h-notch+(Math.sin(c*1.1-ph*Math.PI/2)>0.6?1:0);
    for(let r=1;r<=len;r++){const edge=c===0||c===w-1||r===len;pixSet(g,x+c,y+oy(c)+r,edge?'D':s>0.5?'L':s<-0.5?'D':'T')}}
  if(o.charge!==false){const cx=Math.floor(w/2),cy=y+Math.floor(h*0.42);const P=(c,d,ch)=>pixSet(g,x+c,cy+oy(c)+d,ch);P(cx,-1,'o');P(cx,0,'O');P(cx,1,'o');P(cx,2,'o');P(cx-1,0,'o');P(cx+1,0,'o')}
}
/** Vertical boards on a face over base edge A→B (cells == tmp): tn {l,m,s,g,r}; rails at the given heights. */
function planks(g,tmp,A,B,tn,o={}){
  const BW=o.bw||3,sl=(B[1]-A[1])/(B[0]-A[0]),rails=o.rails||[];
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){if(g[y][x]!==tmp)continue;
    const u=Math.floor(x+0.5-A[0]),h=Math.max(0,Math.floor(A[1]+(x+0.5-A[0])*sl-(y+0.5)));
    g[y][x]=rails.includes(h)?tn.r:u%BW===0?tn.g:u%BW===1&&tn.l?tn.l:hash3(Math.floor(u/BW),h>>2,o.seed||9)<0.3?tn.s:tn.m}
}
/** Opening with depth on a face of slope sl: dark recess, arched head, lit right jamb, stone surround; fill(c,r,w,h) may paint the inside. */
function opening(g,x0,yb,w,h,sl,o={}){
  const oy=c=>Math.floor((c+0.5)*sl);
  for(let c=-1;c<=w;c++){const top=h-((c<=0||c>=w-1)&&o.arch!==false?1:0)-((c<=-1||c>=w)&&o.arch!==false?1:0);
    for(let r=0;r<=top;r++){const y=yb+oy(c)-r;if(c===-1||c===w){if(r>=top-1||o.surround)pixSet(g,x0+c,y,o.sur||'q');continue}
      if(r===top){pixSet(g,x0+c,y,o.sur||'q');continue}
      pixSet(g,x0+c,y,c===w-1?(o.jamb||'h'):r===top-1?'k':'e')}}
  if(o.fill)for(let c=0;c<w-1;c++)for(let r=0;r<h-2;r++){const ch=o.fill(c,r,w-1,h-2);if(ch)pixSet(g,x0+c,yb+oy(c)-r,ch)}
}
/** Heater shield in team colour, top-left x,y (6×7). */
function shield(g,x,y){pixStamp(g,x,y,`
kkkkkk
kLTTTk
kLToTk
kLoooD
kTToTD
.kTTD.
..kD..
`)}
/** Flame on a torch/brazier, base at (x,y), frame k (0..3). */
const FLAMES=[`
..F..
.FYF.
.YOY.
.ORO.
`,`
.F...
.YF..
.YOF.
.ORO.
`,`
...F.
..FY.
.FOY.
.ORO.
`,`
..F..
..Y..
.FOY.
.ORO.
`];
function flame(g,x,y,k){pixStamp(g,x-2,y-4,FLAMES[k%4])}
/** Warm torch light on nearby stone. */
function glow(g,x,y,r){const map={a:'g',A:'g',f:'g',h:'G',b:'g',B:'g',n:'g',q:'G',c:'G',C:'g'};for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){if(xx*xx+yy*yy*1.6>r*r)continue;const c=pixGet(g,x+xx,y+yy);if(map[c])pixSet(g,x+xx,y+yy,map[c])}}
function torch(g,x,y,k){pixSet(g,x,y,'y');pixSet(g,x,y-1,'y');pixSet(g,x-1,y-2,'i');pixSet(g,x,y-2,'J');pixSet(g,x+1,y-2,'i');flame(g,x,y-3,k)}
/** Arrow slit with depth: shadowed left jamb, dark slot, lit right jamb, lintel and sill. h = slot height. */
function slit(g,x,y,h,cross){pixSet(g,x,y-1,'k');pixSet(g,x+1,y-1,'k');for(let r=0;r<h;r++){pixSet(g,x,y+r,'e');pixSet(g,x+1,y+r,r===0?'k':'h')}pixSet(g,x,y+h,'h');pixSet(g,x+1,y+h,'h');if(cross){pixSet(g,x-1,y+1,'e');pixSet(g,x+1,y+1,'e');pixSet(g,x+2,y+1,'h')}}
const lerpP=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
/** Painted team flag on a pole whose foot is at (x,y): h-px timber pole with a gold finial and a w×fh cloth flying to the
 *  right (o.dir=-1: left) that ripples with phase ph (0..3); folds shade light/mid/dark, team-dark hems, a swallow-tail fly.
 *  Opt-in helper (nothing calls it by default). */
function flagpole(g,x,y,h,ph,o={}){
  const w=o.w||10,fh=o.fh||6,dir=o.dir||1;
  for(let r=0;r<h;r++)pixSet(g,x,y-r,'y');pixSet(g,x,y-h,'o');
  const y0=y-h+2,a=c=>c*0.9-ph*Math.PI/2,dy=c=>Math.round(Math.sin(a(c))*Math.min(1,c/4)),fold=c=>Math.cos(a(c));
  for(let c=1;c<=w;c++){const d=dy(c),s=fold(c),len=fh-(c===w?1:0);
    for(let r=0;r<len;r++){const tone=s>0.45?'L':s<-0.45?'D':'T';
      pixSet(g,x+c*dir,y0+r+d,r===len-1?'D':r===0&&tone==='T'?'L':tone)}}
}
// ---- natural lines (HOLISTIC.md): 1-px variation on formal stone; never a broken iso grid ----
const NAT={g1:'ǥ',g2:'ǧ',g3:'ǩ',m1:'ʍ',m2:'ɯ',m3:'ɰ',r1:'ʀ',r2:'ʁ'};
const INKC=c=>c==='k'||c==='K';
/** Bottom-most opaque cell of every column (-1 if empty). */
function bottoms(g){const out=[];for(let x=0;x<g[0].length;x++){let y=g.length-1;while(y>=0&&g[y][x]==='.')y--;out.push(y)}return out}
/** Moss and lichen creeping up the foot of stone faces: clustered, thinning with height. stone = regex of stone chars;
 *  o.h rows, o.split = the lit/shaded corner x, o.dens 0..1, o.ok(x,y) to skip cells. */
function moss(g,stone,o={}){
  const Hh=o.h||6,seed=o.seed||1,dens=o.dens??0.55,bot=bottoms(g),split=o.split??g[0].length/2;
  for(let x=0;x<g[0].length;x++){const yb=bot[x];if(yb<0)continue;
    for(let d=0;d<Hh;d++){const y=yb-d,c=g[y]&&g[y][x];if(!c||!stone.test(c)||(o.ok&&!o.ok(x,y)))continue;
      const n=hash3(x>>1,(y+((x>>2)&1))>>1,seed),thr=dens*(1-d/Hh)*(0.6+0.8*hash3(x>>3,seed,5));
      if(n<thr){const lit=x<split;g[y][x]=n<thr*0.35?(lit?NAT.m1:NAT.m2):(lit?NAT.m2:NAT.m3)}}}
}
/** Grass tufts over the foot of the building (they hide the hard bottom ink line in clumps) and a few rubble chips.
 *  o.p clump density, o.maxY = lowest row allowed (the anchor row), o.ok(x,y) to skip columns, o.rubble chance. */
function tufts(g,o={}){
  const seed=o.seed||2,p=o.p??0.35,bot=bottoms(g),maxY=o.maxY??g.length-1,split=o.split??g[0].length/2;
  const near=(x,yb)=>yb>=maxY-Math.abs(x-split)*0.5-(o.tol??3);   // only columns that stand on the ground (not an eave or a flag)
  for(let x=0;x<g[0].length;x++){const yb=bot[x];if(yb<0||!near(x,yb)||(o.ok&&!o.ok(x,yb)))continue;
    const cl=Math.floor((x+Math.floor(hash3(seed,9,1)*4))/4);if(hash3(cl,seed,77)>=p)continue;
    const h=1+Math.floor(hash3(x,seed,78)*(x%2?2.5:4)),lit=x<split;
    for(let d=0;d<h;d++){const y=yb-d;if(y<0)break;g[y][x]=d===0?NAT.g1:d===h-1?(lit?NAT.g3:NAT.g2):NAT.g2}
    // blades spill a pixel past the foot where the ground beside it is open (never below the anchor row)
    for(const dx of [-1,1]){const xx=x+dx;if(xx<0||xx>=g[0].length||g[yb][xx]!=='.'||hash3(xx,seed,80)<0.4)continue;
      const hh=1+Math.floor(hash3(xx,seed,81)*2);for(let d=0;d<hh;d++)if(g[yb-d]&&g[yb-d][xx]==='.')g[yb-d][xx]=d===0?NAT.g1:(lit?NAT.g3:NAT.g2)}}
  if(o.rubble)for(let x=1;x<g[0].length-2;x++){const yb=bot[x];if(yb<0||yb+1>maxY-1||!near(x,yb)||(o.ok&&!o.ok(x,yb)))continue;
    if(hash3(x,seed,79)<o.rubble&&g[yb+1][x]==='.'&&g[yb+1][x+1]==='.'&&bot[x+1]>=0&&Math.abs(bot[x+1]-yb)<=1){g[yb+1][x]=NAT.r1;g[yb+1][x+1]=NAT.r2;x+=3}}
}
/** Wear on stone silhouettes: chipped corners on merlons and quoins, the odd notch along a top edge, the odd block standing proud
 *  of a side edge by 1 px. Call after inkOutline. stone = regex of stone chars; o.solid(x,y) marks cells a neighbour covers. */
function wear(g,stone,o={}){
  const seed=o.seed||3,p=o.p??0.45,notch=o.notch??0.05,bump=o.bump??0.08,solid=o.solid,Hh=g.length,Ww=g[0].length;
  const E=(x,y)=>(x<0||y<0||x>=Ww||y>=Hh||g[y][x]==='.')&&!(solid&&solid(x,y));
  const inkAt=(x,y)=>E(x+1,y)||E(x,y+1)?'k':'K',acts=[];
  for(let y=1;y<Hh-2;y++)for(let x=1;x<Ww-1;x++){const c=g[y][x];if(!INKC(c))continue;
    if(E(x,y-1)&&stone.test(g[y+1][x])&&stone.test(g[y+2][x])){const cl=E(x-1,y),cr=E(x+1,y);
      if((cl||cr)&&!(cl&&cr)&&hash3(x,y,seed)<p)acts.push(['c',x,y]);
      else if(!cl&&!cr&&hash3(x>>1,y,seed+1)<notch&&!E(x-1,y+1)&&!E(x+1,y+1))acts.push(['c',x,y]);}
    else if(bump&&y%4===1&&!E(x,y-1)&&!E(x,y+1)){const sl=E(x-1,y)&&stone.test(g[y][x+1]),sr=E(x+1,y)&&stone.test(g[y][x-1]);
      if((sl||sr)&&hash3(x,y>>2,seed+2)<bump&&E(sl?x-1:x+1,y+1)&&E(sl?x-1:x+1,y-1))acts.push(['b',x,y,sl?-1:1]);}}
  for(const [t,x,y,dir] of acts){
    if(t==='c'){g[y][x]='.';if(stone.test(g[y+1][x]))g[y+1][x]=inkAt(x,y+1)}
    else{const inner=g[y][x-dir];for(const yy of [y,y+1]){if(!INKC(g[yy][x]))continue;g[yy][x]=inner;g[yy][x+dir]='k'}}}
}
/** An uneven eave along the ink eave line A→B (call after the line is drawn): at chance p a cell drops 1 px — the roof colour above
 *  it carries down and the ink moves below, so tiles / shingles get an uneven drip line. o.hang(x) may return a strand char to
 *  hang a second pixel (thatch). */
function eaveRag(g,A,B,p,seed,o={}){
  for(let x=Math.ceil(A[0])+2;x<=Math.floor(B[0])-2;x++){const y=Math.round(A[1]+(x-A[0])*(B[1]-A[1])/(B[0]-A[0]));
    if(hash3(x>>(o.pair?1:0),seed,31)>=p||!INKC(pixGet(g,x,y))||pixGet(g,x,y+1)==='.'||pixGet(g,x,y-1)==='.')continue;
    const roof=o.fill?o.fill(x):pixGet(g,x,y-1);pixSet(g,x,y,roof);
    const h=o.hang&&hash3(x,seed,32)<0.5&&pixGet(g,x,y+2)!=='.'?o.hang(x):null;
    if(h){pixSet(g,x,y+1,h);pixSet(g,x,y+2,'k')}else pixSet(g,x,y+1,'k')}
}
const FORT_PAL={
  k:'#24180f',K:'#43382e',e:'#140d08',
  h:'#c4bba9',a:'#a69e8f',A:'#988f81',f:'#b0a798',m:'#6a6257',q:'#cfc6b3',p:'#7d7569',     // lit stone
  H:'#7a7266',b:'#675f55',B:'#5d564c',n:'#6f675c',M:'#38322c',Q:'#81796c',P:'#4c463f',     // shaded stone
  c:'#a9a192',C:'#9d9587',j:'#746d62',S:'#7f786c',                                         // top / walkway, shadow on it
  w:'#a07a4a',v:'#8a6a3a',x:'#5a3a18',y:'#3b2614',                                          // timber ramp
  i:'#5f656c',I:'#9aa0a6',J:'#1e2a33',                                                      // iron
  o:'#e1b12c',O:'#ffe28a',F:'#ffe9a8',Y:'#ffc84a',R:'#d9542a',g:'#cbb08a',G:'#dcc29a',       // gold, flame, torch glow
  r:'#8a95a1',s:'#6f7a87',t:'#59636f',u:'#434b56',z:'#2f353e',                            // slate roof
  T:'team',D:'teamdark',L:'teamlight',
  'ǥ':'#355e24','ǧ':'#4f8030','ǩ':'#8cbc52','ʍ':'#808c4c','ɯ':'#62723a','ɰ':'#48572f','ʀ':'#a49c8e','ʁ':'#5e574d',   // grass, moss, rubble
};
// ---- end kit ----
const W=1,H=1,PZ=[36,38,38,46][AGE];
const GW=(W+H)*32+4, GH=(W+H)*16+PZ+18+10+[0,4,4,22][AGE];
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
const {R,Au,Fe,Gl}=AK;
const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),mix=(a,b,t)=>'#'+hex(a).map((v,i)=>Math.round(v+(hex(b)[i]-v)*t).toString(16).padStart(2,'0')).join('');
// stone chars of the fort kit recoloured with this age's AK stone (Castle keeps the fort kit's dressed grey ashlar)
const sp=i=>AK.pal[AK.S[i]];
const STONE=AGE===2||AGE===0?{}:{h:sp(0),q:sp(0),f:sp(1),a:mix(sp(1),sp(2),0.45),A:sp(2),m:mix(sp(4),sp(5),0.5),p:sp(3),
  H:mix(sp(2),sp(3),0.4),Q:sp(2),n:sp(3),b:mix(sp(3),sp(4),0.4),B:sp(4),M:sp(5),P:mix(sp(4),sp(5),0.5),c:sp(1),C:sp(2),j:sp(3),S:sp(3)};
// pyramid roof faces with the age kit's material: '6' back-left (face 2, flip), '7' back-right (3, flip), '8' front-left (0), '9' front-right (1)
function ageRoof(){const F={'6':[-0.5,2,1],'7':[0.5,3,1],'8':[0.5,0,0],'9':[-0.5,1,0]};
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){const f=F[g[y][x]];if(f)g[y][x]=AK.roofXY(x,y,f[0],f[1],{flip:!!f[2]})}}
const s=0.55, cy0=by-16;  // post square, tile centre
const base={L:[bx-s*32,cy0],Bm:[bx,cy0+s*16],Rr:[bx+s*32,cy0],T:[bx,cy0-s*16]};
// the stilts splay outward at the foot (Dark: rough logs, 2 px; Feudal: squared posts, 1 px)
const SPL=[2,1,0,0][AGE],foot=P=>[P[0]+(P===base.L?-SPL:P===base.Rr?SPL:0),P[1]];
// ground: trodden earth and stone pads under the posts (Feudal: squared footing blocks)
if(AGE===0)for(const P of [base.L,base.Rr,base.Bm].map(foot))pixStamp(g,Math.round(P[0])-2,Math.round(P[1])-1,`
.hhh.
pappP
.PPP.
`);
if(AGE===1)for(const P of [base.L,base.Rr,base.Bm].map(foot))pixStamp(g,Math.round(P[0])-3,Math.round(P[1])-3,`
.kkkkk.
khhhhhk
kqaaAQk
kfaAQnk
kpPPPPk
.kkkkk.
`);
// platform deck (wider than the posts): planks, or a stone gallery in Imperial
const ps=0.8;const plat=pixIsoBox(g,bx,cy0+ps*16-PZ,ps,ps,3,1,{left:'1',right:'2',top:'3'});
if(AGE<3){
planks(g,'1',plat.base.L,plat.base.Bm,{m:'v',s:'v',g:'x',r:'x'},{bw:5});planks(g,'2',plat.base.Bm,plat.base.Rr,{m:'x',s:'x',g:'y',r:'y'},{bw:5});
for(let y=0;y<g.length;y++)for(let x=0;x<GW;x++)if(g[y][x]==='3')g[y][x]=((x+2*y)>>2)%2?'w':'v';
// joists poking out under the deck
for(const f of [0.2,0.5,0.8]){const p=lerpP(plat.base.L,plat.base.Bm,f);pixSet(g,p[0],p[1]+1,'y');pixSet(g,p[0]-1,p[1]+1,'v');const q=lerpP(plat.base.Bm,plat.base.Rr,f);pixSet(g,q[0],q[1]+1,'y')}
}else{
  ashlar(g,'1',plat.base.L,plat.base.Bm,LIT,{ch:3,bl:6,seed:4,any:true});ashlar(g,'2',plat.base.Bm,plat.base.Rr,SHD,{ch:3,bl:6,seed:5,any:true});
  flagstones(g,'3',plat,{n:3});
  machi(g,[plat.base.L[0]+1,plat.base.L[1]],[plat.base.Bm[0],plat.base.Bm[1]],1,true);machi(g,[plat.base.Bm[0]+1,plat.base.Bm[1]],[plat.base.Rr[0]-1,plat.base.Rr[1]],1,false);
}
// roof posts (back first; Imperial: stone piers), then the brazier spot, then the parapet on the front edges
const rz=[13,15,15,17][AGE];
const pier=(P,lit)=>{for(let k=0;k<3;k++)pixLine(g,P[0]+k-1,P[1]-1,P[0]+k-1,P[1]-rz,lit?['h','q','f'][k]:['Q','b','B'][k]);pixLine(g,P[0]-1,P[1]-rz+1,P[0]+1,P[1]-rz+1,Au[1])};
if(AGE<3){pixLine(g,plat.T[0],plat.T[1]-1,plat.T[0],plat.T[1]-rz,'y');
for(const P of [plat.L,plat.Rr])pixLine(g,P[0]+(P===plat.L?1:-1),P[1]-1,P[0]+(P===plat.L?1:-1),P[1]-rz,'x');}
else{pier([plat.T[0],plat.T[1]],false);pier([plat.L[0]+2,plat.L[1]],true);pier([plat.Rr[0]-2,plat.Rr[1]],false)}
const BRZ=(()=>{const p=lerpP(plat.L,plat.Bm,0.62);return [Math.round(p[0])+1,Math.round(p[1])-4]})();   // brazier on the deck, just inside the front parapet   // brazier on the deck centre
if(AGE===3){// the lantern room: seen through the open bays, a dark interior lit warm from the fire on the deck
  const room=pixIsoBox(g,plat.Bm[0],plat.Bm[1],ps,ps,rz,1,{left:'4',right:'5'});
  // the fire burns in the brazier just inside the lit balustrade: its light pools in that bay only (no glow on the shaded side)
  const fc=[BRZ[0],BRZ[1]-4];
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const c=g[y][x];if(c!=='4'&&c!=='5')continue;const d=Math.hypot(x-fc[0],(y-fc[1])*1.4);
    g[y][x]=c==='4'&&d<3.5?Gl[1]:c==='4'&&d<6?Gl[0]:c==='4'&&d<8?'M':'e'}
}
pixStamp(g,BRZ[0]-3,BRZ[1]-3,`
JiIIiJ
.JiiJ.
..JJ..
`);
const PH=[6,9,10,7][AGE];
const par=pixIsoBox(g,plat.Bm[0],plat.Bm[1],ps,0.08,PH,1,{left:'4',right:'5',top:AGE>=3?'h':'v'});
const par2=pixIsoBox(g,plat.Bm[0],plat.Bm[1],0.08,ps,PH,1,{left:'4',right:'5',top:AGE>=3?'h':'v'});
if(AGE<3){const rl=[[5],[4,8],[0,PH-1]][AGE];planks(g,'4',plat.L,plat.Bm,{l:'w',m:'v',s:'w',g:'x',r:'x'},{bw:3,rails:rl});planks(g,'5',plat.Bm,plat.Rr,{m:'x',s:'v',g:'y',r:'y'},{bw:3,rails:rl})}
else{ashlar(g,'4',plat.L,plat.Bm,LIT,{ch:4,bl:6,seed:6,any:true,qL:false});ashlar(g,'5',plat.Bm,plat.Rr,SHD,{ch:4,bl:6,seed:7,any:true,qR:false})}
if(AGE===2)for(const f of [0.16,0.82]){// loopholes in the breastwork
  const p=lerpP(plat.L,plat.Bm,f);opening(g,Math.round(p[0]),Math.round(p[1])-3,2,5,0.5,{arch:false,sur:'y',jamb:'w'});
  const q=lerpP(plat.Bm,plat.Rr,f);opening(g,Math.round(q[0])-1,Math.round(q[1])-3,2,5,-0.5,{arch:false,sur:'y',jamb:'v'})}
if(AGE===3){// a gilt coping on the balustrade, dark balusters between pale posts
  for(const [A,B,lit] of [[plat.L,plat.Bm,true],[plat.Bm,plat.Rr,false]]){const sl=(B[1]-A[1])/(B[0]-A[0]);
    for(let x=Math.ceil(A[0]);x<=Math.floor(B[0]);x++){const u=x-Math.ceil(A[0]),y=Math.round(A[1]+(x-A[0])*sl);pixSet(g,x,y-PH,Au[lit?0:1]);
      if(u%3!==0)for(let r=2;r<=PH-2;r++)pixSet(g,x,y-r,u%3===1&&lit?'M':'e')}}}
if(AGE<3){pixLine(g,plat.Bm[0],plat.Bm[1]-1,plat.Bm[0],plat.Bm[1]-7,'w');pixLine(g,plat.Bm[0]+1,plat.Bm[1]-1,plat.Bm[0]+1,plat.Bm[1]-7,'x'); // front roof post
pixLine(g,plat.Bm[0],plat.Bm[1]-7,plat.Bm[0],plat.Bm[1]-rz,'w');pixLine(g,plat.Bm[0]+1,plat.Bm[1]-7,plat.Bm[0]+1,plat.Bm[1]-rz,'x');}
else pier([plat.Bm[0],plat.Bm[1]],true);
if(AGE===1){AK.windowAt(g,Math.round(lerpP(plat.L,plat.Bm,0.78)[0]),Math.round(lerpP(plat.L,plat.Bm,0.78)[1])-5,0.5,0);AK.windowAt(g,Math.round(lerpP(plat.Bm,plat.Rr,0.25)[0]),Math.round(lerpP(plat.Bm,plat.Rr,0.25)[1])-5,-0.5,1)}
if(AGE<3){const p=lerpP(plat.L,plat.Bm,0.45);shield(g,Math.round(p[0])-3,Math.round(p[1])-7-(AGE?1:0)-(AGE===2?1:0));const q=lerpP(plat.Bm,plat.Rr,0.55);shield(g,Math.round(q[0])-2,Math.round(q[1])-7-(AGE?1:0)-(AGE===2?1:0))}
// roof: thatch (Dark), the age kit's shingles / tiles / slate later
const ov=AGE===0?2:AGE===3?3:2;
const roofTop={T:[plat.T[0],plat.T[1]-rz],Rr:[plat.Rr[0]+ov,plat.Rr[1]-rz+1],Bm:[plat.Bm[0],plat.Bm[1]-rz+2],L:[plat.L[0]-ov,plat.L[1]-rz+1]};
const ap=pixIsoRoof(g,roofTop,[11,13,13,22][AGE],1,{left:'6',back:'7',front:'8',right:'9'});
if(AGE===0){
// thatch: strands running down the slope, a darker eave fringe
const thatch=(tmp,tn)=>{for(let y=0;y<g.length;y++)for(let x=0;x<GW;x++){if(g[y][x]!==tmp)continue;const r=hash3(x,Math.floor((y+(x*7)%4)/4),11);g[y][x]=r<0.18?tn[0]:r<0.75?tn[1]:tn[2]}};
thatch('6',['d','E','E']);thatch('7',['E','l','N']);thatch('8',['d','E','l']);thatch('9',['l','N','U']);
for(const [A,B,c] of [[roofTop.L,roofTop.Bm,'N'],[roofTop.Bm,roofTop.Rr,'U']]){pixLine(g,A[0],A[1]-1,B[0],B[1]-1,c)}
pixLine(g,roofTop.Bm[0],roofTop.Bm[1],ap[0],ap[1],'N');pixLine(g,roofTop.L[0],roofTop.L[1],ap[0],ap[1],'d');
}else{
  ageRoof();
  pixLine(g,roofTop.Bm[0],roofTop.Bm[1],ap[0],ap[1],R[6]);pixLine(g,roofTop.L[0],roofTop.L[1],ap[0],ap[1],R[0]);
  if(AGE===3){AK.trim(g,[roofTop.L[0]+1,roofTop.L[1]],[roofTop.Bm[0],roofTop.Bm[1]]);AK.trim(g,[roofTop.Bm[0],roofTop.Bm[1]],[roofTop.Rr[0]-1,roofTop.Rr[1]]);
    const n=Math.round(roofTop.Bm[1]-ap[1]);for(let i=3;i<n-2;i+=3){const t=i/n;pixSet(g,Math.round(roofTop.Bm[0]+(ap[0]-roofTop.Bm[0])*t),Math.round(roofTop.Bm[1]+(ap[1]-roofTop.Bm[1])*t),Au[0])}}
  if(AGE===2)pixSet(g,ap[0],ap[1],Fe[1]);
}
pixLine(g,roofTop.L[0],roofTop.L[1],roofTop.Bm[0],roofTop.Bm[1],'k');pixLine(g,roofTop.Bm[0],roofTop.Bm[1],roofTop.Rr[0],roofTop.Rr[1],'k');
// an uneven eave: thatch strands hang ragged (Dark), a lifted shingle or two (Feudal), an uneven tile drip line (Castle); Imperial stays crisp
{const pr2=[0.45,0.16,0.14,0][AGE];if(pr2)for(const [A,B] of [[roofTop.L,roofTop.Bm],[roofTop.Bm,roofTop.Rr]])
  eaveRag(g,A,B,pr2,AGE,{pair:AGE>0,fill:AGE===0?(x=>x<bx?'N':'U'):null,hang:AGE===0?(x=>x<bx?'N':'U'):null})}
inkOutline(g);
// legs drawn after the outline: 3-tone logs with their own ink edge (thin members would turn solid ink)
// The posts stand inside the deck's footprint, so the deck is in front of their tops: everything drawn below is clipped to the
// deck's bottom edge (cells above it are restored from underLegs), so the posts end under the deck instead of poking up through
// the deck and the roof eave.
const underLegs=cloneG(g);
const deckBottom=x=>x<=bx?plat.base.L[1]+(x-plat.base.L[0])*0.5:plat.base.Bm[1]-(x-bx)*0.5;
// posts: back post thin, front posts two-tone logs (Feudal on: squared posts)
const post=(P,th)=>{const C=th===1?['x']:AGE===0?['k','w','v','y']:['k','w','x','y'],F=foot(P);for(let k=0;k<C.length;k++)pixLine(g,F[0]+k-1,P[1]-1-(AGE===1?2:0),P[0]+k-1,P[1]-PZ,C[k])};
post(base.T,1);
// cross bracing on the two front faces (behind the front posts)
const brace=(A,B,c1,c2)=>{pixLine(g,A[0]+1,A[1]-6,B[0]-1,B[1]-PZ+8,c1);pixLine(g,A[0]+1,A[1]-PZ+8,B[0]-1,B[1]-6,c1);pixLine(g,A[0]+1,A[1]-5,B[0]-1,B[1]-PZ+9,c2);pixLine(g,A[0]+1,A[1]-PZ+9,B[0]-1,B[1]-5,c2)};
const BZ=[0,0,PZ,PZ][AGE];   // stone shaft height (Castle, Imperial): it runs right up under the deck
if(AGE<2){brace(base.L,base.Bm,'v','y');brace(base.Bm,base.Rr,'x','y');}
if(AGE<2){pixLine(g,base.L[0],base.L[1]-18,base.Bm[0],base.Bm[1]-18,'x');pixLine(g,base.Bm[0],base.Bm[1]-18,base.Rr[0],base.Rr[1]-18,'y');} // mid ledger
post(base.L,2);post(base.Rr,2);post(base.Bm,2);
if(AGE===0)for(const P of [base.L,base.Rr,base.Bm])for(let y=6;y<PZ-4;y+=7){const F=foot(P),dx=Math.round((F[0]-P[0])*(1-y/PZ));pixSet(g,P[0]+dx,P[1]-y,'x');pixSet(g,P[0]+dx+1,P[1]-y,'k')}  // bark rings
if(AGE===1)for(const P of [base.L,base.Rr,base.Bm])for(const y of [10,24]){pixSet(g,P[0]-1,P[1]-y,'i');pixSet(g,P[0],P[1]-y,'i')} // iron straps
// ladder up the lit face: two rails, rungs every 4 px
if(AGE<2)for(let k=0;k<PZ-3;k++){const y=base.L[1]+3-k,x0=Math.round(base.L[0]+9+k*0.1);pixSet(g,x0,y,'x');pixSet(g,x0+5,y+2,'y');if(k%4===2){pixLine(g,x0+1,y,x0+4,y+2,'w');pixLine(g,x0+1,y+1,x0+4,y+3,'y')}}
for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(y+0.5<deckBottom(x+0.5))g[y][x]=underLegs[y][x];
// Castle / Imperial: the stone pier in front of the post feet (Imperial: the whole shaft up to the gallery)
let pr=null;const STNc=/[hqfaAmpHQnbBMP]/;
if(BZ){const k=0.66;
  const ov=cloneG(g),withLegs=cloneG(g);
  pr=pixIsoBox(g,bx,cy0+k*16,k,k,BZ-3+(ps-k)*16,1,{left:'1',right:'2'});
  ashlar(g,'1',pr.base.L,pr.base.Bm,LIT,{ch:AGE===3?4:5,bl:7,plinth:3,seed:2});ashlar(g,'2',pr.base.Bm,pr.base.Rr,SHD,{ch:AGE===3?4:5,bl:7,plinth:3,seed:3});
  pixLine(g,pr.base.Bm[0],pr.base.Bm[1]-1,pr.Bm[0],pr.Bm[1],'K');
  if(AGE===3)for(const hh of [14,28]){for(let x=Math.ceil(pr.base.L[0]);x<=Math.floor(pr.base.Rr[0]);x++){                 // gilt string courses
    const y=Math.floor(x<=bx?pr.base.L[1]+(x-pr.base.L[0])*0.5:pr.base.Bm[1]-(x-bx)*0.5)-hh;if(pixGet(g,x,y)==='.')continue;pixSet(g,x,y,x<=bx?Au[0]:Au[1]);pixSet(g,x,y+1,x<=bx?Au[1]:Au[2])}}
  // door on the lit face, slit(s)
  const dx=Math.round(pr.base.L[0]+9),dy=Math.round(pr.base.L[1]+9*0.5)-1;
  opening(g,dx,dy,5,AGE===3?10:9,0.5,{fill:(c,r,w,h)=>r===h-1?null:c===0?'x':(c+1)%2?'v':'w'});
  if(AGE===3){pixSet(g,dx+2,dy-10+1,Au[0])}
  if(AGE===3){slit(g,bx+9,by-30,4,false);slit(g,bx-12,by-34,4,false)}else{slit(g,bx+9,by-15,4,true);slit(g,bx-12,by-31,4,false)}
  // ink only on the pier's own silhouette
  const solid=(x,y)=>pixGet(ov,x,y)!=='.';
  const tmp=cloneG(g);inkOutline(tmp,null,solid);
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(tmp[y][x]!==g[y][x]&&ov[y][x]==='.')g[y][x]=tmp[y][x];
  if(AGE===2){// the jettied deck: joist ends poke out over the shaft, which sits in the deck's shadow
    for(let x=Math.ceil(pr.L[0])-1;x<=Math.floor(pr.Rr[0])+1;x++){const y=Math.ceil(deckBottom(x+0.5));if(pixGet(g,x,y)==='.')continue;
      const lit=x<bx,u=Math.abs(x-bx);pixSet(g,x,y,u%4===1?(lit?'v':'x'):lit?'x':'y');pixSet(g,x,y+1,u%4===1?'y':(lit?'m':'M'));
      if(STNc.test(pixGet(g,x,y+2)))pixSet(g,x,y+2,lit?'p':'P')}}
}
// natural lines: worn stone edges, moss at the foot, grass tufts and a little rubble round the feet
const STN=/[hqfaAmpHQnbBMP]/;
wear(g,STN,{p:0.4,notch:0.04,bump:AGE===3?0.05:0.12,seed:5});
moss(g,STN,{h:AGE===3?5:8,split:bx,dens:AGE===3?0.35:0.6,seed:6});
tufts(g,{p:AGE<2?0.7:0.45,maxY:by,split:bx,tol:AGE<2?10:3,rubble:AGE<2?0.1:0.06,seed:7});
if(AGE===3)AK.finial(g,Math.round(ap[0]),Math.round(ap[1]));

// idle: a torch on the front post (Imperial: the lantern fire) flickers; a team banner ripples (under the deck, or on the pier)
const frames=[];
for(let k=0;k<4;k++){const f=cloneG(g);
  if(AGE<2){const q=lerpP(plat.base.Bm,plat.base.Rr,0.22);banner(f,Math.round(q[0]),Math.round(q[1])+2,6,AGE?9:11,k,{sl:-0.5});}
  else{// long banners hung from rods under the deck (Castle: iron rod, one on the shaded face; Imperial: gilt rod and fringe, one on each face)
    const BN=AGE===3?[[pr.base.Bm,pr.base.Rr,0.42,-0.5,0],[pr.base.L,pr.base.Bm,0.18,0.5,2]]:[[pr.base.Bm,pr.base.Rr,0.4,-0.5,0]];
    for(const [A,B,fr,sl,ph] of BN){const q=lerpP(A,B,fr),x0=Math.round(q[0]),y0=Math.round(q[1])-BZ+(AGE===3?5:4),len=AGE===3?15:15,w=AGE===3?6:6;
      banner(f,x0,y0,w,len,k+ph,{sl});
      for(let c=-1;c<=w;c++){const y=y0+Math.floor((c+0.5)*sl);if(pixGet(f,x0+c,y)==='y')pixSet(f,x0+c,y,AGE===3?Au[1]:'J')}
      if(AGE===3)for(let c=0;c<w;c++)for(let r=len+2;r>=1;r--){const x=x0+c,y=y0+Math.floor((c+0.5)*sl)+r;if(/[TLD]/.test(pixGet(f,x,y))){pixSet(f,x,y,c%2?Au[1]:Au[0]);break}}}}
  if(AGE<2){const tx=base.Bm[0]-2,ty=base.Bm[1]-17;torch(f,tx,ty,k);
    for(const [dx,dy] of [[2,-3],[2,-5],[3,-4],[2,1]])if(/[wvk]/.test(pixGet(f,tx+dx,ty+dy)))pixSet(f,tx+dx,ty+dy,(k+dy)%2?'G':'g');}
  else if(AGE===2){const tx=base.Bm[0]-4,ty=base.Bm[1]-13;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,k)}
  else{flame(f,BRZ[0],BRZ[1]-2,k);}
  frames.push(pixText(f));}
return {
  id:'outpost',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:Object.assign({},FORT_PAL,AK.pal,{d:'#e6c272',E:'#d8ab4f',l:'#c99a44',N:'#a07a34',U:'#6f5229'},STONE),
  ...(AGE===0?{roofChars:'dElNU'}:{}),   // the Dark thatch is painted with its own chars: let the engine's team roof tint lean them
  ...(AGE?{flags:[[0,Math.round(ap[1]-by)-(AGE===3?6:3),12]]}:{}),
  frames:{idle:frames},
};
};
export default pixAged(make, 0);
