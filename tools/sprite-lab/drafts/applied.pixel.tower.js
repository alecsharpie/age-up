// @pixel tower
// Watch tower 1×1, one variant per age (AGE, AK = pixAgeKit(AGE) come from gen/ages/wrap.mjs):
//   Feudal   a shorter timber tower: plank shaft with X-braces on a rubble-stone footing, a timber hoarding with loopholes and
//            hung team shields, a brown oak shingle pyramid roof.
//   Castle   the square ashlar shaft (plinth, quoins, cross arrow slits, a studded door) under the timber hoarding, now capped by
//            red clay tiles with an iron collar at the apex. A team banner hangs down the lit face.
//   Imperial tallest: pale limestone with a gilt string course, a stone belfry on machicolations with arched gilt-sill windows,
//            corner pinnacles, a tall slate spire with gilt hip cresting and an orb finial; a gilt-fringed banner.
// The code-drawn flag stands on the apex (spec.flags follows it). Frames: idle 4 — the banner ripples, a watch-fire flickers.
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
const W=1,H=1,Z=[0,38,42,48][AGE],HOARD=[0,9,9,11][AGE],SZ=Z-HOARD,RISE=[0,16,18,34][AGE];
const GW=(W+H)*32+8, GH=(W+H)*16+Z+HOARD+8+10+(AGE===3?16:0);
const bx=W*32+4, by=GH-4;
const g=pixGrid(GW,GH);
const {R,Au,Fe,Gl,DEEP}=AK;
const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),mix=(a,b,t)=>'#'+hex(a).map((v,i)=>Math.round(v+(hex(b)[i]-v)*t).toString(16).padStart(2,'0')).join('');
// stone chars of the fort kit recoloured with this age's AK stone (Castle keeps the fort kit's dressed grey ashlar as it was)
const sp=i=>AK.pal[AK.S[i]];
const STONE=AGE===2?{}:{h:sp(0),q:sp(0),f:sp(1),a:mix(sp(1),sp(2),0.45),A:sp(2),m:mix(sp(4),sp(5),0.5),p:sp(3),
  H:mix(sp(2),sp(3),0.4),Q:sp(2),n:sp(3),b:mix(sp(3),sp(4),0.4),B:sp(4),M:sp(5),P:mix(sp(4),sp(5),0.5),c:sp(1),C:sp(2),j:sp(3),S:sp(3)};
// roof faces of a pyramid with the age kit's material: '6' back-left (face 2, flip), '7' back-right (3, flip), '8' front-left (0), '9' front-right (1)
function ageRoof(tmpF,{off=0}={}){const F={'6':[-0.5,2,1],'7':[0.5,3,1],'8':[0.5,0,0],'9':[-0.5,1,0]};
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){const f=F[g[y][x]];if(f&&(!tmpF||tmpF.includes(g[y][x])))g[y][x]=AK.roofXY(x,y,f[0],f[1],{flip:!!f[2],off})}}
// ---- shaft
const S0=0.8, sb=[bx,by-16+S0*16];                                         // a slimmer shaft centred on the tile
const pl=pixIsoBox(g,bx,by-16+0.9*16,0.9,0.9,4,1,{left:'1',right:'2'});    // battered footing course
ashlar(g,'1',pl.base.L,pl.base.Bm,LIT,{ch:4,bl:6,plinth:4,seed:1});ashlar(g,'2',pl.base.Bm,pl.base.Rr,SHD,{ch:4,bl:6,plinth:4,seed:1});
let sh;
if(AGE===1){
  // rubble footing to 9 px, then a plank shaft with corner posts, rails and X-braces
  const FZ=9;const st=pixIsoBox(g,sb[0],sb[1],S0,S0,FZ,1,{left:'1',right:'2'});
  ashlar(g,'1',st.base.L,st.base.Bm,LIT,{ch:4,bl:6,plinth:2,seed:2});ashlar(g,'2',st.base.Bm,st.base.Rr,SHD,{ch:4,bl:6,plinth:2,seed:3});
  sh=pixIsoBox(g,sb[0],sb[1]-FZ,S0,S0,SZ-(by-sb[1])-FZ,1,{left:'1',right:'2'});
  const tz=SZ-(by-sb[1])-FZ;
  // the age kit's half-timbered wall (studs, rails, daub) on both faces
  for(const [tmp,A,B,face] of [['1',sh.base.L,sh.base.Bm,0],['2',sh.base.Bm,sh.base.Rr,1]]){const sl=(B[1]-A[1])/(B[0]-A[0]),len=Math.round(B[0]-A[0]);
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(g[y][x]===tmp){const u=x-Math.floor(A[0]),h=Math.max(0,Math.floor(A[1]+(x+0.5-A[0])*sl-(y+0.5)));g[y][x]=AK.wallTex(u,h,face,{len,H:Math.round(tz),pl:0,step:9})}}
  sh.base=st.base;
  // X-braces in each half-storey, corner posts
  const fp=(A,B,u,h)=>[A[0]+u,A[1]+u*(B[1]-A[1])/(B[0]-A[0])-h];
  for(const [A,B,c,c2] of [[st.base.L,st.base.Bm,'x','w'],[st.base.Bm,st.base.Rr,'y','x']]){const len=B[0]-A[0];
    for(const [h0,h1] of [[FZ+1,FZ+tz/2]]){
      const p=fp(A,B,2,h0),q=fp(A,B,len-2,h1),r=fp(A,B,2,h1),s2=fp(A,B,len-2,h0);
      pixLine(g,p[0],p[1],q[0],q[1],c);pixLine(g,r[0],r[1],s2[0],s2[1],c);}
    for(const u of [0,len-1]){const p=fp(A,B,u,FZ),q=fp(A,B,u,FZ+tz);pixLine(g,p[0],p[1],q[0],q[1]+1,u===0&&A===st.base.L?'v':'x')}}
  for(let h=FZ+3;h<FZ+tz-1;h+=5){const p=fp(st.base.L,st.base.Bm,1,h);pixSet(g,p[0],p[1],'i')}  // iron nails on the corner post
}else{
  sh=pixIsoBox(g,sb[0],sb[1],S0,S0,SZ-(by-sb[1]),1,{left:'1',right:'2'});
  ashlar(g,'1',sh.base.L,sh.base.Bm,LIT,{ch:5,bl:8,plinth:3,seed:2});
  ashlar(g,'2',sh.base.Bm,sh.base.Rr,SHD,{ch:5,bl:8,plinth:3,seed:3});
}
pixLine(g,sh.base.Bm[0],sh.base.Bm[1]-1,sh.Bm[0],sh.Bm[1],'K');            // the lit-to-shade corner
if(AGE===3)for(const hh of [17]){for(let x=Math.ceil(sh.base.L[0]);x<=Math.floor(sh.base.Rr[0]);x++){                 // gilt string course
  const y=Math.floor(x<=bx?sh.base.L[1]+(x-sh.base.L[0])*0.5:sh.base.Bm[1]-(x-bx)*0.5)-hh;pixSet(g,x,y,x<=bx?Au[0]:Au[1]);pixSet(g,x,y+1,x<=bx?Au[1]:Au[2])}}
// ---- gallery overhanging the shaft on corbels: timber hoarding (Feudal, Castle) or a stone belfry on machicolations (Imperial)
const s=1.04, hb=[bx,by-16+s*16-SZ];
const hy=(x)=>x<=bx?hb[1]-(bx-x)*0.5:hb[1]-(x-bx)*0.5;                   // gallery underside line over the shaft faces
const LOOP=[];let ho;
if(AGE<3){
  for(let x=Math.ceil(sh.base.L[0]);x<=sh.base.Rr[0];x++){const y=Math.floor(hy(x));pixSet(g,x,y+1,x<=bx?'M':'k');pixSet(g,x,y+2,x<=bx?'m':'M')}
  for(const f of [0.12,0.37,0.62,0.87]){for(const side of [-1,1]){const x=Math.round(bx+side*(1-f)*32*S0),y=Math.floor(hy(x));pixSet(g,x,y+1,'x');pixSet(g,x,y+2,'x');pixSet(g,x,y+3,'y');pixSet(g,x-1,y+1,side<0?'v':'x')}}
  ho=pixIsoBox(g,hb[0],hb[1],s,s,HOARD,1,{left:'3',right:'4',top:'5'});
  planks(g,'3',ho.base.L,ho.base.Bm,{l:'w',m:'v',s:'w',g:'x',r:'x'},{bw:3,rails:[0,HOARD-1],seed:4});
  planks(g,'4',ho.base.Bm,ho.base.Rr,{m:'x',s:'v',g:'y',r:'y'},{bw:3,rails:[0,HOARD-1],seed:5});
  for(const f of [0.28,0.72]){
    const p=lerpP(ho.base.L,ho.base.Bm,f);LOOP.push([Math.round(p[0]),Math.round(p[1])-4]);opening(g,Math.round(p[0]),Math.round(p[1])-3,2,4,0.5,{arch:false,sur:'y',jamb:'w'});
    const q=lerpP(ho.base.Bm,ho.base.Rr,f);opening(g,Math.round(q[0]),Math.round(q[1])-3,2,4,-0.5,{arch:false,sur:'y',jamb:'v'});}
  {const p=lerpP(ho.base.L,ho.base.Bm,0.5);shield(g,Math.round(p[0])-3,Math.round(p[1])-8);const q=lerpP(ho.base.Bm,ho.base.Rr,0.5);shield(g,Math.round(q[0])-2,Math.round(q[1])-8)}
}else{
  ho=pixIsoBox(g,hb[0],hb[1],s,s,HOARD,1,{left:'3',right:'4',top:'5'});
  ashlar(g,'3',ho.base.L,ho.base.Bm,LIT,{ch:4,bl:7,seed:8,plinth:2});ashlar(g,'4',ho.base.Bm,ho.base.Rr,SHD,{ch:4,bl:7,seed:9,plinth:2});
  machi(g,[ho.base.L[0]+1,ho.base.L[1]],[ho.base.Bm[0],ho.base.Bm[1]],1,true);machi(g,[ho.base.Bm[0]+1,ho.base.Bm[1]],[ho.base.Rr[0]-1,ho.base.Rr[1]],1,false);
  // arched belfry windows: two per face, firelit, gilt sill
  for(const f of [0.3,0.72]){for(const [A,B,sl,lit] of [[ho.base.L,ho.base.Bm,0.5,true],[ho.base.Bm,ho.base.Rr,-0.5,false]]){
    const p=lerpP(A,B,f),x=Math.round(p[0]),y=Math.round(p[1])-3;if(lit)LOOP.push([x,y-4]);
    opening(g,x,y,3,8,sl,{sur:lit?'q':'Q',jamb:lit?'h':'H',fill:(c,r)=>r===0?null:(c===1&&r>2?Gl[1]:Gl[0])});
    pixSet(g,x-1,y+Math.round(-0.5*sl)+1,Au[1]);for(let c=0;c<3;c++)pixSet(g,x+c,y+Math.floor((c+0.5)*sl)+1,Au[lit?0:1]);}}
}
// ---- roof: shingle pyramid (Feudal), tiled pyramid (Castle) over the hoarding; Imperial: a battlemented belfry top with a slim
// slate spire rising inside the parapet. The apex is where the game plants the flag.
let ap,rt;
if(AGE<3){
  rt={T:[ho.T[0],ho.T[1]-1],L:[ho.L[0]-0.5,ho.L[1]],Rr:[ho.Rr[0]+0.5,ho.Rr[1]],Bm:[ho.Bm[0],ho.Bm[1]+1]};
  ap=pixIsoRoof(g,rt,RISE,1,{left:'6',back:'7',front:'8',right:'9'});
  ageRoof();
  pixLine(g,rt.Bm[0],rt.Bm[1],ap[0],ap[1],R[6]);pixLine(g,rt.L[0],rt.L[1],ap[0],ap[1],R[0]);
  pixLine(g,rt.L[0],rt.L[1],rt.Bm[0],rt.Bm[1],'k');pixLine(g,rt.Bm[0],rt.Bm[1],rt.Rr[0],rt.Rr[1],'k');
  for(let x=Math.ceil(ho.L[0]);x<=ho.Rr[0];x++){const y=Math.floor(x<=bx?ho.Bm[1]-(bx-x)*0.5:ho.Bm[1]-(x-bx)*0.5)+1;if(pixGet(g,x,y)!=='.')pixSet(g,x,y,x<=bx?'x':'y')} // eave shadow on the hoarding
}else{
  flagstones(g,'5',ho,{n:3});
  const front=crenels(g,ho,s,s,{n:[2,2],lo:3,hi:6,th:0.1});
  // spire on a square base inset in the walkway
  const k=0.62,cxy=[ho.Bm[0],ho.Bm[1]-s*16];   // top-face centre
  rt={T:[cxy[0],cxy[1]-k*16],L:[cxy[0]-k*32,cxy[1]],Rr:[cxy[0]+k*32,cxy[1]],Bm:[cxy[0],cxy[1]+k*16]};
  ap=pixIsoRoof(g,rt,RISE,1,{left:'6',back:'7',front:'8',right:'9'});
  ageRoof();
  pixLine(g,rt.Bm[0],rt.Bm[1],ap[0],ap[1],R[6]);pixLine(g,rt.L[0],rt.L[1],ap[0],ap[1],R[0]);
  // gilt cresting: studs up the front hip and the lit hip
  const hip=(a)=>{const n=Math.round(Math.abs(ap[1]-a[1]));for(let i=3;i<n-3;i+=3){const t=i/n;pixSet(g,Math.round(a[0]+(ap[0]-a[0])*t),Math.round(a[1]+(ap[1]-a[1])*t),Au[0])}};
  hip(rt.Bm);
  AK.trim(g,[rt.L[0],rt.L[1]],[rt.Bm[0],rt.Bm[1]]);AK.trim(g,[rt.Bm[0],rt.Bm[1]],[rt.Rr[0],rt.Rr[1]]);
  front();
  // slate pinnacles with gilt tips on the three front corners of the parapet
  for(const P of [ho.L,ho.Rr,ho.Bm]){const x=Math.round(P[0])+(P===ho.L?2:P===ho.Rr?-2:0),y=Math.round(P[1])-5;
    pixStamp(g,x-2,y-8,`
..λ..
..k..
.kγk.
.kδk.
kγδεk
kγδεk
kkkkk
`.replace(/γ/g,R[1]).replace(/δ/g,R[3]).replace(/ε/g,R[5]).replace(/λ/g,Au[0]))}
}
pixSet(g,ap[0],ap[1],AGE===2?Fe[1]:'o');pixSet(g,ap[0],ap[1]+1,AGE===2?Fe[0]:'o');
// ---- openings in the shaft: door on the lit face, slits (stone ages) or loopholes (timber)
if(AGE===1)opening(g,bx-11,by-6-3,6,9,0.5,{arch:false,sur:'y',jamb:'w',fill:(c,r,w,h)=>r===h-1?null:c===0?'x':(c+1)%2?'v':'w'});
else opening(g,bx-11,by-6-3,6,10,0.5,{fill:(c,r,w,h)=>r===h-1?null:c===0?'x':(c+1)%2?'v':'w'});
{const d=[bx-11,by-6-3];pixSet(g,d[0]+1,d[1]-4+0,'i');pixSet(g,d[0]+3,d[1]-3+1,'i');pixSet(g,d[0]+3,d[1]-6+1,'i')}
const SY=by-SZ+(AGE===1?6:-2);
if(AGE===1){AK.windowAt(g,bx-12,SY-2,0.5,0);AK.windowAt(g,bx+12,SY-2,-0.5,1)}
else{slit(g,bx-8,SY,5,true);slit(g,bx+8,SY,5,true);slit(g,bx+18,SY+11,4,false);if(AGE===3){slit(g,bx-18,SY+18,4,false);slit(g,bx+12,SY+20,4,false)}}
inkOutline(g);
// AGE 3: the gilt orb finial on the spire's apex (after the outline so it keeps its own ink)
if(AGE===3)AK.finial(g,Math.round(ap[0]),Math.round(ap[1]));
// ---- idle: the banner ripples down the lit face (gilt rod and fringe in Imperial), a watch-fire flickers behind a loophole
const frames=[];
for(let k=0;k<4;k++){const f=cloneG(g);
  const bxx=bx-22,byy=Math.floor(hy(bxx))+(AGE===3?6:3),blen=[0,9,15,17][AGE];
  banner(f,bxx,byy,7,blen,k,{sl:0.5});
  if(AGE===3){for(let c=-1;c<=7;c++){const y=byy+Math.floor((c+0.5)*0.5);if(pixGet(f,bxx+c,y)==='y')pixSet(f,bxx+c,y,Au[1])}
    for(let c=0;c<7;c++)for(let r=blen+2;r>=1;r--){const y=byy+Math.floor((c+0.5)*0.5)+r,ch=pixGet(f,bxx+c,y);if(/[TLD]/.test(ch)){pixSet(f,bxx+c,y,c%2?Au[1]:Au[0]);break}}}
  const [lx,ly]=LOOP[0];pixSet(f,lx,ly+1,k%2?'R':'Y');pixSet(f,lx,ly+2,k===2?'Y':'R');
  frames.push(pixText(f));}
return {
  id:'tower',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:Object.assign({},FORT_PAL,AK.pal,STONE),
  flags:[[0,Math.round(ap[1]-by)-(AGE===3?6:0),12]],
  frames:{idle:frames},
};
};
export default pixAged(make, 1);
