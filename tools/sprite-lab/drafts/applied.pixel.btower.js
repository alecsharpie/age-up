// @pixel btower
// Bombard Tower 2×2: squat heavy ashlar block on a battered plinth, quoins, a corbelled parapet with merlons, a timber gun deck
// with an iron-banded bombard aimed over the battlements, a cannon port with its barrel on the shaded face, team banners on both faces.
// Frames: idle 4 — gun smoke curls from the port's muzzle, the slow-match brazier on the deck flickers, the banners ripple.
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
const W=2,H=2,Z=34;
const GW=(W+H)*32+4, GH=(W+H)*16+Z+6+10;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
// battered plinth, then the main block
const pb=pixIsoBox(g,bx,by,W+0.06,H+0.06,7,1,{left:'1',right:'2'});
ashlar(g,'1',pb.base.L,pb.base.Bm,LIT,{ch:7,bl:12,plinth:7,seed:1});ashlar(g,'2',pb.base.Bm,pb.base.Rr,SHD,{ch:7,bl:12,plinth:7,seed:1});
const top=pixIsoBox(g,bx,by-1,W,H,Z-1,1,{left:'1',right:'2',top:'3'});
ashlar(g,'1',top.base.L,top.base.Bm,LIT,{ch:6,bl:11,seed:4});ashlar(g,'2',top.base.Bm,top.base.Rr,SHD,{ch:6,bl:11,seed:5});
flagstones(g,'3',top,{n:5});
pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,'K');
// corbel table under the parapet on both faces
machi(g,top.L,top.Bm,1,true);machi(g,top.Bm,top.Rr,1,false);
// battlements: back parapets now, front parapets after the gun deck
const front=crenels(g,top,W,H,{th:0.07,n:[4,4],ml:0.13,f0:0.2,lo:3,hi:7,tex:{L:[top.base.L,top.base.Bm],R:[top.base.Bm,top.base.Rr],ch:6,bl:11,seed:4}});
// timber gun deck and the bombard pointing over the front-right parapet
const dk=pixIsoBox(g,top.Bm[0]+4,top.Bm[1]-20,0.85,0.85,4,1,{left:'4',right:'5',top:'6'});
planks(g,'4',dk.base.L,dk.base.Bm,{l:'w',m:'v',s:'w',g:'x',r:'x'},{bw:4,rails:[0]});planks(g,'5',dk.base.Bm,dk.base.Rr,{m:'x',s:'v',g:'y',r:'y'},{bw:4,rails:[0]});
for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(g[y][x]==='6')g[y][x]=((x+2*y)>>3)%2?'w':'v';
// the bombard: an iron-banded barrel on a timber bed, aimed down-right over the battlements
const gx=dk.Bm[0]-14,gy=dk.Bm[1]-13;
pixStamp(g,gx+2,gy+3,`
..kkkkkkkkk......
.kwwwwvvvvvxk....
kwvvvvvvvvvxxk...
.kxxxxxxxxxyyyk..
..kyyk...kyyk....
...kk.....kk.....
`);
const BAR=(t,o)=>{const c=o<=-2?'k':o===-1?'I':o===0?'i':o===1?'J':'k';return t%5===2&&o>-2&&o<2?(o===-1?'i':'J'):c};
for(let t=0;t<=18;t++){const cx=gx+t,cy=gy+Math.floor(t*0.5);const r=t<2?1:2;for(let o=-r-(t<1?0:0);o<=r;o++)pixSet(g,cx,cy+o,t===0?'k':BAR(t,o))}
{const mx=gx+18,my=gy+9;for(let o=-3;o<=3;o++){pixSet(g,mx,my+o,Math.abs(o)===3?'k':'I');pixSet(g,mx+1,my+o,Math.abs(o)===3?'k':o<0?'i':'J')}pixSet(g,mx+1,my,'e');pixSet(g,mx+1,my-1,'e');pixSet(g,mx+2,my-2,'k');pixSet(g,mx+2,my+2,'k');for(let o=-1;o<=1;o++)pixSet(g,mx+2,my+o,'k')}
// a stack of shot beside the gun
pixStamp(g,dk.L[0]+6,dk.L[1]-6,`
.kk.
kIik
kiJkk
.kkIik
..kiJk
...kk.
`);
const BRZ=[dk.T[0]-2,dk.T[1]+3];pixStamp(g,BRZ[0]-2,BRZ[1]-1,`
kiIik
.kJk.
..y..
`);
front();
// cannon port on the shaded face with a barrel, a blind port on the lit face
const pr=[Math.round(lerpP(top.base.Bm,top.base.Rr,0.5)[0]),Math.round(lerpP(top.base.Bm,top.base.Rr,0.5)[1]-Z*0.55)];
pixStamp(g,pr[0]-6,pr[1]-5,`
..qQQQQq..
.qeeeeeeQ.
QeeeeeeeeQ
QeeeeeeeeQ
QeeeeeeeeQ
.QeeeeeeQ.
..QQQQQQ..
`);
// the barrel sticks straight out of the port (down-right, along the face's normal) instead of lying flat along the wall
for(let k=0;k<10;k++){const yy=pr[1]-4+Math.floor(k/2);pixSet(g,pr[0]-3+k,yy-1,'k');pixSet(g,pr[0]-3+k,yy,'I');pixSet(g,pr[0]-3+k,yy+1,'i');pixSet(g,pr[0]-3+k,yy+2,'J');pixSet(g,pr[0]-3+k,yy+3,'k')}
const MZ=[pr[0]+7,pr[1]-1];pixLine(g,MZ[0],MZ[1]-1,MZ[0],MZ[1]+3,'k');pixSet(g,MZ[0]-1,MZ[1]+1,'J');
const pl=[Math.round(lerpP(top.base.L,top.base.Bm,0.62)[0]),Math.round(lerpP(top.base.L,top.base.Bm,0.62)[1]-Z*0.5)];
pixStamp(g,pl[0]-4,pl[1]-4,`
.qqqq..
qeeeeq.
qeeeeeq
qeeeeeq
.qeeeeq
..qqqq.
`);
// arrow slits near the corners
slit(g,top.base.L[0]+9,top.base.L[1]-22,5,true);slit(g,top.base.Rr[0]-12,top.base.Rr[1]-22,5,true);slit(g,top.base.Bm[0]-8,top.base.Bm[1]-14,4,false);
inkOutline(g);
// idle frames
const SMOKE=[[[0,0],[1,-2],[0,-4]],[[1,-1],[2,-3],[1,-6],[2,-8]],[[1,-2],[3,-5],[2,-8]],[[0,-1],[2,-4],[3,-7],[3,-10]]];
const frames=[];
for(let k=0;k<4;k++){const f=cloneG(g);
  {const p=lerpP(top.base.L,top.base.Bm,0.22);banner(f,Math.round(p[0]),Math.round(p[1])-Z+7,8,17,k,{sl:0.5})}
  {const p=lerpP(top.base.Bm,top.base.Rr,0.8);banner(f,Math.round(p[0])-4,Math.round(p[1])-Z+7,8,17,k+1,{sl:-0.5})}
  flame(f,BRZ[0],BRZ[1]-1,k);
  SMOKE[k].forEach(([dx,dy],i)=>{const x=MZ[0]+2+dx,y=MZ[1]-1+dy,big=i<SMOKE[k].length-1;pixSet(f,x,y,'X');pixSet(f,x+1,y,'X');pixSet(f,x,y-1,'V');if(big){pixSet(f,x+1,y-1,'V');pixSet(f,x-1,y,'X');pixSet(f,x,y+1,'X')}});
  frames.push(pixText(f));}
export default {
  id:'btower',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:Object.assign({},FORT_PAL,{V:'#d8d4cc',X:'#aaa69e'}),
  frames:{idle:frames},
};
