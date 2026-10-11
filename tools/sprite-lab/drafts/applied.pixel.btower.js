// @pixel btower
// Bombard Tower 2×2: a tall square gun tower. A battered ashlar talus, a slim shaft with a string course, a pair of gun ports on
// each visible face (iron barrels run out along the face's normal), a corbelled gallery whose battlements leave a centred
// embrasure on each front face, a stone gun deck with a bombard on a timber bed run out through each embrasure (mirrored), and
// a slate-capped stair turret in the middle whose apex carries the code-drawn flag. One long team banner hangs centred on each face.
// Frames: idle 4 — the deck guns smoke, the banners ripple.
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
};
// ---- end kit ----
const W=2,H=2,TH=8,ZS=58,PG=7,CAP=15,RISE=14;
const S=1.46,TS=1.66,PS=1.62,CS=0.56;           // shaft, talus and gallery widths, cap turret width (tiles)
const GW=(W+H)*32+4, GH=(W+H)*16+TH+ZS+PG+CAP+RISE+8+10;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
const at=(s,z)=>[bx,by-(W-s)*16-z];             // front (Bm) corner of a centred box of width s whose base is at height z
// ---- talus (battered footing) and shaft
const ta=pixIsoBox(g,...at(TS,0),TS,TS,TH,1,{left:'1',right:'2',top:'3'});
ashlar(g,'1',ta.base.L,ta.base.Bm,LIT,{ch:5,bl:12,plinth:TH,seed:1});ashlar(g,'2',ta.base.Bm,ta.base.Rr,SHD,{ch:5,bl:12,plinth:TH,seed:1});
for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(g[y][x]==='3')g[y][x]='c';
const sh=pixIsoBox(g,...at(S,TH),S,S,ZS,1,{left:'1',right:'2'});
ashlar(g,'1',sh.base.L,sh.base.Bm,LIT,{ch:6,bl:10,seed:4});ashlar(g,'2',sh.base.Bm,sh.base.Rr,SHD,{ch:6,bl:10,seed:5});
pixLine(g,sh.base.Bm[0],sh.base.Bm[1]-1,sh.Bm[0],sh.Bm[1]+1,'K');
// string course
const SC=Math.round(ZS*0.42);
pixLine(g,sh.base.L[0],sh.base.L[1]-SC,sh.base.Bm[0],sh.base.Bm[1]-SC,'q');pixLine(g,sh.base.L[0],sh.base.L[1]-SC+1,sh.base.Bm[0],sh.base.Bm[1]-SC+1,'m');
pixLine(g,sh.base.Bm[0],sh.base.Bm[1]-SC,sh.base.Rr[0],sh.base.Rr[1]-SC,'Q');pixLine(g,sh.base.Bm[0],sh.base.Bm[1]-SC+1,sh.base.Rr[0],sh.base.Rr[1]-SC+1,'M');
// ---- gallery: corbels under an overhanging parapet wall
const gl=pixIsoBox(g,...at(PS,TH+ZS),PS,PS,PG,1,{left:'1',right:'2',top:'3'});
ashlar(g,'1',gl.base.L,gl.base.Bm,LIT,{ch:4,bl:9,seed:7,qL:false,qR:false});ashlar(g,'2',gl.base.Bm,gl.base.Rr,SHD,{ch:4,bl:9,seed:8,qL:false,qR:false});
flagstones(g,'3',gl,{n:5,t1:'C',t2:'S',j:'P'});
pixLine(g,gl.base.Bm[0],gl.base.Bm[1]-1,gl.Bm[0],gl.Bm[1]+1,'K');
machi(g,gl.base.L,gl.base.Bm,1,true);machi(g,gl.base.Bm,gl.base.Rr,1,false);
// battlements: four merlons per side on a symmetric rhythm, so each side has a centred embrasure
const front=crenels(g,gl,PS,PS,{th:0.07,n:[4,4],ml:0.125,f0:0.25,lo:3,hi:8,tex:{L:[gl.base.L,gl.base.Bm],R:[gl.base.Bm,gl.base.Rr],ch:4,bl:9,seed:7}});
// ---- stair turret in the middle with a slate pyramid cap and a door onto the deck
const ct=pixIsoBox(g,...at(CS,TH+ZS+PG),CS,CS,CAP,1,{left:'1',right:'2'});
ashlar(g,'1',ct.base.L,ct.base.Bm,LIT,{ch:4,bl:6,seed:9});ashlar(g,'2',ct.base.Bm,ct.base.Rr,SHD,{ch:4,bl:6,seed:10});
pixLine(g,ct.base.Bm[0],ct.base.Bm[1]-1,ct.Bm[0],ct.Bm[1]+1,'K');
{const p=lerpP(ct.base.L,ct.base.Bm,0.5);opening(g,Math.round(p[0])-3,Math.round(p[1])-1,5,8,0.5,{sur:'q',surround:true,fill:(c,r)=>r===2?'y':c%2?'x':'v'})}
const eave={T:[ct.T[0],ct.T[1]-1],L:[ct.L[0]-2,ct.L[1]+1],Bm:[ct.Bm[0],ct.Bm[1]+2],Rr:[ct.Rr[0]+2,ct.Rr[1]+1]};
const ap=pixIsoRoof(g,eave,RISE,1,{left:'r',back:'t',front:'5',right:'6'});
shingles(g,'5',eave.L,eave.Bm,{u:'u',l:'r',m:'s',s:'t'},{ch:3,bl:4});shingles(g,'6',eave.Bm,eave.Rr,{u:'z',l:'s',m:'t',s:'u'},{ch:3,bl:4});
pixLine(g,eave.Bm[0],eave.Bm[1],ap[0],ap[1],'r');pixSet(g,Math.round(ap[0]),Math.round(ap[1])-1,'o');
// ---- the deck guns: a bombard on a timber bed behind each front embrasure, barrel run out along that face's normal
const BAR=(t,o)=>{const c=o<=-2?'k':o===-1?'I':o===0?'i':o===1?'J':'k';return t%5===2&&o>-2&&o<2?(o===-1?'i':'J'):c};
const GUNS=[[gl.L,gl.Bm,-1],[gl.Bm,gl.Rr,1]].map(([A,B,dir])=>{const e=lerpP(A,B,0.5);return {dir,x:Math.round(e[0])-dir*10,y:Math.round(e[1])-5-5}});
for(const {dir,x,y} of GUNS){   // timber bed under the barrel, with a wheel at the rear
  for(let t=-2;t<=8;t++){const cx=x+dir*t,cy=y+Math.floor(t*0.5)+3;pixSet(g,cx,cy,t<-1?'k':'w');pixSet(g,cx,cy+1,'v');pixSet(g,cx,cy+2,'x');pixSet(g,cx,cy+3,'k')}
  pixStamp(g,x+dir*1-2,y+4,`
.kkk.
kxvxk
kvyvk
kxvxk
.kkk.
`);}
front();
const MZ=[];
const IRON=(o,r,t)=>o===-r-1||o===r?'k':t%4===1?(o<0?'i':'J'):(o+r)/(2*r)<0.34?'I':(o+r)/(2*r)<0.67?'i':'J';   // hoops every 4 px
for(const {dir,x,y} of GUNS){const len=12,r=3;
  for(let t=0;t<=len;t++){const cx=x+dir*t,cy=y+Math.floor(t*0.5),rr=t<1?r-1:r;for(let o=-rr-1;o<=rr;o++)pixSet(g,cx,cy+o,t===0?'k':IRON(o,rr,t))}
  const mx=x+dir*(len+1),my=y+Math.floor((len+1)*0.5);for(let o=-r-2;o<=r+1;o++)pixSet(g,mx,my+o,o===-r-2||o===r+1?'k':o<0?'I':'i');for(let o=-r-1;o<=r;o++)pixSet(g,mx+dir,my+o,o===-r-1||o===r?'k':'e');
  MZ.push([mx+dir*2,my-3,dir]);}
// ---- gun ports on the shaft faces, two per face, mirrored; iron barrels run out along each face's normal
const port=(A,B,f,lit)=>{const p=lerpP(A,B,f),x=Math.round(p[0]),y=Math.round(p[1])-SC-14,dir=lit?-1:1,c=lit?'q':'Q';
  // a round embrasure with a splayed stone surround, the dark bore of the gun inside, a short barrel and a muzzle ring
  for(let yy=-4;yy<=4;yy++)for(let xx=-4;xx<=4;xx++){const d=xx*xx+yy*yy*1.3;if(d<=20.5)pixSet(g,x+xx,y+yy+Math.floor((xx+0.5)*(lit?0.5:-0.5)),d>11?c:'e')}
  for(let t=0;t<=4;t++){const cx=x+dir*t,cy=y+Math.floor(t*0.5);for(let o=-3;o<=2;o++)pixSet(g,cx,cy+o,IRON(o,2,t+2))}
  const mx=x+dir*5,my=y+2;for(let o=-4;o<=3;o++)pixSet(g,mx,my+o-1,o===-4||o===3?'k':o<0?'I':'i');for(let o=-3;o<=2;o++)pixSet(g,mx+dir,my+o-1,o===-3||o===2?'k':'e')};
for(const f of [0.25,0.75]){port(sh.base.L,sh.base.Bm,f,true);port(sh.base.Bm,sh.base.Rr,f,false)}
// loops in the lower shaft, mirrored
for(const f of [0.25,0.75]){const p=lerpP(sh.base.L,sh.base.Bm,f);slit(g,Math.round(p[0])-1,Math.round(p[1])-12,5,true);const q=lerpP(sh.base.Bm,sh.base.Rr,f);slit(g,Math.round(q[0])-1,Math.round(q[1])-12,5,true)}
inkOutline(g);
// ---- idle frames: a banner centred on each face under the gallery, smoke curling from the deck guns' muzzles
const SMOKE=[[[0,0],[1,-2],[0,-4]],[[1,-1],[2,-3],[1,-6],[2,-8]],[[1,-2],[3,-5],[2,-8]],[[0,-1],[2,-4],[3,-7],[3,-10]]];
const BW=8,BL=24;
const frames=[];
for(let k=0;k<4;k++){const f=cloneG(g);
  {const p=lerpP(sh.base.L,sh.base.Bm,0.5);banner(f,Math.round(p[0])-BW/2,Math.round(p[1])-ZS+3,BW,BL,k,{sl:0.5})}
  {const p=lerpP(sh.base.Bm,sh.base.Rr,0.5);banner(f,Math.round(p[0])-BW/2,Math.round(p[1])-ZS+3,BW,BL,k+2,{sl:-0.5})}
  MZ.forEach(([mx,my,dir],gi)=>{const sm=SMOKE[(k+gi*2)%4];sm.forEach(([dx,dy],i)=>{const x=mx+dir*dx,y=my+dy,big=i<sm.length-1;pixSet(f,x,y,'X');pixSet(f,x+1,y,'X');pixSet(f,x,y-1,'V');if(big){pixSet(f,x+1,y-1,'V');pixSet(f,x-1,y,'X');pixSet(f,x,y+1,'X')}})});
  frames.push(pixText(f));}
return {
  id:'btower',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:Object.assign({},FORT_PAL,{V:'#d8d4cc',X:'#aaa69e'}),
  frames:{idle:frames},
};
};
export default pixAged(make, 3);
