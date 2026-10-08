// @pixel gate
// Gate 1×1: an ashlar gatehouse block with a voussoir arch and an iron portcullis on both faces, between two flanking towers
// (cross slits, merlon caps) that rise above the wall-walk. Team banners hang on the towers; torches burn either side of the arch.
// Frames: idle 4 — torch flicker with warm light on the jambs, banners ripple.
//@@KIT
const W=1,H=1,Z=20,TZ=30;
const GW=(W+H)*32+4, GH=(W+H)*16+TZ+6+10;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
const top=pixIsoBox(g,bx,by,W,H,Z,1,{left:'1',right:'2',top:'3'});
ashlar(g,'1',top.base.L,top.base.Bm,LIT,{ch:5,bl:8,plinth:2,seed:2});
ashlar(g,'2',top.base.Bm,top.base.Rr,SHD,{ch:5,bl:8,plinth:2,seed:3});
flagstones(g,'3',top,{n:4});
pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,'K');
const front=crenels(g,top,W,H,{th:0.12,n:[2,2],ml:0.25,f0:0.125,lo:2,hi:6,tex:{L:[top.base.L,top.base.Bm],R:[top.base.Bm,top.base.Rr],seed:2}});front();   // same merlon rhythm as the wall
// arches: voussoir surround, dark passage, portcullis grid with spikes
const PORT=(c,r,w,h)=>r===0&&c%2===0?'I':(c%3===1?(r%2?'i':'I'):r%3===1?'i':null);
const archL=[bx-10,by-5-2],archR=[bx+3,by-1-2];   // centred in the strip each face shows between the flanking towers
const arch=(x,y,sl,jamb)=>{opening(g,x,y,8,13,sl,{sur:sl>0?'q':'Q',surround:true,jamb,fill:PORT});
  for(let c=-2;c<=9;c++){const yy=y+Math.floor((c+0.5)*sl)-14-(c>=1&&c<=6?1:0)-(c>=3&&c<=4?1:0);pixSet(g,x+c,yy,c%2?(sl>0?'h':'H'):(sl>0?'m':'M'))}};
arch(archL[0],archL[1],0.5,'h');arch(archR[0],archR[1],-0.5,'H');
// flanking towers at the L and Rr corners
const s=0.32;const TW=[];
for(const [B0,side] of [[[top.base.L[0]+s*32,top.base.L[1]+s*16],0],[[top.base.Rr[0]-s*32,top.base.Rr[1]+s*16],1]]){
  const t=pixIsoBox(g,B0[0],B0[1],s,s,TZ,1,{left:'4',right:'5',top:'6'});
  ashlar(g,'4',t.base.L,t.base.Bm,LIT,{ch:5,bl:5,plinth:2,seed:6+side});ashlar(g,'5',t.base.Bm,t.base.Rr,SHD,{ch:5,bl:5,plinth:2,seed:8+side});
  flagstones(g,'6',t,{n:2});
  pixLine(g,t.base.Bm[0],t.base.Bm[1]-1,t.Bm[0],t.Bm[1]+1,'K');
  pixLine(g,t.L[0],t.L[1]+3,t.Bm[0],t.Bm[1]+3,'q');pixLine(g,t.Bm[0],t.Bm[1]+3,t.Rr[0],t.Rr[1]+3,'Q');pixLine(g,t.L[0],t.L[1]+4,t.Bm[0],t.Bm[1]+4,'m');pixLine(g,t.Bm[0],t.Bm[1]+4,t.Rr[0],t.Rr[1]+4,'k'); // string course
  const fr=crenels(g,t,s,s,{th:0.1,n:[2,2],ml:0.3,f0:0.12,lo:2,hi:6,tex:{L:[t.base.L,t.base.Bm],R:[t.base.Bm,t.base.Rr],bl:5,seed:6}});fr();
  slit(g,Math.round(t.base.Bm[0])+3,Math.round(t.base.Bm[1])-TZ+10,4,true);
  TW.push(t);
}
inkOutline(g);
const frames=[];
for(let k=0;k<4;k++){const f=cloneG(g);
  const tl=TW[0],tr=TW[1];
  banner(f,Math.round(tl.base.L[0])+2,Math.round(tl.base.L[1])-TZ+11,6,13,k,{sl:0.5});      // outer faces of the towers
  banner(f,Math.round(tr.base.Bm[0])+2,Math.round(tr.base.Bm[1])-TZ+10,6,13,k+2,{sl:-0.5});
  // torches on the tower faces that flank each arch
  for(const [t,a,b,ph] of [[tl,'Bm','Rr',0],[tr,'L','Bm',1]]){const p=lerpP(t.base[a],t.base[b],0.5);const x=Math.round(p[0]),y=Math.round(p[1])-9;glow(f,x,y-3,(k+ph)%2?2:3);torch(f,x,y,(k+ph*2)%4)}
  frames.push(pixText(f));}
export default {
  id:'gate',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:FORT_PAL,
  frames:{idle:frames},
};
