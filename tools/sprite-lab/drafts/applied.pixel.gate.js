// @pixel gate
// Gate 1×1, one variant per age (AGE, AK from gen/ages/wrap.mjs; the gate stands from Feudal). The passage runs across the wall
// line, so there are two sets:
//   x — the wall runs along x (neighbours at ±x): the arch is on the +y (lit) face;
//   y — the wall runs along y (neighbours at ±y): the arch is on the +x (shaded) face.
// The wall-axis edges of the gatehouse have no parapet so the wall-walk runs straight through. idle = x. Frames: 4 per set.
//   Feudal   a timber gatehouse on stone footings: a rubble block as high as the Feudal wall with a round arch closed by
//            team-colour plank doors, and over it a jettied, close-studded timber gate room under a brown shingle hip roof with a
//            knob finial; a team banner hangs over the arch.
//   Castle   the original art, unchanged: an ashlar block a little taller than the curtain wall, a voussoir arch with a lowered
//            portcullis, a corbelled parapet, two tall square crenellated towers with team banners.
//   Imperial pale limestone, taller: a gilt string course, taller towers whose corbelled crowns carry steep slate spires with
//            gilt orb finials, gilt-fringed banners.
// The heights of the wall each age meets are in WALL_TOP (keep in step with body.wall.js).
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
const W=1,H=1;
const {S:AS,W:AW,R:AR,Au}=AK;
const LS=AS.map(c=>AK.pal[c]);
const LIME={h:LS[0],q:LS[0],f:LS[1],a:LS[1],A:LS[2],m:LS[4],p:LS[3],H:LS[2],Q:LS[2],n:LS[3],b:LS[3],B:'#9c8d6c',M:LS[5],P:LS[5],
  c:LS[1],C:'#d8cbac',j:LS[3],S:LS[3],g:'#f6dca0',G:'#fbe8b8'};
const STONE=/[hqfaAmpHQnbBMP]/;
// per age: block height Z, tower height TZ (0 = no towers), the joining wall's height + parapet (cover), arch size
const F1={Z:21,TZ:0,wall:15+8,AW:11,AH:15,head:34};
const C=[F1,F1,{Z:24,TZ:54,wall:18+7,AW:11,AH:17,head:0},{Z:28,TZ:64,wall:22+9,AW:11,AH:19,head:22}][AGE];
const {Z,TZ}=C,TS=0.27;
const GW=(W+H)*32+8, GH=(W+H)*16+Math.max(TZ,Z)+8+10+C.head;
const bx=W*32+4, by=GH-4;   // 2 px of margin each side for the towers' oversailing crowns
// tile-local point (u along +x, v along +y; T corner = 0,0) to screen
const P=(u,v)=>[bx+32*(u-v),by-32+16*(u+v)];
/** Imperial banner: the kit banner with gilt hems down both sides and a gilt fringe along the foot. */
function giltBanner(g,x,y,w,h,ph,sl){
  banner(g,x,y,w,h,ph,{sl});
  const oy=c=>Math.floor((c+0.5)*sl);
  for(let c=0;c<w;c++){let last=-1;for(let r=1;r<=h+2;r++)if(/[TLD]/.test(pixGet(g,x+c,y+oy(c)+r)))last=r;
    if(last>0){pixSet(g,x+c,y+oy(c)+last,c%2?Au[1]:Au[0]);if(c===0||c===w-1)for(let r=2;r<last-1;r++)pixSet(g,x+c,y+oy(c)+r,c?Au[2]:Au[1])}}
  for(let c=-1;c<=w;c++)pixSet(g,x+c,y+oy(c),c<0?Au[2]:Au[1]);
}
/** A hip / pyramid roof on a box top (pixIsoBox result), apex `rise` px up, textured with the age's roof material (AK.roofXY);
 *  the back faces are hidden behind the front ones except at the very top. Returns the apex. */
function hipRoof(g,top,rise,ridge=0){
  const ap=pixIsoRoof(g,top,rise,1,{back:'!',left:'@',front:'$',right:'%'});
  const y0=Math.max(0,Math.floor(ap[1])),y1=Math.min(g.length-1,Math.ceil(top.Bm[1])+1),x0=Math.max(0,Math.floor(top.L[0])-1),x1=Math.min(g[0].length-1,Math.ceil(top.Rr[0])+1);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const c=g[y][x];
    if(c==='$')g[y][x]=AK.roofXY(x,y,0.5,0);else if(c==='%')g[y][x]=AK.roofXY(x,y,-0.5,1);
    else if(c==='@')g[y][x]=AK.roofXY(x,y,-0.5,2,{flip:true});else if(c==='!')g[y][x]=AK.roofXY(x,y,0.5,3,{flip:true})}
  // hip lines: a lit ridge down the front hip, an eave shadow line along the two front eaves
  pixLine(g,ap[0],ap[1],top.Bm[0],top.Bm[1],AR[0]);
  pixLine(g,top.L[0],top.L[1],top.Bm[0],top.Bm[1],AR[5]);pixLine(g,top.Bm[0],top.Bm[1],top.Rr[0],top.Rr[1],AR[6]);
  return ap;
}
function gatehouse(axis){
  const g=pixGrid(GW,GH);
  const imp=AGE===3,feu=AGE===1;
  // set y is the mirror of set x across the u=v diagonal
  const box=(u0,v0,u1,v1,z,ch,zb=0)=>{if(axis==='y')[u0,v0,u1,v1]=[v0,u0,v1,u1];const B=P(u1,v1);return pixIsoBox(g,B[0],B[1]-zb,u1-u0,v1-v0,z,1,ch)};
  // ---- the gatehouse block
  const top=box(0,0,1,1,Z,{left:'1',right:'2',top:'3'});
  if(feu){const L1={m:AS[5],h:AS[0],t:[AS[1],AS[2],AS[1]],q:AS[0],p:AS[2]},S1={m:AS[5],h:AS[2],t:[AS[3],AS[4],AS[3]],q:AS[2],p:AS[4]};
    ashlar(g,'1',top.base.L,top.base.Bm,L1,{ch:4,bl:6,plinth:3,seed:4,qL:false,qR:false});ashlar(g,'2',top.base.Bm,top.base.Rr,S1,{ch:4,bl:6,plinth:3,seed:5,qL:false,qR:false});
    flagstones(g,'3',top,{n:3,t1:AS[1],t2:AS[2],j:AS[3],seed:7});}
  else{ashlar(g,'1',top.base.L,top.base.Bm,LIT,{ch:5,bl:8,plinth:2,seed:2,qL:false,qR:false});
    ashlar(g,'2',top.base.Bm,top.base.Rr,SHD,{ch:5,bl:8,plinth:2,seed:3,qL:false,qR:false});
    flagstones(g,'3',top,{n:4});}
  pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,feu?AS[5]:'K');
  const lit=axis==='x',[A,B]=lit?[top.base.L,top.base.Bm]:[top.base.Bm,top.base.Rr],sl=lit?0.5:-0.5;
  if(imp)   // gilt string course under the parapet on both faces
    for(const [a,b,c1,c2] of [[top.base.L,top.base.Bm,Au[0],'m'],[top.base.Bm,top.base.Rr,Au[1],'M']])
      for(let x=Math.ceil(a[0]);x<=Math.floor(b[0]);x++){const y=Math.floor(a[1]+(x+0.5-a[0])*(b[1]-a[1])/(b[0]-a[0]))-Z+4;
        if(STONE.test(pixGet(g,x,y)))pixSet(g,x,y,c1);if(STONE.test(pixGet(g,x,y+1)))pixSet(g,x,y+1,c2)}
  const front=feu?()=>{}:crenels(g,top,W,H,{th:0.12,n:[2,2],ml:0.25,f0:0.25,lo:3,hi:imp?9:7,skip:lit?{TL:1,BR:1}:{LB:1,TR:1},tex:{L:[top.base.L,top.base.Bm],R:[top.base.Bm,top.base.Rr],seed:2}});
  // the arch, centred between the towers: a round arch with a dark passage behind a lowered iron portcullis (Feudal: team plank
  // doors), a lit reveal on the right, a ring of voussoirs with radial joints and a keystone, jamb stones down to a worn sill.
  // Every row follows the face's slope.
  const AW=C.AW,AH=C.AH,mid=lerpP(A,B,0.5),x0=Math.round(mid[0]-AW/2),y0=Math.round(A[1]+(x0+0.5-A[0])*sl)-2;
  const cx=(AW-1)/2,R=AW/2+0.5,Ro=R+2,SP=AH-R,yb=c=>y0+Math.floor((c+0.5)*sl);
  const hIn=c=>Math.abs(c-cx)<R?SP+Math.sqrt(R*R-(c-cx)**2):-1,hOut=c=>Math.abs(c-cx)<Ro?SP+Math.sqrt(Ro*Ro-(c-cx)**2):-1;
  const st=feu?(lit?{a:AS[0],b:AS[1],j:AS[5],d:'k'}:{a:AS[2],b:AS[3],j:AS[5],d:'k'}):lit?{a:'q',b:'h',j:'m',d:'k'}:{a:'Q',b:'H',j:'M',d:'k'};
  const door=(c,r,hi)=>{const top=r===hi-1;if(top)return 'k';if(c===Math.floor(cx)||c===Math.ceil(cx)&&AW%2===0)return 'D';   // the meeting stiles
    if(r===2||r===hi-4)return r===2?'i':'I';return c%3===0?'D':c%3===1?(lit?'L':'T'):'T'};
  for(let c=-2;c<=AW+1;c++){const hi=Math.floor(hIn(c)),ho=Math.round(hOut(c));
    if(c>=0&&c<AW)for(let r=0;r<hi;r++){const top=r===hi-1;
      pixSet(g,x0+c,yb(c)-r,feu?(c===AW-1&&!top?st.b:door(c,r,hi)):c===AW-1?(top?'k':st.b):top?'k':r===0?(c%3===1?'i':'e'):c%3===1?(r%2?'i':'I'):r%4===2?'i':'e')}
    const from=c>=0&&c<AW?hi:(c===-1||c===AW?0:Math.ceil(SP));
    for(let r=from;r<=ho;r++){const ang=Math.atan2(r-SP,c-cx),seg=Math.floor((ang+0.0001)/(Math.PI/7)),seg2=Math.floor((Math.atan2(r-SP,c+1-cx)+0.0001)/(Math.PI/7));
      const key=Math.abs(c-cx)<1&&r>=hi;pixSet(g,x0+c,yb(c)-r,r<SP?(r%4===3?st.j:st.a):key?(imp?Au[0]:st.a):seg!==seg2?st.j:r===ho?st.b:st.a)}
    if(ho>0)pixSet(g,x0+c,yb(c)-ho-1,st.j);}   // a dark joint outlines the ring against the ashlar
  for(const c of [-3,AW+2])for(let r=0;r<Math.ceil(SP);r++)pixSet(g,x0+c,yb(c)-r,st.j);
  for(let c=-1;c<=AW;c++)pixSet(g,x0+c,yb(c)+1,feu?(lit?AS[2]:AS[4]):lit?'p':'P');
  const preFront=cloneG(g);front();const postFront=cloneG(g),frontParapet=(x,y)=>preFront[y][x]!==postFront[y][x];
  const TW=[];let room=null;
  if(TZ){
  // ---- flanking towers at the two ends of the arch face. Their outer faces are flush with the block; the one inner face that
  // shows (beside the arch: the L tower's +x face in set x, the Rr tower's +y face in set y) is inside the block below the
  // wall-walk and behind the front parapet, so those cells are restored from what was there before.
  const under=cloneG(g),inner=[];
  for(const [u0,v0,u1,v1,side] of [[0,1-TS,TS,1,0],[1-TS,1-TS,1,1,1]]){
    const t=box(u0,v0,u1,v1,TZ,{left:'4',right:'5',top:'6'});
    const innerCh=side?null:lit?'5':'4';
    if(innerCh){const [IA,IB]=innerCh==='4'?[t.base.L,t.base.Bm]:[t.base.Bm,t.base.Rr],isl=(IB[1]-IA[1])/(IB[0]-IA[0]);
      for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(g[y][x]===innerCh)inner.push([x,y,IA[1]+(x+0.5-IA[0])*isl-(y+0.5)])}
    ashlar(g,'4',t.base.L,t.base.Bm,LIT,{ch:5,bl:6,plinth:2,seed:6+side});ashlar(g,'5',t.base.Bm,t.base.Rr,SHD,{ch:5,bl:6,plinth:2,seed:8+side});
    flagstones(g,'6',t,{n:2});
    pixLine(g,t.base.Bm[0],t.base.Bm[1]-1,t.Bm[0],t.Bm[1]+1,'K');
    const SC=Z+4;   // string course just above the wall-walk
    pixLine(g,t.base.L[0],t.base.L[1]-SC,t.base.Bm[0],t.base.Bm[1]-SC,imp?Au[0]:'q');pixLine(g,t.base.L[0],t.base.L[1]-SC+1,t.base.Bm[0],t.base.Bm[1]-SC+1,'m');
    pixLine(g,t.base.Bm[0],t.base.Bm[1]-SC,t.base.Rr[0],t.base.Rr[1]-SC,imp?Au[1]:'Q');pixLine(g,t.base.Bm[0],t.base.Bm[1]-SC+1,t.base.Rr[0],t.base.Rr[1]-SC+1,'M');
    if(imp)for(const f of [0.5]){const p=lerpP(t.base.L,t.base.Bm,f),q=lerpP(t.base.Bm,t.base.Rr,f);
      slit(g,Math.round(p[0])-1,Math.round(p[1])-TZ+14,5,true);slit(g,Math.round(q[0])-1,Math.round(q[1])-TZ+14,5,true)}
    // crown: a corbelled band that oversails the shaft, then a low parapet with a merlon on each corner (back one first, front
    // last); Imperial: a steep slate spire on the band instead of the parapet, with a gilt orb finial
    const CE=0.05,CW=TS+2*CE,CZ=6,cr=box(u0-CE,v0-CE,u1+CE,v1+CE,CZ,{left:'7',right:'8',top:'6'},TZ-CZ);
    flagstones(g,'6',cr,{n:2});
    pixLine(g,cr.base.L[0],cr.base.L[1]+1,cr.base.Bm[0],cr.base.Bm[1]+1,'k');pixLine(g,cr.base.Bm[0],cr.base.Bm[1]+1,cr.base.Rr[0],cr.base.Rr[1]+1,'k');
    for(const [a,b,c] of [[cr.base.L,cr.base.Bm,'m'],[cr.base.Bm,cr.base.Rr,'M']])for(let x=Math.ceil(a[0])+1;x<b[0]-1;x+=3){const y=Math.round(a[1]+(x+0.5-a[0])*(b[1]-a[1])/(b[0]-a[0]));pixSet(g,x,y+2,c)}
    if(imp){ashlar(g,'7',cr.base.L,cr.base.Bm,LIT,{ch:4,bl:6,seed:6,qL:false,qR:false,any:true});ashlar(g,'8',cr.base.Bm,cr.base.Rr,SHD,{ch:4,bl:6,seed:7,qL:false,qR:false,any:true});
      pixLine(g,cr.L[0],cr.L[1],cr.Bm[0],cr.Bm[1],Au[0]);pixLine(g,cr.Bm[0],cr.Bm[1],cr.Rr[0],cr.Rr[1],Au[1]);
      const ap=hipRoof(g,cr,22);AK.finial(g,Math.round(ap[0]),Math.round(ap[1])-1);
    }else{
    const cap=crenels(g,cr,CW,CW,{th:0.14,n:[0,0],lo:3,hi:3,chs:{left:'7',right:'8',top:'h'}});
    const m=0.12,corner=(du,dv)=>{const u=du*(CW-m)+m,v=dv*(CW-m)+m;pixIsoBox(g,cr.T[0]+32*(u-v),cr.T[1]+16*(u+v),m,m,8,1,{left:'7',right:'8',top:'h'})};
    corner(0,0);corner(0,1);corner(1,0);cap();corner(1,1);
    ashlar(g,'7',cr.base.L,cr.base.Bm,LIT,{ch:4,bl:6,seed:6,qL:false,qR:false,any:true});ashlar(g,'8',cr.base.Bm,cr.base.Rr,SHD,{ch:4,bl:6,seed:7,qL:false,qR:false,any:true});
    }
    TW.push(t);
  }
  for(const [x,y,z] of inner)if(z<Z||frontParapet(x,y))g[y][x]=under[y][x];
  for(const [x,y,z] of inner)if(z>=Z&&!frontParapet(x,y)&&inner.some(([x2,y2,z2])=>x2===x&&y2===y+1&&z2<Z)&&!frontParapet(x,y+1))g[y][x]=lit?'M':'P';   // seam where it rises out of the walk
  }else{
    // ---- Feudal: a jettied timber gate room over the passage, under a shingle hip roof. It sits back from the wall-axis edges so
    // the wall-walk runs into its doors, and oversails the arch faces by a joist's depth.
    const RZ=15,i0=0.2,o=0.03;
    const rm=box(i0,-o,1-i0,1+o,RZ,{left:'4',right:'5',top:'6'},Z);
    const rA=lit?rm.base.L:rm.base.Bm,rB=lit?rm.base.Bm:rm.base.Rr,len=Math.round(rB[0]-rA[0]);
    for(const [ch,a,b,face] of [['4',rm.base.L,rm.base.Bm,0],['5',rm.base.Bm,rm.base.Rr,1]]){const s2=(b[1]-a[1])/(b[0]-a[0]),L=Math.round(b[0]-a[0]);
      for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){if(g[y][x]!==ch)continue;const u=x-a[0],h=Math.floor(a[1]+(x+0.5-a[0])*s2-(y+0.5));
        g[y][x]=AK.wallTex(u,h,face,{len:L,H:RZ,pl:0,step:L>40?9:7})}}
    // joist ends under the jetty
    for(const [a,b,c] of [[rm.base.L,rm.base.Bm,AW[2]],[rm.base.Bm,rm.base.Rr,AW[2]]])for(let x=Math.ceil(a[0]);x<=Math.floor(b[0]);x++){const y=Math.round(a[1]+(x+0.5-a[0])*(b[1]-a[1])/(b[0]-a[0]));
      pixSet(g,x,y+1,x%3===0?AW[0]:c)}
    // a shuttered window over the arch face
    const wm=lerpP(rA,rB,0.5);AK.windowAt(g,Math.round(wm[0]),Math.round(wm[1])-8,sl,lit?0:1);
    // the roof's eaves oversail the room by a couple of px all round
    const ev=box(i0-0.05,-o-0.04,1-i0+0.05,1+o+0.04,0,{},Z+RZ),evTop={T:ev.base.T,L:ev.base.L,Bm:ev.base.Bm,Rr:ev.base.Rr};
    const ap=hipRoof(g,evTop,20);
    AK.finial(g,Math.round(ap[0]),Math.round(ap[1])-1);
    room=rm;
  }
  // joints: the wall segment behind (−x in set x, −y in set y) covers this edge up to its parapet, so no ink there
  const cover=pixGrid(GW,GH);pixIsoBox(cover,bx+(lit?-32:32),by-16,1,1,C.wall,1,{left:'#',right:'#',top:'#'});
  inkOutline(g,null,(x,y)=>pixGet(cover,x,y)==='#');
  const frames=[];
  for(let k=0;k<4;k++){const f=cloneG(g);
    TW.forEach((t,i)=>{const [a,b]=lit?[t.base.L,t.base.Bm]:[t.base.Bm,t.base.Rr],p=lerpP(a,b,0.5);
      if(imp)giltBanner(f,Math.round(p[0])-3,Math.round(p[1])-TZ+24,6,18,k+i*2,sl);else banner(f,Math.round(p[0])-3,Math.round(p[1])-TZ+10,6,16,k+i*2,{sl})});
    if(room){const [a,b]=lit?[room.base.L,room.base.Bm]:[room.base.Bm,room.base.Rr];
      const [c,d]=lit?[top.base.L,top.base.Bm]:[top.base.Bm,top.base.Rr];
      for(const [fr,ph] of [[0.15,0],[0.85,2]]){const p=lerpP(c,d,fr);banner(f,Math.round(p[0])-2,Math.round(p[1])-Z+1,5,11,k+ph,{sl,charge:false})}}
    frames.push(pixText(f));}
  return frames;
}
const sets={x:gatehouse('x'),y:gatehouse('y')};
sets.idle=sets.x;
return {
  id:'gate',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:AGE===3?{...FORT_PAL,...AK.pal,...LIME}:{...FORT_PAL,...AK.pal},
  frames:sets,
};
};
export default pixAged(make, 1);
