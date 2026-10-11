// @pixel btower
// Bombard Tower 2×2: a tall square gun tower. A battered ashlar talus, a slim shaft with a string course, a pair of gun ports on
// each visible face (iron barrels run out along the face's normal), a corbelled gallery whose battlements leave a centred
// embrasure on each front face, a stone gun deck with a bombard on a timber bed run out through each embrasure (mirrored), and
// a slate-capped stair turret in the middle whose apex carries the code-drawn flag. One long team banner hangs centred on each face.
// Frames: idle 4 — the deck guns smoke, the banners ripple.
//@@KIT
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
export default {
  id:'btower',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:Object.assign({},FORT_PAL,{V:'#d8d4cc',X:'#aaa69e'}),
  frames:{idle:frames},
};
