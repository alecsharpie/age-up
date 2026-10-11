// @pixel tower
// Watch tower 1×1, one variant per age (AGE, AK = pixAgeKit(AGE) come from gen/ages/wrap.mjs):
//   Feudal   a shorter timber tower: plank shaft with X-braces on a rubble-stone footing, a timber hoarding with loopholes and
//            hung team shields, a brown oak shingle pyramid roof.
//   Castle   the square ashlar shaft (plinth, quoins, cross arrow slits, a studded door) under the timber hoarding, now capped by
//            red clay tiles with an iron collar at the apex. A team banner hangs down the lit face.
//   Imperial tallest: pale limestone with a gilt string course, a stone belfry on machicolations with arched gilt-sill windows,
//            corner pinnacles, a tall slate spire with gilt hip cresting and an orb finial; a gilt-fringed banner.
// The code-drawn flag stands on the apex (spec.flags follows it). Frames: idle 4 — the banner ripples, a watch-fire flickers.
//@@KIT
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
export default {
  id:'tower',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:Object.assign({},FORT_PAL,AK.pal,STONE),
  flags:[[0,Math.round(ap[1]-by)-(AGE===3?6:0),12]],
  frames:{idle:frames},
};
