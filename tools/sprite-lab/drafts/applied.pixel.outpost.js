// @pixel outpost
// Outpost 1×1: a slim timber lookout — four posts, cross-bracing, a railed platform with a small roof, a ladder.
const W=1,H=1,PZ=36;
const GW=(W+H)*32+4, GH=(W+H)*16+PZ+18+10;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
const s=0.55;  // footprint of the post square, in tiles
const base={L:[bx-s*32,by-16+s*16-s*16],Bm:[bx,by-16+s*16],Rr:[bx+s*32,by-16+s*16-s*16],T:[bx,by-16+s*16-2*s*16]};
// posts (two visible front posts thick, two back posts thinner)
for(const [P,th] of [[base.T,1],[base.L,2],[base.Rr,2],[base.Bm,2]]){for(let k=0;k<th;k++)pixLine(g,P[0]+k,P[1],P[0]+k,P[1]-PZ,k?'y':'v')}
// cross bracing on the two front faces
pixLine(g,base.L[0],base.L[1]-6,base.Bm[0],base.Bm[1]-PZ+10,'x');pixLine(g,base.L[0],base.L[1]-PZ+10,base.Bm[0],base.Bm[1]-6,'x');
pixLine(g,base.Bm[0],base.Bm[1]-6,base.Rr[0],base.Rr[1]-PZ+10,'y');pixLine(g,base.Bm[0],base.Bm[1]-PZ+10,base.Rr[0],base.Rr[1]-6,'y');
// platform (a bit wider than the posts) with plank lines
const ps=0.8;const plat=pixIsoBox(g,bx,by-16+ps*16-PZ,ps,ps,4,1,{left:'w',right:'v',top:'c'});
pixLine(g,plat.T[0],plat.T[1]+3,plat.Rr[0]-4,plat.Rr[1]+1,'x');pixLine(g,plat.T[0],plat.T[1]+3,plat.L[0]+4,plat.L[1]+1,'x');pixLine(g,plat.L[0]+6,plat.L[1]+3,plat.Bm[0],plat.Bm[1]-3,'x');
// railing
for(const [P,Q] of [[plat.L,plat.Bm],[plat.Bm,plat.Rr]]){pixLine(g,P[0],P[1]-6,Q[0],Q[1]-6,'v');for(let k=0;k<=3;k++){const f=k/3;pixLine(g,P[0]+(Q[0]-P[0])*f,P[1]+(Q[1]-P[1])*f,P[0]+(Q[0]-P[0])*f,P[1]+(Q[1]-P[1])*f-6,'v')}}
// roof posts and a small thatch roof above the platform
const rz=12;for(const P of [plat.L,plat.Rr,plat.Bm])pixLine(g,P[0],P[1]-6,P[0],P[1]-rz,'v');
const roofTop={T:[plat.T[0],plat.T[1]-rz],Rr:[plat.Rr[0]+2,plat.Rr[1]-rz+1],Bm:[plat.Bm[0],plat.Bm[1]-rz+2],L:[plat.L[0]-2,plat.L[1]-rz+1]};
pixIsoRoof(g,roofTop,8,1,{left:'r',front:'s',right:'q',back:'r'});
// ladder up the left face
for(let k=0;k<PZ-4;k+=3){pixSet(g,base.L[0]+7+k*0.5,base.L[1]+3-k,'v');pixSet(g,base.L[0]+12+k*0.5,base.L[1]+5-k,'v');if(k%6===0)pixLine(g,base.L[0]+7+k*0.5,base.L[1]+3-k,base.L[0]+12+k*0.5,base.L[1]+5-k,'x')}
export default {
  id:'outpost',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:{w:'#8a6a3a',v:'#5a3a18',x:'#6f5229',y:'#4a2e12',c:'#a98a5e',r:'#b58a3c',s:'#c99a44',q:'#8f6a2c',T:'team'},
  frames:{idle:[pixText(g)]},
};
