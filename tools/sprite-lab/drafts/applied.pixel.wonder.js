// @pixel wonder
// Wonder 5×5: a gothic cathedral — stepped plinth, long nave with a gabled slate roof, transept, buttresses with tall windows between,
// a rose window on the end wall, and a square tower with a steep spire capped in gold. 2 frames: the gold tip glints.
const W=5,H=5;
const GW=(W+H)*32+4, GH=(W+H)*16+6+74+58+12;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
const blockBm=(i,j,w,h)=>[bx+(i-j+(w-h))*32, by-(W+H)*16+(i+j+w+h)*16];
const lerp=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
function courses(g,A,B,z,step,ch){const n=Math.floor((z-1)/step);for(let k=1;k<=n;k++){pixLine(g,A[0],A[1]-k*step,B[0],B[1]-k*step,ch)}}
// gable roof over a box top: ridge runs along the long (w) axis
function gable(g,top,rise,ch){const m1=lerp(top.T,top.L,0.5),m2=lerp(top.Rr,top.Bm,0.5);const r1=[m1[0],m1[1]-rise],r2=[m2[0],m2[1]-rise];pixPoly(g,[top.T,top.Rr,r2,r1],ch.back);pixPoly(g,[top.L,top.Bm,r2,r1],ch.front);pixLine(g,r1[0],r1[1],r2[0],r2[1],ch.ridge);for(let k=1;k<6;k++){const t=k/6;const a=lerp(top.L,top.Bm,t),b2=lerp(r1,r2,t);pixLine(g,a[0],a[1],b2[0],b2[1],ch.seam)}return {r1,r2,m1,m2}}
// plinth: two steps
pixIsoBox(g,bx,by,W,H,4,1,{left:'p',right:'q',top:'r'});
const s2=blockBm(0.3,0.3,4.4,4.4);pixIsoBox(g,s2[0],s2[1]-4,4.4,4.4,4,1,{left:'p',right:'q',top:'r'});
const PL=8;
// nave (long along x) and transept (long along y) as walls
const nB=blockBm(0.5,1.55,4,1.9);const nave=pixIsoBox(g,nB[0],nB[1]-PL,4,1.9,38,1,{left:'p',right:'q'});
courses(g,nave.base.L,nave.base.Bm,38,7,'s');courses(g,nave.base.Bm,nave.base.Rr,38,7,'s');
const tB=blockBm(2.0,0.6,1.5,3.8);const tr=pixIsoBox(g,tB[0],tB[1]-PL,1.5,3.8,34,1,{left:'p',right:'q'});
courses(g,tr.base.L,tr.base.Bm,34,7,'s');courses(g,tr.base.Bm,tr.base.Rr,34,7,'s');
// tall lancet windows on the nave's lit face between buttresses; buttresses as thin piers
for(let k=0;k<7;k++){const t=(k+0.5)/7;const a=lerp(nave.base.L,nave.base.Bm,t);pixRect(g,a[0]-1,a[1]-30,1,16,'e');pixRect(g,a[0],a[1]-32,1,19,'e');pixRect(g,a[0]+1,a[1]-30,1,16,'e');pixSet(g,a[0],a[1]-22,'n');pixSet(g,a[0],a[1]-18,'n');}
for(let k=0;k<=7;k++){const t=k/7;const a=lerp(nave.base.L,nave.base.Bm,t);pixIsoBox(g,a[0]-2,a[1]+1,0.14,0.14,30,1,{left:'r',right:'q'});}
// windows on the transept's shaded face
for(let k=0;k<4;k++){const t=(k+0.5)/4;const a=lerp(tr.base.Bm,tr.base.Rr,t);pixRect(g,a[0],a[1]-28,1,15,'e');pixSet(g,a[0],a[1]-20,'n')}
// rose window on the nave's end (shaded) face
{const c=lerp(nave.base.Bm,nave.base.Rr,0.5);const cx=Math.round(c[0]),cy=Math.round(c[1]-24);for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++){const d=Math.hypot(x,y);if(d<=6.3){pixSet(g,cx+x,cy+y,d>5.2?'s':(x===0||y===0||Math.abs(x)===Math.abs(y))?'G':'n')}}pixSet(g,cx,cy,'G')}
// doors at the base of the transept (lit face)
pixStamp(g,tr.base.L[0]+Math.round((tr.base.Bm[0]-tr.base.L[0])*0.5)-3,tr.base.L[1]+Math.round((tr.base.Bm[1]-tr.base.L[1])*0.5)-12,`
..ee..
.eeee.
eeeeee
evvvve
evvvve
evvvve
evvvve
evvvve
evvvve
`);
// roofs
const nroof=gable(g,nave,22,{back:'U',front:'u',ridge:'f',seam:'U'});
{// the transept roof: ridge along its long axis (y), so build it by hand
 const m1=lerp(tr.T,tr.Rr,0.5),m2=lerp(tr.L,tr.Bm,0.5);const r1=[m1[0],m1[1]-18],r2=[m2[0],m2[1]-18];pixPoly(g,[tr.T,tr.L,r2,r1],'u');pixPoly(g,[tr.Rr,tr.Bm,r2,r1],'U');pixLine(g,r1[0],r1[1],r2[0],r2[1],'f');}
// tower at the crossing with a steep spire
const kB=blockBm(2.35,1.9,1.1,1.1);const tow=pixIsoBox(g,kB[0],kB[1]-PL,1.1,1.1,74,1,{left:'p',right:'q'});
courses(g,tow.base.L,tow.base.Bm,74,7,'s');courses(g,tow.base.Bm,tow.base.Rr,74,7,'s');
for(const f of [0.3,0.7]){const a=lerp(tow.base.L,tow.base.Bm,f);pixRect(g,a[0],a[1]-62,1,10,'e');pixRect(g,a[0],a[1]-44,1,8,'e');const b2=lerp(tow.base.Bm,tow.base.Rr,f);pixRect(g,b2[0],b2[1]-62,1,10,'e')}
// little pinnacles at the tower corners, then the spire
for(const P of [tow.L,tow.Bm,tow.Rr,tow.T])pixRect(g,P[0],P[1]-6,1,6,'r');
const apex=pixIsoRoof(g,tow,58,1,{left:'u',front:'u',right:'U',back:'U'});
pixLine(g,tow.L[0],tow.L[1],apex[0],apex[1],'f');pixLine(g,tow.Bm[0],tow.Bm[1],apex[0],apex[1],'f');pixLine(g,tow.Rr[0],tow.Rr[1],apex[0],apex[1],'U');
const base=pixText(g);
// gold tip, two frames (plain / glint)
const f0=g.map(r=>r.slice()),f1=g.map(r=>r.slice());
for(const f of [f0,f1]){pixRect(f,apex[0],apex[1]-1,1,5,'G');pixRect(f,apex[0]-1,apex[1]+1,3,1,'G');pixSet(f,apex[0],apex[1]-2,'g')}
pixSet(f1,apex[0]-2,apex[1]-2,'y');pixSet(f1,apex[0]+2,apex[1]-2,'y');pixSet(f1,apex[0],apex[1]-4,'y');
export default {
  id:'wonder',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:{p:'#efe8d8',q:'#cfc6b4',r:'#f4efe3',s:'#b9b0a0',e:'#2a2018',n:'#4a6a8a',u:'#5a6470',U:'#424a55',f:'#8893a0',v:'#5a3a18',G:'#d9b13a',g:'#f0d070',y:'#fff6c8',T:'team'},
  frames:{idle:[pixText(f0),pixText(f1)]},
};
