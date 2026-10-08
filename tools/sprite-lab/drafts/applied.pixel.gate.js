// @pixel gate
// Gate 1×1: wall block with a dark arch and portcullis on both faces, between two flanking towers that rise above the wall line.
const W=1,H=1,Z=20,TZ=30;
const GW=(W+H)*32+4, GH=(W+H)*16+TZ+6+10;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
function courses(g,A,B,z,step,ch,joint){const n=Math.floor((z-1)/step);for(let k=1;k<=n;k++){const y=k*step;pixLine(g,A[0],A[1]-y,B[0],B[1]-y,ch);if(joint){const segs=Math.max(2,Math.round(Math.hypot(B[0]-A[0],B[1]-A[1])/8));for(let j=0;j<segs;j++){const t=(j+(k%2?0.5:0.1))/segs;if(t>=1)continue;const x=A[0]+(B[0]-A[0])*t,yy=A[1]+(B[1]-A[1])*t-y;pixSet(g,x,yy+1,joint);pixSet(g,x,yy+2,joint)}}}}
function merlons(g,top,n,ch,sz){sz=sz||32/n*0.5;const put=(P,Q)=>{for(let i=0;i<n;i++){const f=(i+0.25)/n;const a=[P[0]+(Q[0]-P[0])*f,P[1]+(Q[1]-P[1])*f];pixIsoBox(g,a[0],a[1]+sz*0.5,sz/32,sz/32,5,1,ch)}};put(top.L,top.Bm);put(top.Bm,top.Rr)}
const top=pixIsoBox(g,bx,by,W,H,Z,1,{left:'a',right:'b',top:'c'});
courses(g,top.base.L,top.base.Bm,Z,5,'d','d');courses(g,top.base.Bm,top.base.Rr,Z,5,'d','d');
// arches with portcullis bars: left face (centre) and right face (centre)
const arch=`
..eeee..
.eeeeee.
eeeeeeee
evevevee
evevevee
evevevee
evevevee
evevevee
evevevee
evevevee
evevevee
evevevee
`;
pixStamp(g,bx-12,by-7-14,arch);pixStamp(g,bx+4,by-7-14,arch);
// flanking towers at the L and Rr corners
const s=0.3;
const tl=pixIsoBox(g,top.base.L[0]+s*32,top.base.L[1]+s*16,s,s,TZ,1,{left:'a',right:'b',top:'c'});
const tr=pixIsoBox(g,top.base.Rr[0]-s*32,top.base.Rr[1]+s*16,s,s,TZ,1,{left:'a',right:'b',top:'c'});
for(const t of [tl,tr]){courses(g,t.base.L,t.base.Bm,TZ,5,'d');courses(g,t.base.Bm,t.base.Rr,TZ,5,'d');merlons(g,t,1,{left:'a',right:'b',top:'c'},7);pixRect(g,t.base.Bm[0]-3,t.base.Bm[1]-s*16-TZ+10,1,4,'e');pixRect(g,t.base.Bm[0]+2,t.base.Bm[1]-s*16-TZ+11,1,4,'e')}
export default {
  id:'gate',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:{a:'#9a9285',b:'#7d7468',c:'#a8a094',d:'#5e574f',e:'#2a2018',f:'#b8b0a3',v:'#5a3a18'},
  frames:{idle:[pixText(g)]},
};
