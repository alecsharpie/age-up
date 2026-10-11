// @pixel gate
// Gate 1×1: a gatehouse that reads as a gate from across the map. An ashlar block a little taller than the curtain wall, with one
// big voussoir arch, a lowered iron portcullis and a corbelled parapet over it, flanked by two tall square towers (string course,
// cross slit, merlon caps) that rise well above the wall-walk, with a team banner high on each tower's arch-side face. The passage
// runs across the wall line, so there are two sets:
//   x — the wall runs along x (neighbours at ±x): the arch is on the +y (lit) face, towers at the L and Bm corners;
//   y — the wall runs along y (neighbours at ±y): the arch is on the +x (shaded) face, towers at the Rr and Bm corners.
// The wall-axis edges of the gatehouse have no parapet so the wall-walk runs straight through. idle = x.
// Frames: 4 per set — the banners ripple.
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
const W=1,H=1,Z=24,TZ=54,TS=0.27;
const GW=(W+H)*32+8, GH=(W+H)*16+TZ+8+10;
const bx=W*32+4, by=GH-4;   // 2 px of margin each side for the towers' oversailing crowns
// tile-local point (u along +x, v along +y; T corner = 0,0) to screen
const P=(u,v)=>[bx+32*(u-v),by-32+16*(u+v)];
function gatehouse(axis){
  const g=pixGrid(GW,GH);
  // set y is the mirror of set x across the u=v diagonal
  const box=(u0,v0,u1,v1,z,ch,zb=0)=>{if(axis==='y')[u0,v0,u1,v1]=[v0,u0,v1,u1];const B=P(u1,v1);return pixIsoBox(g,B[0],B[1]-zb,u1-u0,v1-v0,z,1,ch)};
  // ---- the gatehouse block
  const top=box(0,0,1,1,Z,{left:'1',right:'2',top:'3'});
  ashlar(g,'1',top.base.L,top.base.Bm,LIT,{ch:5,bl:8,plinth:2,seed:2,qL:false,qR:false});
  ashlar(g,'2',top.base.Bm,top.base.Rr,SHD,{ch:5,bl:8,plinth:2,seed:3,qL:false,qR:false});
  flagstones(g,'3',top,{n:4});
  pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,'K');
  const lit=axis==='x',[A,B]=lit?[top.base.L,top.base.Bm]:[top.base.Bm,top.base.Rr],[TA,TB]=lit?[top.L,top.Bm]:[top.Bm,top.Rr],sl=lit?0.5:-0.5;
  const front=crenels(g,top,W,H,{th:0.12,n:[2,2],ml:0.25,f0:0.25,lo:3,hi:7,skip:lit?{TL:1,BR:1}:{LB:1,TR:1},tex:{L:[top.base.L,top.base.Bm],R:[top.base.Bm,top.base.Rr],seed:2}});
  // the arch, centred between the towers: dark passage, iron portcullis, voussoirs with a keystone, a worn sill
  const AW=11,AH=17,mid=lerpP(A,B,0.5),x0=Math.round(mid[0]-AW/2),y0=Math.round(A[1]+(x0+0.5-A[0])*sl)-2;
  // a round arch: dark passage behind a lowered iron portcullis (spiked foot), a lit reveal on the right, a ring of voussoirs
  // with radial joints and a keystone, jamb stones down to a worn sill. Every row follows the face's slope.
  const cx=(AW-1)/2,R=AW/2+0.5,Ro=R+2,SP=AH-R,yb=c=>y0+Math.floor((c+0.5)*sl);
  const hIn=c=>Math.abs(c-cx)<R?SP+Math.sqrt(R*R-(c-cx)**2):-1,hOut=c=>Math.abs(c-cx)<Ro?SP+Math.sqrt(Ro*Ro-(c-cx)**2):-1;
  const st=lit?{a:'q',b:'h',j:'m',d:'k'}:{a:'Q',b:'H',j:'M',d:'k'};
  for(let c=-2;c<=AW+1;c++){const hi=Math.floor(hIn(c)),ho=Math.round(hOut(c));
    if(c>=0&&c<AW)for(let r=0;r<hi;r++){const top=r===hi-1;
      pixSet(g,x0+c,yb(c)-r,c===AW-1?(top?'k':st.b):top?'k':r===0?(c%3===1?'i':'e'):c%3===1?(r%2?'i':'I'):r%4===2?'i':'e')}
    const from=c>=0&&c<AW?hi:(c===-1||c===AW?0:Math.ceil(SP));
    for(let r=from;r<=ho;r++){const ang=Math.atan2(r-SP,c-cx),seg=Math.floor((ang+0.0001)/(Math.PI/7)),seg2=Math.floor((Math.atan2(r-SP,c+1-cx)+0.0001)/(Math.PI/7));
      const key=Math.abs(c-cx)<1&&r>=hi;pixSet(g,x0+c,yb(c)-r,r<SP?(r%4===3?st.j:st.a):key?st.a:seg!==seg2?st.j:r===ho?st.b:st.a)}
    if(ho>0)pixSet(g,x0+c,yb(c)-ho-1,st.j);}   // a dark joint outlines the ring against the ashlar
  for(const c of [-3,AW+2])for(let r=0;r<Math.ceil(SP);r++)pixSet(g,x0+c,yb(c)-r,st.j);
  for(let c=-1;c<=AW;c++)pixSet(g,x0+c,yb(c)+1,lit?'p':'P');
  const preFront=cloneG(g);front();const postFront=cloneG(g),frontParapet=(x,y)=>preFront[y][x]!==postFront[y][x];
  // ---- flanking towers at the two ends of the arch face. Their outer faces are flush with the block; the one inner face that
  // shows (beside the arch: the L tower's +x face in set x, the Rr tower's +y face in set y) is inside the block below the
  // wall-walk and behind the front parapet, so those cells are restored from what was there before.
  const under=cloneG(g),inner=[],TW=[];
  for(const [u0,v0,u1,v1,side] of [[0,1-TS,TS,1,0],[1-TS,1-TS,1,1,1]]){
    const t=box(u0,v0,u1,v1,TZ,{left:'4',right:'5',top:'6'});
    const innerCh=side?null:lit?'5':'4';
    if(innerCh){const [IA,IB]=innerCh==='4'?[t.base.L,t.base.Bm]:[t.base.Bm,t.base.Rr],isl=(IB[1]-IA[1])/(IB[0]-IA[0]);
      for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(g[y][x]===innerCh)inner.push([x,y,IA[1]+(x+0.5-IA[0])*isl-(y+0.5)])}
    ashlar(g,'4',t.base.L,t.base.Bm,LIT,{ch:5,bl:6,plinth:2,seed:6+side});ashlar(g,'5',t.base.Bm,t.base.Rr,SHD,{ch:5,bl:6,plinth:2,seed:8+side});
    flagstones(g,'6',t,{n:2});
    pixLine(g,t.base.Bm[0],t.base.Bm[1]-1,t.Bm[0],t.Bm[1]+1,'K');
    const SC=Z+4;   // string course just above the wall-walk
    pixLine(g,t.base.L[0],t.base.L[1]-SC,t.base.Bm[0],t.base.Bm[1]-SC,'q');pixLine(g,t.base.L[0],t.base.L[1]-SC+1,t.base.Bm[0],t.base.Bm[1]-SC+1,'m');
    pixLine(g,t.base.Bm[0],t.base.Bm[1]-SC,t.base.Rr[0],t.base.Rr[1]-SC,'Q');pixLine(g,t.base.Bm[0],t.base.Bm[1]-SC+1,t.base.Rr[0],t.base.Rr[1]-SC+1,'M');
    // crown: a corbelled band that oversails the shaft, then a low parapet with a merlon on each corner (back one first, front last)
    const CE=0.05,CW=TS+2*CE,CZ=6,cr=box(u0-CE,v0-CE,u1+CE,v1+CE,CZ,{left:'7',right:'8',top:'6'},TZ-CZ);
    flagstones(g,'6',cr,{n:2});
    pixLine(g,cr.base.L[0],cr.base.L[1]+1,cr.base.Bm[0],cr.base.Bm[1]+1,'k');pixLine(g,cr.base.Bm[0],cr.base.Bm[1]+1,cr.base.Rr[0],cr.base.Rr[1]+1,'k');
    for(const [a,b,c] of [[cr.base.L,cr.base.Bm,'m'],[cr.base.Bm,cr.base.Rr,'M']])for(let x=Math.ceil(a[0])+1;x<b[0]-1;x+=3){const y=Math.round(a[1]+(x+0.5-a[0])*(b[1]-a[1])/(b[0]-a[0]));pixSet(g,x,y+2,c)}
    const cap=crenels(g,cr,CW,CW,{th:0.14,n:[0,0],lo:3,hi:3,chs:{left:'7',right:'8',top:'h'}});
    const m=0.12,corner=(du,dv)=>{const u=du*(CW-m)+m,v=dv*(CW-m)+m;pixIsoBox(g,cr.T[0]+32*(u-v),cr.T[1]+16*(u+v),m,m,8,1,{left:'7',right:'8',top:'h'})};
    corner(0,0);corner(0,1);corner(1,0);cap();corner(1,1);
    ashlar(g,'7',cr.base.L,cr.base.Bm,LIT,{ch:4,bl:6,seed:6,qL:false,qR:false,any:true});ashlar(g,'8',cr.base.Bm,cr.base.Rr,SHD,{ch:4,bl:6,seed:7,qL:false,qR:false,any:true});
    TW.push(t);
  }
  for(const [x,y,z] of inner)if(z<Z||frontParapet(x,y))g[y][x]=under[y][x];
  for(const [x,y,z] of inner)if(z>=Z&&!frontParapet(x,y)&&inner.some(([x2,y2,z2])=>x2===x&&y2===y+1&&z2<Z)&&!frontParapet(x,y+1))g[y][x]=lit?'M':'P';   // seam where it rises out of the walk
  // joints: the wall segment behind (−x in set x, −y in set y) covers this edge up to its merlons, so no ink there
  const cover=pixGrid(GW,GH);pixIsoBox(cover,bx+(lit?-32:32),by-16,1,1,18+7,1,{left:'#',right:'#',top:'#'});
  inkOutline(g,null,(x,y)=>pixGet(cover,x,y)==='#');
  const frames=[];
  for(let k=0;k<4;k++){const f=cloneG(g);
    TW.forEach((t,i)=>{const [a,b]=lit?[t.base.L,t.base.Bm]:[t.base.Bm,t.base.Rr],p=lerpP(a,b,0.5);banner(f,Math.round(p[0])-3,Math.round(p[1])-TZ+10,6,16,k+i*2,{sl})});
    frames.push(pixText(f));}
  return frames;
}
const sets={x:gatehouse('x'),y:gatehouse('y')};
sets.idle=sets.x;
export default {
  id:'gate',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:FORT_PAL,
  frames:sets,
};
