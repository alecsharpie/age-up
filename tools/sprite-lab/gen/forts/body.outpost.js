// @pixel outpost
// Outpost 1×1: a slim timber lookout — four log posts on stone pads, X-bracing, a ladder, a plank platform behind a boarded parapet
// with team shields hung on it, a thatched roof on posts, a brazier on the deck, a torch and a banner below.
// Frames: idle 4 — a torch on the front post flickers and lights the post; a team banner under the deck ripples.
//@@KIT
const W=1,H=1,PZ=36;
const GW=(W+H)*32+4, GH=(W+H)*16+PZ+18+10;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
const s=0.55, cy0=by-16;  // post square, tile centre
const base={L:[bx-s*32,cy0],Bm:[bx,cy0+s*16],Rr:[bx+s*32,cy0],T:[bx,cy0-s*16]};
// ground: trodden earth and stone pads under the posts
for(const P of [base.L,base.Rr,base.Bm])pixStamp(g,Math.round(P[0])-2,Math.round(P[1])-1,`
.hhh.
pappP
.PPP.
`);
// platform deck (wider than the posts)
const ps=0.8;const plat=pixIsoBox(g,bx,cy0+ps*16-PZ,ps,ps,3,1,{left:'1',right:'2',top:'3'});
planks(g,'1',plat.base.L,plat.base.Bm,{m:'v',s:'v',g:'x',r:'x'},{bw:5});planks(g,'2',plat.base.Bm,plat.base.Rr,{m:'x',s:'x',g:'y',r:'y'},{bw:5});
for(let y=0;y<g.length;y++)for(let x=0;x<GW;x++)if(g[y][x]==='3')g[y][x]=((x+2*y)>>2)%2?'w':'v';
// joists poking out under the deck
for(const f of [0.2,0.5,0.8]){const p=lerpP(plat.base.L,plat.base.Bm,f);pixSet(g,p[0],p[1]+1,'y');pixSet(g,p[0]-1,p[1]+1,'v');const q=lerpP(plat.base.Bm,plat.base.Rr,f);pixSet(g,q[0],q[1]+1,'y')}
// roof posts (back first), then the brazier spot, then the boarded parapet on the front edges
const rz=13;pixLine(g,plat.T[0],plat.T[1]-1,plat.T[0],plat.T[1]-rz,'y');
for(const P of [plat.L,plat.Rr])pixLine(g,P[0]+(P===plat.L?1:-1),P[1]-1,P[0]+(P===plat.L?1:-1),P[1]-rz,'x');
const BRZ=(()=>{const p=lerpP(plat.L,plat.Bm,0.62);return [Math.round(p[0])+1,Math.round(p[1])-4]})();   // brazier on the deck, just inside the front parapet   // brazier on the deck centre
pixStamp(g,BRZ[0]-3,BRZ[1]-3,`
JiIIiJ
.JiiJ.
..JJ..
`);
const par=pixIsoBox(g,plat.Bm[0],plat.Bm[1],ps,0.08,6,1,{left:'4',right:'5',top:'v'});
const par2=pixIsoBox(g,plat.Bm[0],plat.Bm[1],0.08,ps,6,1,{left:'4',right:'5',top:'v'});
planks(g,'4',plat.L,plat.Bm,{l:'w',m:'v',s:'w',g:'x',r:'x'},{bw:3,rails:[5]});planks(g,'5',plat.Bm,plat.Rr,{m:'x',s:'v',g:'y',r:'y'},{bw:3,rails:[5]});
pixLine(g,plat.Bm[0],plat.Bm[1]-1,plat.Bm[0],plat.Bm[1]-7,'w');pixLine(g,plat.Bm[0]+1,plat.Bm[1]-1,plat.Bm[0]+1,plat.Bm[1]-7,'x'); // front roof post
pixLine(g,plat.Bm[0],plat.Bm[1]-7,plat.Bm[0],plat.Bm[1]-rz,'w');pixLine(g,plat.Bm[0]+1,plat.Bm[1]-7,plat.Bm[0]+1,plat.Bm[1]-rz,'x');
{const p=lerpP(plat.L,plat.Bm,0.45);shield(g,Math.round(p[0])-3,Math.round(p[1])-7);const q=lerpP(plat.Bm,plat.Rr,0.55);shield(g,Math.round(q[0])-2,Math.round(q[1])-7)}
// shingled roof
const roofTop={T:[plat.T[0],plat.T[1]-rz],Rr:[plat.Rr[0]+2,plat.Rr[1]-rz+1],Bm:[plat.Bm[0],plat.Bm[1]-rz+2],L:[plat.L[0]-2,plat.L[1]-rz+1]};
const ap=pixIsoRoof(g,roofTop,11,1,{left:'6',back:'7',front:'8',right:'9'});
// thatch: strands running down the slope, a darker eave fringe
const thatch=(tmp,tn)=>{for(let y=0;y<g.length;y++)for(let x=0;x<GW;x++){if(g[y][x]!==tmp)continue;const r=hash3(x,Math.floor((y+(x*7)%4)/4),11);g[y][x]=r<0.18?tn[0]:r<0.75?tn[1]:tn[2]}};
thatch('6',['d','E','E']);thatch('7',['E','l','N']);thatch('8',['d','E','l']);thatch('9',['l','N','U']);
for(const [A,B,c] of [[roofTop.L,roofTop.Bm,'N'],[roofTop.Bm,roofTop.Rr,'U']]){pixLine(g,A[0],A[1]-1,B[0],B[1]-1,c)}
pixLine(g,roofTop.Bm[0],roofTop.Bm[1],ap[0],ap[1],'N');pixLine(g,roofTop.L[0],roofTop.L[1],ap[0],ap[1],'d');pixLine(g,roofTop.L[0],roofTop.L[1],roofTop.Bm[0],roofTop.Bm[1],'k');pixLine(g,roofTop.Bm[0],roofTop.Bm[1],roofTop.Rr[0],roofTop.Rr[1],'k');
inkOutline(g);
// legs drawn after the outline: 3-tone logs with their own ink edge (thin members would turn solid ink)
// The posts stand inside the deck's footprint, so the deck is in front of their tops: everything drawn below is clipped to the
// deck's bottom edge (cells above it are restored from underLegs), so the posts end under the deck instead of poking up through
// the deck and the roof eave.
const underLegs=cloneG(g);
const deckBottom=x=>x<=bx?plat.base.L[1]+(x-plat.base.L[0])*0.5:plat.base.Bm[1]-(x-bx)*0.5;
// posts: back post thin, front posts two-tone logs
const post=(P,th)=>{const C=th===1?['x']:['k','w','v','y'];for(let k=0;k<C.length;k++)pixLine(g,P[0]+k-1,P[1]-1,P[0]+k-1,P[1]-PZ,C[k])};
post(base.T,1);
// cross bracing on the two front faces (behind the front posts)
const brace=(A,B,c1,c2)=>{pixLine(g,A[0]+1,A[1]-6,B[0]-1,B[1]-PZ+8,c1);pixLine(g,A[0]+1,A[1]-PZ+8,B[0]-1,B[1]-6,c1);pixLine(g,A[0]+1,A[1]-5,B[0]-1,B[1]-PZ+9,c2);pixLine(g,A[0]+1,A[1]-PZ+9,B[0]-1,B[1]-5,c2)};
brace(base.L,base.Bm,'v','y');brace(base.Bm,base.Rr,'x','y');
pixLine(g,base.L[0],base.L[1]-18,base.Bm[0],base.Bm[1]-18,'x');pixLine(g,base.Bm[0],base.Bm[1]-18,base.Rr[0],base.Rr[1]-18,'y'); // mid ledger
post(base.L,2);post(base.Rr,2);post(base.Bm,2);
for(const P of [base.L,base.Rr,base.Bm])for(let y=6;y<PZ-4;y+=7){pixSet(g,P[0],P[1]-y,'x');pixSet(g,P[0]+1,P[1]-y,'k')}  // bark rings
// ladder up the lit face: two rails, rungs every 4 px
for(let k=0;k<PZ-3;k++){const y=base.L[1]+3-k,x0=Math.round(base.L[0]+9+k*0.1);pixSet(g,x0,y,'x');pixSet(g,x0+5,y+2,'y');if(k%4===2){pixLine(g,x0+1,y,x0+4,y+2,'w');pixLine(g,x0+1,y+1,x0+4,y+3,'y')}}
for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(y+0.5<deckBottom(x+0.5))g[y][x]=underLegs[y][x];

// idle: a torch on the front post flickers (warm light on the post), a team banner hung under the deck ripples
const frames=[];
for(let k=0;k<4;k++){const f=cloneG(g);
  const q=lerpP(plat.base.Bm,plat.base.Rr,0.22);banner(f,Math.round(q[0]),Math.round(q[1])+2,6,11,k,{sl:-0.5});
  const tx=base.Bm[0]-2,ty=base.Bm[1]-17;torch(f,tx,ty,k);
  for(const [dx,dy] of [[2,-3],[2,-5],[3,-4],[2,1]])if(/[wvk]/.test(pixGet(f,tx+dx,ty+dy)))pixSet(f,tx+dx,ty+dy,(k+dy)%2?'G':'g');
  frames.push(pixText(f));}
export default {
  id:'outpost',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:Object.assign({},FORT_PAL,{d:'#e6c272',E:'#d8ab4f',l:'#c99a44',N:'#a07a34',U:'#6f5229'}),
  frames:{idle:frames},
};
