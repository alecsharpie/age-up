// @pixel tower
// Watch tower 1×1: square ashlar shaft (plinth, quoins, cross arrow slits, a studded door) under a timber hoarding with loopholes and
// hung team shields, capped by a slate pyramid roof whose apex carries the code-drawn flag. A team banner hangs down the lit face.
// Frames: idle 4 — the banner ripples and a watch-fire flickers in a loophole.
//@@KIT
const W=1,H=1,Z=42,HOARD=9,SZ=Z-HOARD;
const GW=(W+H)*32+8, GH=(W+H)*16+Z+HOARD+8+10;
const bx=W*32+4, by=GH-4;
const g=pixGrid(GW,GH);
// ---- shaft
const S0=0.8, sb=[bx,by-16+S0*16];                                         // a slimmer shaft centred on the tile
const pl=pixIsoBox(g,bx,by-16+0.9*16,0.9,0.9,4,1,{left:'1',right:'2'});    // battered footing course
ashlar(g,'1',pl.base.L,pl.base.Bm,LIT,{ch:4,bl:6,plinth:4,seed:1});ashlar(g,'2',pl.base.Bm,pl.base.Rr,SHD,{ch:4,bl:6,plinth:4,seed:1});
const sh=pixIsoBox(g,sb[0],sb[1],S0,S0,SZ-(by-sb[1]),1,{left:'1',right:'2'});
ashlar(g,'1',sh.base.L,sh.base.Bm,LIT,{ch:5,bl:8,plinth:3,seed:2});
ashlar(g,'2',sh.base.Bm,sh.base.Rr,SHD,{ch:5,bl:8,plinth:3,seed:3});
pixLine(g,sh.base.Bm[0],sh.base.Bm[1]-1,sh.Bm[0],sh.Bm[1],'K');            // the lit-to-shade corner
// ---- hoarding (timber gallery) on corbels, overhanging the shaft
const s=1.04, hb=[bx,by-16+s*16-SZ];
const hy=(x)=>x<=bx?hb[1]-(bx-x)*0.5:hb[1]-(x-bx)*0.5;                   // hoarding underside line over the shaft faces
for(let x=Math.ceil(sh.base.L[0]);x<=sh.base.Rr[0];x++){const y=Math.floor(hy(x));pixSet(g,x,y+1,x<=bx?'M':'k');pixSet(g,x,y+2,x<=bx?'m':'M')}
for(const f of [0.12,0.37,0.62,0.87]){for(const side of [-1,1]){const x=Math.round(bx+side*(1-f)*32*S0),y=Math.floor(hy(x));pixSet(g,x,y+1,'x');pixSet(g,x,y+2,'x');pixSet(g,x,y+3,'y');pixSet(g,x-1,y+1,side<0?'v':'x')}}
const ho=pixIsoBox(g,hb[0],hb[1],s,s,HOARD,1,{left:'3',right:'4',top:'5'});
planks(g,'3',ho.base.L,ho.base.Bm,{l:'w',m:'v',s:'w',g:'x',r:'x'},{bw:3,rails:[0,HOARD-1],seed:4});
planks(g,'4',ho.base.Bm,ho.base.Rr,{m:'x',s:'v',g:'y',r:'y'},{bw:3,rails:[0,HOARD-1],seed:5});
// loopholes in the hoarding (two per face), a hung shield on each face
const LOOP=[];for(const f of [0.28,0.72]){
  const p=lerpP(ho.base.L,ho.base.Bm,f);LOOP.push([Math.round(p[0]),Math.round(p[1])-4]);opening(g,Math.round(p[0]),Math.round(p[1])-3,2,4,0.5,{arch:false,sur:'y',jamb:'w'});
  const q=lerpP(ho.base.Bm,ho.base.Rr,f);opening(g,Math.round(q[0]),Math.round(q[1])-3,2,4,-0.5,{arch:false,sur:'y',jamb:'v'});}
{const p=lerpP(ho.base.L,ho.base.Bm,0.5);shield(g,Math.round(p[0])-3,Math.round(p[1])-8);const q=lerpP(ho.base.Bm,ho.base.Rr,0.5);shield(g,Math.round(q[0])-2,Math.round(q[1])-8)}
// ---- slate pyramid roof; apex where the game plants the flag (cx, cy-44)
const rt={T:[ho.T[0],ho.T[1]-1],L:[ho.L[0]-0.5,ho.L[1]],Rr:[ho.Rr[0]+0.5,ho.Rr[1]],Bm:[ho.Bm[0],ho.Bm[1]+1]};
const ap=pixIsoRoof(g,rt,18,1,{left:'6',back:'7',front:'8',right:'9'});
shingles(g,'6',rt.L,rt.T,{l:'r',m:'r',s:'s',u:'s'},{up:true});
shingles(g,'7',rt.T,rt.Rr,{l:'s',m:'t',s:'u',u:'u'},{up:true});
shingles(g,'8',rt.L,rt.Bm,{l:'r',m:'s',s:'r',u:'t'},{seed:6});
shingles(g,'9',rt.Bm,rt.Rr,{l:'t',m:'u',s:'t',u:'z'},{seed:7});
pixLine(g,rt.Bm[0],rt.Bm[1],ap[0],ap[1],'z');pixLine(g,rt.L[0],rt.L[1],ap[0],ap[1],'r');
pixLine(g,rt.L[0],rt.L[1],rt.Bm[0],rt.Bm[1],'k');pixLine(g,rt.Bm[0],rt.Bm[1],rt.Rr[0],rt.Rr[1],'k');
for(let x=Math.ceil(ho.L[0]);x<=ho.Rr[0];x++){const y=Math.floor(x<=bx?ho.Bm[1]-(bx-x)*0.5:ho.Bm[1]-(x-bx)*0.5)+1;if(pixGet(g,x,y)!=='.')pixSet(g,x,y,x<=bx?'x':'y')} // eave shadow on the hoarding
pixSet(g,ap[0],ap[1],'o');pixSet(g,ap[0],ap[1]+1,'o');
// ---- openings in the shaft: door on the lit face, cross slits
opening(g,bx-11,by-6-3,6,10,0.5,{fill:(c,r,w,h)=>r===h-1?null:c===0?'x':(c+1)%2?'v':'w'});
{const d=[bx-11,by-6-3];pixSet(g,d[0]+1,d[1]-4+0,'i');pixSet(g,d[0]+3,d[1]-3+1,'i');pixSet(g,d[0]+3,d[1]-6+1,'i')}
slit(g,bx-8,by-35,5,true);slit(g,bx+8,by-35,5,true);slit(g,bx+18,by-24,4,false);
inkOutline(g);
// ---- idle: the banner ripples down the lit face, a watch-fire flickers behind a loophole
const frames=[];
for(let k=0;k<4;k++){const f=cloneG(g);
  banner(f,bx-22,Math.floor(hy(bx-22))+3,7,15,k,{sl:0.5});
  const [lx,ly]=LOOP[0];pixSet(f,lx,ly+1,k%2?'R':'Y');pixSet(f,lx,ly+2,k===2?'Y':'R');
  frames.push(pixText(f));}
export default {
  id:'tower',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:FORT_PAL,
  frames:{idle:frames},
};
