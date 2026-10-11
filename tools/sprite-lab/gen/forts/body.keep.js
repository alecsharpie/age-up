// @pixel keep
// Castle 4×4: a battered plinth and ashlar curtain wall (quoins, cross slits, crenellations that shade the wall-walk), four corner
// towers with corbel tables, a tall central donjon ringed by machicolations, a voussoir gate with portcullis and the lord's
// shield above it, centred on the lit face, and a matched pair of long team banners on each donjon face. Merlons sit on a
// symmetric rhythm on every parapet; four painted team flags fly from the donjon's corners (no code-drawn flags).
// Frames: idle 4 — the banners ripple, the flags stream, the gate torches flicker and light the jambs.
// Age variants (AGE, AK from gen/ages/wrap.mjs; the keep stands from Castle):
//   Castle   the original art, unchanged.
//   Imperial pale limestone (the stone chars re-coloured from AK.S), a taller donjon with a steep slate hip spire rising inside
//            its parapet, slate spires with gilt orb finials on the four corner towers in place of their merlons, gilt string
//            courses on the curtain and donjon, a gilt keystone, gilt-fringed banners.
//@@KIT
const IMP=AGE>=3;
const {S:AS,R:AR,Au}=AK;
const LS=AS.map(c=>AK.pal[c]);
const LIME={h:LS[0],q:LS[0],f:LS[1],a:LS[1],A:LS[2],m:LS[4],p:LS[3],H:LS[2],Q:LS[2],n:LS[3],b:LS[3],B:'#9c8d6c',M:LS[5],P:LS[5],
  c:LS[1],C:'#d8cbac',j:LS[3],S:LS[3],g:'#f6dca0',G:'#fbe8b8'};
const STONE=/[hqfaAmpHQnbBMP]/;
/** A hip / pyramid roof on a top face (pixIsoBox result), apex `rise` px up, in the age's roof material; returns the apex. */
function hipRoof(g,top,rise){
  const ap=pixIsoRoof(g,top,rise,1,{back:'!',left:'@',front:'$',right:'%'});
  const y0=Math.max(0,Math.floor(ap[1])),y1=Math.min(g.length-1,Math.ceil(top.Bm[1])+1),x0=Math.max(0,Math.floor(top.L[0])-1),x1=Math.min(g[0].length-1,Math.ceil(top.Rr[0])+1);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const c=g[y][x];
    if(c==='$')g[y][x]=AK.roofXY(x,y,0.5,0);else if(c==='%')g[y][x]=AK.roofXY(x,y,-0.5,1);
    else if(c==='@')g[y][x]=AK.roofXY(x,y,-0.5,2,{flip:true});else if(c==='!')g[y][x]=AK.roofXY(x,y,0.5,3,{flip:true})}
  pixLine(g,ap[0],ap[1],top.Bm[0],top.Bm[1],AR[0]);
  pixLine(g,top.L[0],top.L[1],top.Bm[0],top.Bm[1],AR[5]);pixLine(g,top.Bm[0],top.Bm[1],top.Rr[0],top.Rr[1],AR[6]);
  return ap;
}
/** Imperial banner: the kit banner with gilt hems down both sides and a gilt fringe along the foot. */
function giltBanner(g,x,y,w,h,ph,sl){
  banner(g,x,y,w,h,ph,{sl});
  const oy=c=>Math.floor((c+0.5)*sl);
  for(let c=0;c<w;c++){let last=-1;for(let r=1;r<=h+2;r++)if(/[TLD]/.test(pixGet(g,x+c,y+oy(c)+r)))last=r;
    if(last>0){pixSet(g,x+c,y+oy(c)+last,c%2?Au[1]:Au[0]);if(c===0||c===w-1)for(let r=2;r<last-1;r++)pixSet(g,x+c,y+oy(c)+r,c?Au[2]:Au[1])}}
  for(let c=-1;c<=w;c++)pixSet(g,x+c,y+oy(c),c<0?Au[2]:Au[1]);
}
/** A gilt string course with a dark undercut, dz px below the top of the face over base edge A→B (face height z). */
function giltCourse(g,A,B,z,dz,lit){for(let x=Math.ceil(A[0]);x<=Math.floor(B[0]);x++){const y=Math.floor(A[1]+(x+0.5-A[0])*(B[1]-A[1])/(B[0]-A[0]))-z+dz;
  if(STONE.test(pixGet(g,x,y)))pixSet(g,x,y,lit?Au[0]:Au[1]);if(STONE.test(pixGet(g,x,y+1)))pixSet(g,x,y+1,lit?'m':'M')}}
const W=4,H=4,Z=36,TZ=26,DZ=IMP?50:36,HEAD=IMP?44:0;
const GW=(W+H)*32+4, GH=(W+H)*16+Z+TZ+DZ+6+10+HEAD;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
const blockBm=(i,j,w,h)=>[bx+(i-j+(w-h))*32, by-(W+H)*16+(i+j+w+h)*16];
const faces=(t,o1,o2)=>{ashlar(g,'1',t.base.L,t.base.Bm,LIT,o1);ashlar(g,'2',t.base.Bm,t.base.Rr,SHD,o2)};
const TEX=t=>({L:[t.base.L,t.base.Bm],R:[t.base.Bm,t.base.Rr],ch:6,bl:12,seed:5});
// ---- plinth and curtain wall
const pb=pixIsoBox(g,bx,by,W+0.04,H+0.04,8,1,{left:'1',right:'2'});faces(pb,{ch:8,bl:14,plinth:8,seed:1},{ch:8,bl:14,plinth:8,seed:1});
const top=pixIsoBox(g,bx,by-1,W,H,Z-1,1,{left:'1',right:'2',top:'3'});
faces(top,{ch:6,bl:12,seed:5},{ch:6,bl:12,seed:6});
flagstones(g,'3',top,{n:4});
pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,'K');
const front=crenels(g,top,W,H,{th:0.05,n:[8,8],ml:0.0625,f0:0.25,lo:3,hi:7,tex:TEX(top)});
// ---- corner towers and donjon, back to front
const tower=(i,j)=>{const B=blockBm(i,j,1,1);const t=pixIsoBox(g,B[0],B[1]-Z,1,1,TZ,1,{left:'1',right:'2',top:'3'});
  faces(t,{ch:6,bl:10,seed:7+i},{ch:6,bl:10,seed:9+j});flagstones(g,'3',t,{n:3});pixLine(g,t.base.Bm[0],t.base.Bm[1]-1,t.Bm[0],t.Bm[1]+1,'K');
  machi(g,t.L,t.Bm,1,true);machi(g,t.Bm,t.Rr,1,false);
  if(IMP){giltCourse(g,t.base.L,t.base.Bm,TZ,6,true);giltCourse(g,t.base.Bm,t.base.Rr,TZ,6,false);
    const e=0.06,ev=pixIsoBox(g,t.Bm[0],t.Bm[1]+32*e*0+16*2*e,1+2*e,1+2*e,0,1,{});const ap=hipRoof(g,{T:ev.T,L:ev.L,Bm:ev.Bm,Rr:ev.Rr},46);AK.finial(g,Math.round(ap[0]),Math.round(ap[1])-1)}
  else{const f=crenels(g,t,1,1,{th:0.1,n:[2,2],ml:0.25,f0:0.25,lo:3,hi:7,tex:{...TEX(t),bl:10}});f();}
  slit(g,Math.round(t.base.L[0])+15,Math.round(t.base.L[1])+7-TZ+8,5,true);slit(g,Math.round(t.base.Bm[0])+14,Math.round(t.base.Bm[1])-7-TZ+8,5,true);return t};
tower(0,0);
const dB=blockBm(1,1,2,2);const don=pixIsoBox(g,dB[0],dB[1]-Z,2,2,DZ,1,{left:'1',right:'2',top:'3'});
faces(don,{ch:6,bl:12,seed:11},{ch:6,bl:12,seed:12});flagstones(g,'3',don,{n:4});pixLine(g,don.base.Bm[0],don.base.Bm[1]-1,don.Bm[0],don.Bm[1]+1,'K');
machi(g,don.L,don.Bm,1,true);machi(g,don.Bm,don.Rr,1,false);
if(IMP){giltCourse(g,don.base.L,don.base.Bm,DZ,7,true);giltCourse(g,don.base.Bm,don.base.Rr,DZ,7,false)}
{const df=crenels(g,don,2,2,{th:0.06,n:[4,4],ml:0.125,f0:0.25,lo:3,hi:7,tex:TEX(don)});
  if(IMP){const i=0.4,sp=pixIsoBox(g,don.Bm[0],don.Bm[1]-32*i*0-16*2*i+2,2-2*i,2-2*i,4,1,{left:'q',right:'Q'});
    pixLine(g,sp.base.L[0],sp.base.L[1]-1,sp.base.Bm[0],sp.base.Bm[1]-1,'p');pixLine(g,sp.base.Bm[0],sp.base.Bm[1]-1,sp.base.Rr[0],sp.base.Rr[1]-1,'P');
    const ap=hipRoof(g,sp,62);AK.finial(g,Math.round(ap[0]),Math.round(ap[1])-1)}
  df();}
for(const f of [0.2,0.8]){const p=lerpP(don.base.L,don.base.Bm,f);slit(g,Math.round(p[0]),Math.round(p[1])-DZ+12,5,true);const q=lerpP(don.base.Bm,don.base.Rr,f);slit(g,Math.round(q[0]),Math.round(q[1])-DZ+12,5,true)}
for(const f of [0.35,0.65]){const p=lerpP(don.base.L,don.base.Bm,f);slit(g,Math.round(p[0]),Math.round(p[1])-12,4,false);const q=lerpP(don.base.Bm,don.base.Rr,f);slit(g,Math.round(q[0]),Math.round(q[1])-12,4,false)}
front();
// the front towers are in front of the donjon: record the cells they cover so the per-frame donjon banners stay behind them
const preFrontTowers=cloneG(g);for(const r of g)r.fill('.');
tower(0,3);tower(3,0);tower(3,3);
const frontTowers=g.map(r=>r.map(c=>c!=='.'));
for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(!frontTowers[y][x])g[y][x]=preFrontTowers[y][x];
// ---- curtain openings: cross slits at two heights in mirrored pairs about each face's centre, the gate centred on the lit face
// (a 2-px slit at x mirrors about the face's mid-x m to 2m-x-2)
const mirrorSlit=(A,B,f,dx,dy,h,cross)=>{const sl=(B[1]-A[1])/(B[0]-A[0]),m=(A[0]+B[0])/2,yAt=x=>Math.round(A[1]+(x+1-A[0])*sl)+dy;
  const x=Math.round(lerpP(A,B,f)[0])+dx,x2=Math.round(2*m-x-2);slit(g,x,yAt(x),h,cross);slit(g,x2,yAt(x2),h,cross)};
for(const f of [0.12,0.29]){mirrorSlit(top.base.L,top.base.Bm,f,0,-Z+10,5,true);mirrorSlit(top.base.L,top.base.Bm,f,4,-Z+24,4,false)}
for(const f of [0.14,0.36]){mirrorSlit(top.base.Bm,top.base.Rr,f,0,-Z+10,5,true);mirrorSlit(top.base.Bm,top.base.Rr,f,4,-Z+24,4,false)}
const GF=0.5-8/(W*32),GX=Math.round(lerpP(top.base.L,top.base.Bm,GF)[0]),GY=Math.round(lerpP(top.base.L,top.base.Bm,GF)[1])-2;
const PORT=(c,r,w,h)=>r===0&&c%2===0?'I':(c%3===1?(r%2?'i':'I'):r%3===1?'i':r>h-4?null:null);
opening(g,GX,GY,16,22,0.5,{sur:'q',surround:true,jamb:'h',fill:PORT});
for(let c=-3;c<=18;c++){const yy=GY+Math.floor((c+0.5)*0.5)-23-(c>=0&&c<=15?1:0)-(c>=2&&c<=13?1:0)-(c>=5&&c<=10?1:0);pixSet(g,GX+c,yy,c%2?'h':'m');pixSet(g,GX+c,yy-1,c%3?'q':'m')}
{const sx=GX+5,sy=GY+Math.floor(5.5*0.5)-33;pixStamp(g,sx-1,sy,`
kkkkkkkk
kLLTTTTk
kLToOoTk
kLTOoOTD
kLToOoTD
kTTToTTD
.kTTTTD.
..kTTD..
...kD...
`)}
if(IMP){giltCourse(g,top.base.L,top.base.Bm,Z,5,true);giltCourse(g,top.base.Bm,top.base.Rr,Z,5,false)}
inkOutline(g);
// natural lines (formal, so lightly): worn merlons, the odd proud block, moss and grass at the foot, a little rubble
wear(g,STONE,{p:0.35,notch:0.04,bump:0.04,seed:41});
moss(g,STONE,{h:IMP?5:6,split:bx,dens:IMP?0.4:0.5,seed:42});tufts(g,{p:0.35,maxY:by,split:bx,rubble:0.05,seed:43});
// ---- idle: banners on the donjon ripple, gate torches flicker
const BW=10,BL=24,BAN=[[0.3,0],[0.7,2]];
const FLAGS=[...(IMP?[]:[[don.T,0,-2,0]]),[don.L,2,-3,1],[don.Rr,-2,-3,3],[don.Bm,0,-4,2]];
const frames=[];
for(let k=0;k<4;k++){const f=cloneG(g);
  // a matched pair of banners on each donjon face, mirrored about the lit/shade corner
  const BNR=IMP?(g2,x,y,w,h,ph,o)=>giltBanner(g2,x,y,w,h,ph,o.sl):banner,BY=IMP?9:5;
  for(const [fr,ph] of BAN){const p=lerpP(don.base.L,don.base.Bm,fr);BNR(f,Math.round(p[0])-BW/2,Math.round(p[1])-DZ+BY,BW,BL,k+ph,{sl:0.5});
    const q=lerpP(don.base.Bm,don.base.Rr,1-fr);BNR(f,Math.round(q[0])-BW/2,Math.round(q[1])-DZ+BY,BW,BL,k+ph+1,{sl:-0.5})}
  // four flags, one on each corner of the donjon's parapet, all streaming the same way in the wind
  for(const [c,dx,dy,ph] of FLAGS)flagpole(f,Math.round(c[0])+dx,Math.round(c[1])+dy,15,k+ph,{w:10,fh:6});
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(frontTowers[y][x])f[y][x]=g[y][x];   // the front towers hide the banners' tails
  for(const [dx,ph] of [[-5,0],[20,1]]){const x=GX+dx,y=GY+Math.floor((dx+0.5)*0.5)-12;glow(f,x,y-3,(k+ph)%2?3:4);torch(f,x,y,(k+ph*2)%4)}
  frames.push(pixText(f));}
export default {
  id:'keep',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:IMP?{...FORT_PAL,...AK.pal,...LIME}:{...FORT_PAL,...AK.pal},
  frames:{idle:frames},
};
