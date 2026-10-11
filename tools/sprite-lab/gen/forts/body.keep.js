// @pixel keep
// Castle 4×4: a battered plinth and ashlar curtain wall (quoins, cross slits, crenellations that shade the wall-walk), four corner
// towers with corbel tables, a tall central donjon ringed by machicolations, a voussoir gate with portcullis and the lord's
// shield above it, and long team banners on the donjon. Flags stay code-drawn (donjon centre and the two side towers).
// Frames: idle 4 — the banners ripple, the gate torches flicker and light the jambs.
//@@KIT
const W=4,H=4,Z=36,TZ=26,DZ=36;
const GW=(W+H)*32+4, GH=(W+H)*16+Z+TZ+DZ+6+10;
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
const front=crenels(g,top,W,H,{th:0.05,n:[8,8],ml:0.0625,f0:0.125,lo:3,hi:7,tex:TEX(top)});
// ---- corner towers and donjon, back to front
const tower=(i,j)=>{const B=blockBm(i,j,1,1);const t=pixIsoBox(g,B[0],B[1]-Z,1,1,TZ,1,{left:'1',right:'2',top:'3'});
  faces(t,{ch:6,bl:10,seed:7+i},{ch:6,bl:10,seed:9+j});flagstones(g,'3',t,{n:3});pixLine(g,t.base.Bm[0],t.base.Bm[1]-1,t.Bm[0],t.Bm[1]+1,'K');
  machi(g,t.L,t.Bm,1,true);machi(g,t.Bm,t.Rr,1,false);
  const f=crenels(g,t,1,1,{th:0.1,n:[2,2],ml:0.25,f0:0.125,lo:3,hi:7,tex:{...TEX(t),bl:10}});f();
  slit(g,Math.round(t.base.L[0])+15,Math.round(t.base.L[1])+7-TZ+8,5,true);slit(g,Math.round(t.base.Bm[0])+14,Math.round(t.base.Bm[1])-7-TZ+8,5,true);return t};
tower(0,0);
const dB=blockBm(1,1,2,2);const don=pixIsoBox(g,dB[0],dB[1]-Z,2,2,DZ,1,{left:'1',right:'2',top:'3'});
faces(don,{ch:6,bl:12,seed:11},{ch:6,bl:12,seed:12});flagstones(g,'3',don,{n:4});pixLine(g,don.base.Bm[0],don.base.Bm[1]-1,don.Bm[0],don.Bm[1]+1,'K');
machi(g,don.L,don.Bm,1,true);machi(g,don.Bm,don.Rr,1,false);
crenels(g,don,2,2,{th:0.06,n:[4,4],ml:0.125,f0:0.125,lo:3,hi:7,tex:TEX(don)})();
for(const f of [0.2,0.8]){const p=lerpP(don.base.L,don.base.Bm,f);slit(g,Math.round(p[0]),Math.round(p[1])-DZ+12,5,true);const q=lerpP(don.base.Bm,don.base.Rr,f);slit(g,Math.round(q[0]),Math.round(q[1])-DZ+12,5,true)}
for(const f of [0.35,0.65]){const p=lerpP(don.base.L,don.base.Bm,f);slit(g,Math.round(p[0]),Math.round(p[1])-12,4,false);const q=lerpP(don.base.Bm,don.base.Rr,f);slit(g,Math.round(q[0]),Math.round(q[1])-12,4,false)}
front();
// the front towers are in front of the donjon: record the cells they cover so the per-frame donjon banners stay behind them
const preFrontTowers=cloneG(g);for(const r of g)r.fill('.');
tower(0,3);tower(3,0);tower(3,3);
const frontTowers=g.map(r=>r.map(c=>c!=='.'));
for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(!frontTowers[y][x])g[y][x]=preFrontTowers[y][x];
// ---- curtain openings: cross slits at two heights, the gate near the front corner of the lit face
for(const f of [0.1,0.3,0.5]){const p=lerpP(top.base.L,top.base.Bm,f);slit(g,Math.round(p[0]),Math.round(p[1])-Z+10,5,true);slit(g,Math.round(p[0])+4,Math.round(p[1])-Z+24,4,false)}
for(const f of [0.2,0.42,0.64,0.86]){const p=lerpP(top.base.Bm,top.base.Rr,f);slit(g,Math.round(p[0]),Math.round(p[1])-Z+10,5,true);slit(g,Math.round(p[0])-5,Math.round(p[1])-Z+24,4,false)}
const GX=Math.round(lerpP(top.base.L,top.base.Bm,0.74)[0]),GY=Math.round(lerpP(top.base.L,top.base.Bm,0.74)[1])-2;
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
inkOutline(g);
// ---- idle: banners on the donjon ripple, gate torches flicker
const frames=[];
for(let k=0;k<4;k++){const f=cloneG(g);
  for(const [fr,ph] of [[0.28,0],[0.62,1]]){const p=lerpP(don.base.L,don.base.Bm,fr);banner(f,Math.round(p[0])-6,Math.round(p[1])-DZ+5,12,26,k+ph,{sl:0.5})}
  {const p=lerpP(don.base.Bm,don.base.Rr,0.45);banner(f,Math.round(p[0])-6,Math.round(p[1])-DZ+5,12,26,k+2,{sl:-0.5})}
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(frontTowers[y][x])f[y][x]=g[y][x];   // the front towers hide the banners' tails
  for(const [dx,ph] of [[-5,0],[20,1]]){const x=GX+dx,y=GY+Math.floor((dx+0.5)*0.5)-12;glow(f,x,y-3,(k+ph)%2?3:4);torch(f,x,y,(k+ph*2)%4)}
  frames.push(pixText(f));}
export default {
  id:'keep',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:FORT_PAL,
  frames:{idle:frames},
};
