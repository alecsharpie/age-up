// ---- fortification kit (local to this draft): ashlar faces, flagstones, shingles, parapets, ink outline, banners, flames ----
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
