// @pixel tower
// Watchtower 1×1: square stone shaft, timber hoarding (overhanging gallery) at the top with battlements, arrow slits, a door at the base.
const W=1,H=1,Z=42,HOARD=9;
const GW=(W+H)*32+8, GH=(W+H)*16+Z+HOARD+8+10;
const bx=W*32+4, by=GH-4;
const g=pixGrid(GW,GH);
function courses(g,A,B,z,step,ch,joint){const n=Math.floor((z-1)/step);for(let k=1;k<=n;k++){const y=k*step;pixLine(g,A[0],A[1]-y,B[0],B[1]-y,ch);if(joint){const segs=Math.max(2,Math.round(Math.hypot(B[0]-A[0],B[1]-A[1])/8));for(let j=0;j<segs;j++){const t=(j+(k%2?0.5:0.1))/segs;if(t>=1)continue;const x=A[0]+(B[0]-A[0])*t,yy=A[1]+(B[1]-A[1])*t-y;pixSet(g,x,yy+1,joint);pixSet(g,x,yy+2,joint)}}}}
function merlons(g,top,n,ch,sz){sz=sz||32/n*0.5;const put=(P,Q)=>{for(let i=0;i<n;i++){const f=(i+0.25)/n;const a=[P[0]+(Q[0]-P[0])*f,P[1]+(Q[1]-P[1])*f];pixIsoBox(g,a[0],a[1]+sz*0.5,sz/32,sz/32,5,1,ch)}};put(top.L,top.Bm);put(top.Bm,top.Rr)}
// shaft
const shaft=pixIsoBox(g,bx,by,W,H,Z-HOARD,1,{left:'a',right:'b'});
courses(g,shaft.base.L,shaft.base.Bm,Z-HOARD,5,'d','d');courses(g,shaft.base.Bm,shaft.base.Rr,Z-HOARD,5,'d','d');
// hoarding: wider timber gallery, propped on beams
const s=1.25;const hb=[bx,by-16+s*16-(Z-HOARD)];
for(let k=0;k<4;k++){const f=(k+0.5)/4;pixLine(g,shaft.base.L[0]+(shaft.base.Bm[0]-shaft.base.L[0])*f,shaft.L[1]+(shaft.Bm[1]-shaft.L[1])*f-1,shaft.base.L[0]+(shaft.base.Bm[0]-shaft.base.L[0])*f-3,shaft.L[1]+(shaft.Bm[1]-shaft.L[1])*f+3,'v');pixLine(g,shaft.base.Bm[0]+(shaft.base.Rr[0]-shaft.base.Bm[0])*f,shaft.Bm[1]+(shaft.Rr[1]-shaft.Bm[1])*f-1,shaft.base.Bm[0]+(shaft.base.Rr[0]-shaft.base.Bm[0])*f+3,shaft.Bm[1]+(shaft.Rr[1]-shaft.Bm[1])*f+3,'v')}
const hoard=pixIsoBox(g,hb[0],hb[1],s,s,HOARD,1,{left:'w',right:'v',top:'x'});
for(let k=1;k<5;k++){const t=k/5;pixLine(g,hoard.T[0]+(hoard.L[0]-hoard.T[0])*t,hoard.T[1]+(hoard.L[1]-hoard.T[1])*t,hoard.Rr[0]+(hoard.Bm[0]-hoard.Rr[0])*t,hoard.Rr[1]+(hoard.Bm[1]-hoard.Rr[1])*t,'w')}
pixLine(g,hoard.L[0],hoard.L[1],hoard.Bm[0],hoard.Bm[1],'y');pixLine(g,hoard.Bm[0],hoard.Bm[1],hoard.Rr[0],hoard.Rr[1],'y');
// plank lines on the hoarding
pixLine(g,hoard.base.L[0],hoard.base.L[1]-3,hoard.base.Bm[0],hoard.base.Bm[1]-3,'x');pixLine(g,hoard.base.L[0],hoard.base.L[1]-6,hoard.base.Bm[0],hoard.base.Bm[1]-6,'x');
pixLine(g,hoard.base.Bm[0],hoard.base.Bm[1]-3,hoard.base.Rr[0],hoard.base.Rr[1]-3,'y');pixLine(g,hoard.base.Bm[0],hoard.base.Bm[1]-6,hoard.base.Rr[0],hoard.base.Rr[1]-6,'y');
merlons(g,hoard,2,{left:'a',right:'b',top:'c'},9);
// arrow slits and a door
pixRect(g,bx-17,by-8-26,1,5,'e');pixRect(g,bx-17,by-8-14,1,5,'e');pixRect(g,bx+15,by-8-24,1,5,'e');
pixStamp(g,bx-11,by-5-9,`
.vvvv.
veeeev
veeeev
veeeev
veeeev
veeeev
veeeev
veeeev
veeeev
`);
export default {
  id:'tower',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:{a:'#9a9285',b:'#7d7468',c:'#a8a094',d:'#5e574f',e:'#2a2018',f:'#b8b0a3',w:'#8a6a3a',v:'#5a3a18',x:'#6f5229',y:'#4a2e12',T:'team',D:'teamdark',L:'teamlight'},
  frames:{idle:[pixText(g)]},
};
