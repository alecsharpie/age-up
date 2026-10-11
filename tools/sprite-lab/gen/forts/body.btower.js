// @pixel btower
// Bombard Tower 2×2: squat heavy ashlar block on a battered plinth, quoins, a corbelled parapet with merlons, a timber gun deck
// with an iron-banded bombard aimed over the battlements, a cannon port with its barrel on the shaded face, team banners on both faces.
// Frames: idle 4 — gun smoke curls from the port's muzzle, the slow-match brazier on the deck flickers, the banners ripple.
//@@KIT
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
