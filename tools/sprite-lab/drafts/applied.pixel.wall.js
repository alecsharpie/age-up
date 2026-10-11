// @pixel wall
// Wall 1×1, one variant per age (AGE, AK from gen/ages/wrap.mjs). 16 variants by neighbour mask (bit0 wall at +x, bit1 +y,
// bit2 −x, bit3 −y): parapets, quoins and ink only where the segment is not joined, so a line of walls reads as one continuous
// wall and caps its ends. Sets p<mask> (1 frame, plain) and t<mask> (4 frames, with the age's team cloth and fire); the case
// body alternates them along the line. idle = t0 (a lone segment).
//   Dark     a low dyke of rough fieldstones under a turf cap, topped by a stockade of sharpened stakes on the centre line;
//            t: a team rag tied to the stakes and a team pennant on a tall pole.
//   Feudal   a plain grey rubble-stone wall with a plank walkway and a timber breastwork (boards between taller posts, no
//            crenels); t: a team cloth hung over the breastwork and a torch.
//   Castle   the dressed-stone curtain with a crenellated parapet (the original art, unchanged); t: shields and torches.
//   Imperial taller pale limestone, a gilt string course under taller merlons; t: gilt-fringed team banners and torches.
// Walls and gates of one player share an age; the gate draft (body.gate.js) knows these heights (WALL_TOP there).
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
const NB=[[32,16],[-32,16],[-32,-16],[32,-16]];   // screen offset of the neighbour for each mask bit
const {S:AS,W:AW,Au}=AK;
// ---------------------------------------------------------------- Castle (original) and Imperial: crenellated ashlar
// Imperial re-uses the castle segment with limestone tones (the stone chars re-coloured from AK.S), taller walls and merlons.
const LS=AS.map(c=>AK.pal[c]);
const LIME={h:LS[0],q:LS[0],f:LS[1],a:LS[1],A:LS[2],m:LS[4],p:LS[3],H:LS[2],Q:LS[2],n:LS[3],b:LS[3],B:'#9c8d6c',M:LS[5],P:LS[5],
  c:LS[1],C:'#d8cbac',j:LS[3],S:LS[3],g:'#f6dca0',G:'#fbe8b8'};
const STONE=/[hqfaAmpHQnbBMP]/;
function crenWall(Z,lo,hi,gilt){
  const GW=(W+H)*32+4, GH=(W+H)*16+Z+6+10;
  const bx=W*32+2, by=GH-4;
  function segment(mask){
    const g=pixGrid(GW,GH);
    const nI=mask&1,nJ=mask&2,pI=mask&4,pJ=mask&8;
    const top=pixIsoBox(g,bx,by,W,H,Z,1,{left:'1',right:'2',top:'3'});
    ashlar(g,'1',top.base.L,top.base.Bm,LIT,{ch:5,bl:8,plinth:2,seed:2,qL:!pI,qR:!nI});
    ashlar(g,'2',top.base.Bm,top.base.Rr,SHD,{ch:5,bl:8,plinth:2,seed:3,qL:!nJ,qR:!pJ});
    flagstones(g,'3',top,{n:4});
    if(!nI&&!nJ)pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,'K');
    if(gilt)   // a gilt string course with a dark undercut, under the wall-walk on both outer faces
      for(const [A,B,c1,c2] of [[top.base.L,top.base.Bm,Au[0],'m'],[top.base.Bm,top.base.Rr,Au[1],'M']])
        for(let x=Math.ceil(A[0]);x<=Math.floor(B[0]);x++){const y=Math.floor(A[1]+(x+0.5-A[0])*(B[1]-A[1])/(B[0]-A[0]))-Z+4;
          if(STONE.test(pixGet(g,x,y)))pixSet(g,x,y,c1);if(STONE.test(pixGet(g,x,y+1)))pixSet(g,x,y+1,c2)}
    const front=crenels(g,top,W,H,{th:0.12,n:[2,2],ml:0.25,f0:0.125,lo,hi,skip:{TL:pI,TR:pJ,LB:nJ,BR:nI},tex:{L:[top.base.L,top.base.Bm],R:[top.base.Bm,top.base.Rr],seed:2}});front();
    // joints: cells a neighbour behind would cover are not edges
    const cover=pixGrid(GW,GH);for(let b=2;b<4;b++)if(mask&(1<<b))pixIsoBox(cover,bx+NB[b][0],by+NB[b][1],W,H,Z+7,1,{left:'#',right:'#',top:'#'});
    inkOutline(g,null,(x,y)=>pixGet(cover,x,y)==='#');
    return {g,top,open:{L:!nJ,R:!nI}};
  }
  const sets={};
  for(let m=0;m<16;m++){
    const {g,top,open}=segment(m);
    sets['p'+m]=[pixText(g)];
    const fr=[];
    for(let k=0;k<4;k++){const f=cloneG(g);
      if(!gilt){
        if(open.L){const p=lerpP(top.base.L,top.base.Bm,0.32);shield(f,Math.round(p[0])-3,Math.round(p[1])-14);const q=lerpP(top.base.L,top.base.Bm,0.66);const tx=Math.round(q[0]),ty=Math.round(q[1])-8;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,k)}
        if(open.R){const p=lerpP(top.base.Bm,top.base.Rr,0.62);shield(f,Math.round(p[0])-2,Math.round(p[1])-14);const q=lerpP(top.base.Bm,top.base.Rr,0.3);const tx=Math.round(q[0]),ty=Math.round(q[1])-8;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,(k+2)%4)}
      }else{   // Imperial: a gilt-fringed banner hung from the string course, a torch in an iron bracket
        if(open.L){const p=lerpP(top.base.L,top.base.Bm,0.3);giltBanner(f,Math.round(p[0])-3,Math.round(p[1])-Z+5,6,12,k,0.5);const q=lerpP(top.base.L,top.base.Bm,0.68);const tx=Math.round(q[0]),ty=Math.round(q[1])-9;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,k)}
        if(open.R){const p=lerpP(top.base.Bm,top.base.Rr,0.62);giltBanner(f,Math.round(p[0])-2,Math.round(p[1])-Z+5,6,12,k+2,-0.5);const q=lerpP(top.base.Bm,top.base.Rr,0.3);const tx=Math.round(q[0]),ty=Math.round(q[1])-9;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,(k+2)%4)}
      }
      fr.push(pixText(f));}
    sets['t'+m]=fr;
  }
  sets.idle=sets.t0;
  return {anchor:[bx,by],palette:gilt?{...FORT_PAL,...AK.pal,...LIME}:{...FORT_PAL,...AK.pal},frames:sets};
}
/** Imperial banner: the kit banner with gilt hems down both sides and a gilt fringe along the foot. */
function giltBanner(g,x,y,w,h,ph,sl){
  banner(g,x,y,w,h,ph,{sl});
  const oy=c=>Math.floor((c+0.5)*sl);
  for(let c=0;c<w;c++){let last=-1;for(let r=1;r<=h+2;r++)if(/[TLD]/.test(pixGet(g,x+c,y+oy(c)+r)))last=r;
    if(last>0){pixSet(g,x+c,y+oy(c)+last,c%2?Au[1]:Au[0]);if(c===0||c===w-1)for(let r=2;r<last-1;r++)pixSet(g,x+c,y+oy(c)+r,c?Au[2]:Au[1])}}
  for(let c=-1;c<=w;c++)pixSet(g,x+c,y+oy(c),c<0?Au[2]:Au[1]);
}
// ---------------------------------------------------------------- Dark: fieldstone dyke and a stockade of stakes
// tile-local (u along +x, v along +y; T corner = 0,0) to screen, for a grid whose bottom corner is (bx,by)
const tileP=(bx,by,u,v)=>[bx+32*(u-v),by-32+16*(u+v)];
/** Rough fieldstones on a face (cells == tmp) over base edge A→B: rounded stones of uneven length in uneven courses, a lit crown
 *  on each stone, dark gaps between; tones from AK.S (lit face S0–S2, shaded S2–S4). */
function fieldstone(g,tmp,A,B,lit,seed){
  const sl=(B[1]-A[1])/(B[0]-A[0]),T=lit?[AS[0],AS[1],AS[2]]:[AS[2],AS[3],AS[4]],J=AS[5];
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){if(g[y][x]!==tmp)continue;
    const u=Math.floor(x+0.5-A[0]),h=Math.max(0,Math.floor(A[1]+(x+0.5-A[0])*sl-(y+0.5)));
    const c=h<4?0:h<7?1:2,c0=[0,4,7][c],ch=[4,3,4][c],r=h-c0;
    // stones along the course: lengths 3–7 from a hash chain so a run of segments lines up
    const off=Math.floor(hash3(c,seed,3)*5);let s=0,k=0,len=0;for(;;){len=3+Math.floor(hash3(k,c,seed)*5);if(u+off<s+len)break;s+=len;k++}
    const j=u+off-s;
    if(j===0||(r===ch-1&&(j===1||j===len-1))){g[y][x]=J;continue}          // gap and rounded shoulders
    if(r===ch-1&&c<2){g[y][x]=J;continue}
    const tone=Math.floor(hash3(k,c,seed+1)*3);
    g[y][x]=r===ch-2||(r===ch-3&&j===1&&lit)?T[Math.max(0,tone-1)]:T[tone];
  }
}
/** Turf on the dyke's top: dark earth with tufts of grass. */
function turf(g,tmp,seed){for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){if(g[y][x]!==tmp)continue;
  const t=hash3(x>>1,y>>1,seed);g[y][x]=t<0.22?'U':t<0.8?'V':t<0.95?'d':'l'}}
/** A sharpened stake at screen (x,y) foot, h tall, 3 px wide: lit / mid / dark columns, a pale cut point, a lashing row. */
function stake(g,x,y,h,lit,lash){
  const cols=lit?[AW[0],AW[0],AW[1]]:[AW[0],AW[1],AW[2]];
  for(let c=0;c<3;c++)for(let r=0;r<h-(c===1?0:c===0?1:2);r++)pixSet(g,x+c,y-r,r===lash?AW[2]:r>=h-3&&c<2?'E':cols[c]);
  pixSet(g,x+1,y-h+1,'E');
}
/** Stake positions of a segment: centre-line runs toward each joined side; a lone or one-ended segment runs straight through. */
function stakeRuns(mask){
  const nI=mask&1,nJ=mask&2,pI=mask&4,pJ=mask&8,X=nI||pI,Y=nJ||pJ,out=[];
  const run=(a0,a1,f)=>{for(let i=0;i<8;i++){const a=(i+0.5)/8;if(a>=a0&&a<=a1)out.push(f(a))}};
  if(X||!Y)run(pI?0:Y?0.5:0.1,nI?1:Y?0.5:0.9,a=>[a,0.5,'x']);
  if(Y)run(pJ?0:X?0.5:0.1,nJ?1:X?0.5:0.9,a=>[0.5,a,'y']);
  if(X&&Y)out.push([0.5,0.5,'c']);
  return out.sort((p,q)=>(p[0]+p[1])-(q[0]+q[1]));
}
function dark(){
  const Z=10,SH=13,GW=(W+H)*32+4,GH=(W+H)*16+Z+SH+24;
  const bx=W*32+2,by=GH-4,D0=0.27,D1=0.73,E=0.06;   // the dyke runs down the middle of the tile, half a tile wide
  const drawStakes=(g,ox,oy,runs)=>{for(const [u,v,ax] of runs){const p=tileP(bx+ox,by+oy,u,v),hh=SH+Math.floor(hash3(Math.round(u*16),Math.round(v*16),4)*3);
    stake(g,Math.round(p[0])-1,Math.round(p[1])-Z+1,hh,ax!=='y',5)}};
  /** the dyke as boxes [u0,v0,u1,v1], back to front: a centre block and an arm toward each joined side (or the ends of a lone run) */
  const pieces=mask=>{const nI=mask&1,nJ=mask&2,pI=mask&4,pJ=mask&8,X=nI||pI,Y=nJ||pJ,out=[[D0,D0,D1,D1]];
    if(pI||(!X&&!Y)||(nI&&!Y))out.push([pI?0:E,D0,D0,D1]);if(pJ||(nJ&&!X))out.push([D0,pJ?0:E,D1,D0]);
    if(nI||(!X&&!Y)||(pI&&!Y))out.push([D1,D0,nI?1:1-E,D1]);if(nJ||(pJ&&!X))out.push([D0,D1,D1,nJ?1:1-E]);
    return out.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]))};
  const dyke=(g,ox,oy,mask,ch)=>pieces(mask).map(([u0,v0,u1,v1])=>{const B=tileP(bx+ox,by+oy,u1,v1);return pixIsoBox(g,B[0],B[1],u1-u0,v1-v0,Z,1,ch)});
  function segment(mask){
    const g=pixGrid(GW,GH);
    const nI=mask&1,nJ=mask&2;
    const tops=dyke(g,0,0,mask,{left:'1',right:'2',top:'3'});
    // fieldstone faces: every lit face lies on the plane v=D1, every shaded face on u=D1, so texture them in one pass each
    fieldstone(g,'1',tileP(bx,by,0,D1),tileP(bx,by,1,D1),true,2);fieldstone(g,'2',tileP(bx,by,D1,1),tileP(bx,by,D1,0),false,3);
    turf(g,'3',5);
    // the turf cap spills a ragged lip over the top course of the open faces
    for(let y=1;y<GH;y++)for(let x=0;x<GW;x++){const c=g[y][x];if(c!==AS[0]&&c!==AS[1]&&c!==AS[2]&&c!==AS[3]&&c!==AS[4]&&c!==AS[5])continue;
      const up=g[y-1][x];if(/[UVdl]/.test(up)&&hash3(x,y,9)<0.55)g[y][x]=hash3(x,2,9)<0.5?'V':'d'}
    const runs=stakeRuns(mask);
    // the stakes' shadow falls back-right onto the turf
    for(const [u,v] of runs){const p=tileP(bx,by,u,v);for(let d=1;d<=3;d++){const x=Math.round(p[0])+1+d,y=Math.round(p[1])-Z;if(/[UVdl]/.test(pixGet(g,x,y)))pixSet(g,x,y,'l');if(d<3&&/[UVdl]/.test(pixGet(g,x,y-1)))pixSet(g,x,y-1,'d')}}
    drawStakes(g,0,0,runs);
    // joints: the neighbour behind covers this edge (its dyke and its stakes)
    const cover=pixGrid(GW,GH);
    for(let b=2;b<4;b++)if(mask&(1<<b)){const nm=b===2?5:10;dyke(cover,NB[b][0],NB[b][1],nm,{left:'#',right:'#',top:'#'});drawStakes(cover,NB[b][0],NB[b][1],stakeRuns(nm))}
    inkOutline(g,null,(x,y)=>pixGet(cover,x,y)!=='.');
    return {g,runs,open:{L:!nJ,R:!nI}};
  }
  const sets={};
  for(let m=0;m<16;m++){
    const {g,runs,open}=segment(m);
    sets['p'+m]=[pixText(g)];
    const fr=[];
    // the pennant pole stands at the middle stake; a rag is tied across the stakes on an open face
    const mid=runs[Math.floor(runs.length/2)],mp=tileP(bx,by,mid[0],mid[1]);
    for(let k=0;k<4;k++){const f=cloneG(g);
      if(open.L||open.R){const lit=open.L&&runs.some(r=>r[2]==='x'),ax=lit?'x':'y';const st=runs.filter(r=>r[2]===ax);
        if(st.length>=3){const s=st[Math.max(0,Math.floor(st.length/2)-2)],p=tileP(bx,by,s[0],s[1]);rag(f,Math.round(p[0])-1,Math.round(p[1])-Z-8,lit?0.5:-0.5,k)}}
      const px=Math.round(mp[0])+1,py=Math.round(mp[1])-Z-2;
      flagpole(f,px,py,SH+11,k,{w:8,fh:5});pixSet(f,px,py-SH-11,AW[0]);pixSet(f,px,py-SH-12,'k');
      fr.push(pixText(f));}
    sets['t'+m]=fr;
  }
  sets.idle=sets.t0;
  return {anchor:[bx,by],palette:{...FORT_PAL,...AK.pal,U:'#7a9a44',V:'#5c7a30',d:'#4a5e26',l:'#3e3a24',E:'#d9b98a'},frames:sets};
}
/** A team rag knotted across the stakes on a face of slope sl: 7 wide, ragged foot that sways with frame k. */
function rag(g,x,y,sl,k){
  for(let c=0;c<7;c++){const oy=Math.floor((c+0.5)*sl),len=4+((c*3+k)%3===0?1:0)+(c===3?1:0);
    for(let r=0;r<len;r++)pixSet(g,x+c,y+oy+r,r===0?AW[2]:r===len-1||c===6?'D':c===0?'L':(c+r+k)%5===0?'D':'T')}
}
// ---------------------------------------------------------------- Feudal: rubble wall with a timber breastwork
function feudal(){
  const Z=15,BH=5,PH=8,GW=(W+H)*32+4,GH=(W+H)*16+Z+PH+14;
  const bx=W*32+2,by=GH-4;
  const LIT1={m:AS[5],h:AS[0],t:[AS[1],AS[2],AS[1]],q:AS[0],p:AS[2]},SHD1={m:AS[5],h:AS[2],t:[AS[3],AS[4],AS[3]],q:AS[2],p:AS[4]};
  /** a timber breastwork along one edge of the top (edges as in the kit's parapet): boards '7'/'8', posts '5'/'6' standing taller. */
  function breast(g,top,edge,th){
    const base=edge==='LB'||edge==='BR'?top.Bm:edge==='TL'?[top.L[0]+32*th,top.L[1]+16*th]:[top.Rr[0]-32*th,top.Rr[1]+16*th];
    const box=(f,len,z,ch)=>{if(edge==='LB'||edge==='TR'){const B=[base[0]-f*32,base[1]-f*16];return pixIsoBox(g,B[0],B[1],len,th,z,1,ch)}
      const B=[base[0]+f*32,base[1]-f*16];return pixIsoBox(g,B[0],B[1],th,len,z,1,ch)};
    box(0,1,BH,{left:'7',right:'8',top:'9'});
    for(const f of [0.03,0.53])box(f,0.07,PH,{left:'5',right:'6',top:'9'});
  }
  function segment(mask){
    const g=pixGrid(GW,GH);
    const nI=mask&1,nJ=mask&2,pI=mask&4,pJ=mask&8;
    const top=pixIsoBox(g,bx,by,W,H,Z,1,{left:'1',right:'2',top:'3'});
    ashlar(g,'1',top.base.L,top.base.Bm,LIT1,{ch:4,bl:6,plinth:3,seed:4,qL:!pI,qR:!nI});
    ashlar(g,'2',top.base.Bm,top.base.Rr,SHD1,{ch:4,bl:6,plinth:3,seed:5,qL:!nJ,qR:!pJ});
    flagstones(g,'3',top,{n:3,t1:AS[1],t2:AS[2],j:AS[3],seed:7});
    if(!nI&&!nJ)pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,AS[5]);
    const th=0.1;
    if(!pI)breast(g,top,'TL',th);if(!pJ)breast(g,top,'TR',th);
    if(!nJ)breast(g,top,'LB',th);if(!nI)breast(g,top,'BR',th);
    // boards: vertical planks with a dark seam every 3 px; posts darker; the breastwork's top shows the board ends
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const c=g[y][x];
      if(c==='7')g[y][x]=x%3===0?AW[2]:x%3===1?'w':'v';
      else if(c==='8')g[y][x]=x%3===0?'y':x%3===1?'v':AW[1];
      else if(c==='5')g[y][x]=AW[1];else if(c==='6')g[y][x]=AW[2];else if(c==='9')g[y][x]='E'}
    const cover=pixGrid(GW,GH);for(let b=2;b<4;b++)if(mask&(1<<b))pixIsoBox(cover,bx+NB[b][0],by+NB[b][1],W,H,Z+PH,1,{left:'#',right:'#',top:'#'});
    inkOutline(g,null,(x,y)=>pixGet(cover,x,y)==='#');
    return {g,top,open:{L:!nJ,R:!nI}};
  }
  const sets={};
  for(let m=0;m<16;m++){
    const {g,top,open}=segment(m);
    sets['p'+m]=[pixText(g)];
    const fr=[];
    for(let k=0;k<4;k++){const f=cloneG(g);
      if(open.L){const p=lerpP(top.base.L,top.base.Bm,0.3);banner(f,Math.round(p[0])-3,Math.round(p[1])-Z-BH+2,6,9,k,{sl:0.5,charge:false});const q=lerpP(top.base.L,top.base.Bm,0.7);const tx=Math.round(q[0]),ty=Math.round(q[1])-7;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,k)}
      if(open.R){const p=lerpP(top.base.Bm,top.base.Rr,0.62);banner(f,Math.round(p[0])-2,Math.round(p[1])-Z-BH+2,6,9,k+2,{sl:-0.5,charge:false});const q=lerpP(top.base.Bm,top.base.Rr,0.3);const tx=Math.round(q[0]),ty=Math.round(q[1])-7;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,(k+2)%4)}
      fr.push(pixText(f));}
    sets['t'+m]=fr;
  }
  sets.idle=sets.t0;
  return {anchor:[bx,by],palette:{...FORT_PAL,...AK.pal,E:'#c09a62'},frames:sets};
}
const V=AGE===0?dark():AGE===1?feudal():AGE===2?crenWall(18,3,7,false):crenWall(22,3,9,true);
return {
  id:'wall',kind:'building',footprint:[W,H],anchor:V.anchor,
  palette:V.palette,
  frames:V.frames,
};
};
export default pixAged(make, 0);
