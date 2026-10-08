// @pixel keep
// Keep 4×4: curtain wall with battlements, four corner towers, a taller central donjon, gate arch on the lit face, arrow slits, buttress piers.
const W=4,H=4,Z=36,TZ=26,DZ=36;
const GW=(W+H)*32+4, GH=(W+H)*16+Z+TZ+DZ+6+10;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
function courses(g,A,B,z,step,ch,joint){const n=Math.floor((z-1)/step);for(let k=1;k<=n;k++){const y=k*step;pixLine(g,A[0],A[1]-y,B[0],B[1]-y,ch);if(joint){const segs=Math.max(2,Math.round(Math.hypot(B[0]-A[0],B[1]-A[1])/8));for(let j=0;j<segs;j++){const t=(j+(k%2?0.5:0.1))/segs;if(t>=1)continue;const x=A[0]+(B[0]-A[0])*t,yy=A[1]+(B[1]-A[1])*t-y;pixSet(g,x,yy+1,joint);pixSet(g,x,yy+2,joint)}}}}
function merlons(g,top,n,ch,sz){sz=sz||32/n*0.5;const put=(P,Q)=>{for(let i=0;i<n;i++){const f=(i+0.25)/n;const a=[P[0]+(Q[0]-P[0])*f,P[1]+(Q[1]-P[1])*f];pixIsoBox(g,a[0],a[1]+sz*0.5,sz/32,sz/32,5,1,ch)}};put(top.L,top.Bm);put(top.Bm,top.Rr)}
// tile (i,j) block of size w×h: bottom corner, given the keep's bottom corner (bx,by) and footprint 4×4
const blockBm=(i,j,w,h)=>[bx+(i-j+(w-h))*32, by-(W+H)*16+(i+j+w+h)*16];
// curtain wall
const top=pixIsoBox(g,bx,by,W,H,Z,1,{left:'a',right:'b',top:'c'});
courses(g,top.base.L,top.base.Bm,Z,6,'d','d');courses(g,top.base.Bm,top.base.Rr,Z,6,'d','d');
// courtyard flagstones, walkway edge, rim
for(let k=0;k<160;k++){const u=((k*37)%97)/97,v=((k*53)%89)/89;pixSet(g,top.T[0]+(top.Rr[0]-top.T[0])*u+(top.L[0]-top.T[0])*v,top.T[1]+(top.Rr[1]-top.T[1])*u+(top.L[1]-top.T[1])*v,'d')}
pixLine(g,top.L[0]+10,top.L[1]+5,top.Bm[0],top.Bm[1]-5,'f');pixLine(g,top.Bm[0],top.Bm[1]-5,top.Rr[0]-10,top.Rr[1]+5,'f');
pixLine(g,top.L[0],top.L[1],top.Bm[0],top.Bm[1],'d');pixLine(g,top.Bm[0],top.Bm[1],top.Rr[0],top.Rr[1],'d');
merlons(g,top,8,{left:'a',right:'b',top:'c'},9);
// gate arch on the lit face near the bottom corner
pixStamp(g,top.base.Bm[0]-24,top.base.Bm[1]-12-16,`
....eeeeeee.....
...eeeeeeeee....
..eeeeeeeeeee...
.eeeeeeeeeeeee..
.evevevevevevee.
.evevevevevevee.
.evevevevevevee.
.evevevevevevee.
.evevevevevevee.
.evevevevevevee.
.evevevevevevee.
.evevevevevevee.
.evevevevevevee.
.evevevevevevee.
.evevevevevevee.
.evevevevevevee.
`);
// a wider arch frame of lighter stone
pixLine(g,top.base.Bm[0]-25,top.base.Bm[1]-12,top.base.Bm[0]-25,top.base.Bm[1]-24,'f');pixLine(g,top.base.Bm[0]-8,top.base.Bm[1]-4,top.base.Bm[0]-8,top.base.Bm[1]-16,'f');
// arrow slits along both faces at two heights
for(const f of [0.18,0.32,0.68,0.82]){const p=[top.base.L[0]+(top.base.Bm[0]-top.base.L[0])*f,top.base.L[1]+(top.base.Bm[1]-top.base.L[1])*f];pixRect(g,p[0],p[1]-Z+10,1,5,'e');pixRect(g,p[0],p[1]-Z+22,1,5,'e');const q=[top.base.Bm[0]+(top.base.Rr[0]-top.base.Bm[0])*f,top.base.Bm[1]+(top.base.Rr[1]-top.base.Bm[1])*f];pixRect(g,q[0],q[1]-Z+10,1,5,'e');pixRect(g,q[0],q[1]-Z+22,1,5,'e')}
// central donjon (2×2 at tiles 1..2) — drawn before the front towers so they overlap it correctly
const dB=blockBm(1,1,2,2);const don=pixIsoBox(g,dB[0],dB[1]-Z,2,2,DZ,1,{left:'f',right:'a',top:'c'});
courses(g,don.base.L,don.base.Bm,DZ,6,'d');courses(g,don.base.Bm,don.base.Rr,DZ,6,'d');merlons(g,don,4,{left:'a',right:'b',top:'c'},9);pixLine(g,don.L[0],don.L[1],don.Bm[0],don.Bm[1],'d');pixLine(g,don.Bm[0],don.Bm[1],don.Rr[0],don.Rr[1],'d');
pixRect(g,don.base.L[0]+16,don.base.L[1]+8-DZ+6,1,5,'e');pixRect(g,don.base.Bm[0]+14,don.base.Bm[1]-7-DZ+6,1,5,'e');pixRect(g,don.base.Bm[0]-18,don.base.Bm[1]-9-DZ+7,1,5,'e');
// corner towers: back first, front last
for(const [i,j] of [[0,0],[3,0],[0,3],[3,3]]){const B=blockBm(i,j,1,1);const t=pixIsoBox(g,B[0],B[1]-Z,1,1,TZ,1,{left:'f',right:'a',top:'c'});courses(g,t.base.L,t.base.Bm,TZ,6,'d');courses(g,t.base.Bm,t.base.Rr,TZ,6,'d');merlons(g,t,2,{left:'a',right:'b',top:'c'},8);pixLine(g,t.L[0],t.L[1],t.Bm[0],t.Bm[1],'d');pixLine(g,t.Bm[0],t.Bm[1],t.Rr[0],t.Rr[1],'d');pixRect(g,t.base.L[0]+14,t.base.L[1]+7-TZ+5,1,4,'e');pixRect(g,t.base.Bm[0]+14,t.base.Bm[1]-7-TZ+5,1,4,'e')}
export default {
  id:'keep',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:{a:'#8f877a',b:'#746c60',c:'#a09888',d:'#56504a',e:'#2a2018',f:'#9c948a',v:'#5a3a18',T:'team'},
  frames:{idle:[pixText(g)]},
};
