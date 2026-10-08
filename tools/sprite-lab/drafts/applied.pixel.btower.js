// @pixel btower
// Bombard Tower 2×2: squat heavy stone block, battlements, a cannon port on the shaded face with the barrel poking out, iron bands.
const W=2,H=2,Z=34;
const GW=(W+H)*32+4, GH=(W+H)*16+Z+6+10;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
function courses(g,A,B,z,step,ch,joint){const n=Math.floor((z-1)/step);for(let k=1;k<=n;k++){const y=k*step;pixLine(g,A[0],A[1]-y,B[0],B[1]-y,ch);if(joint){const segs=Math.max(2,Math.round(Math.hypot(B[0]-A[0],B[1]-A[1])/8));for(let j=0;j<segs;j++){const t=(j+(k%2?0.5:0.1))/segs;if(t>=1)continue;const x=A[0]+(B[0]-A[0])*t,yy=A[1]+(B[1]-A[1])*t-y;pixSet(g,x,yy+1,joint);pixSet(g,x,yy+2,joint)}}}}
function merlons(g,top,n,ch,sz){sz=sz||32/n*0.5;const put=(P,Q)=>{for(let i=0;i<n;i++){const f=(i+0.25)/n;const a=[P[0]+(Q[0]-P[0])*f,P[1]+(Q[1]-P[1])*f];pixIsoBox(g,a[0],a[1]+sz*0.5,sz/32,sz/32,5,1,ch)}};put(top.L,top.Bm);put(top.Bm,top.Rr)}
// a slightly battered (wider) base course, then the main block
pixIsoBox(g,bx,by,W+0.08,H+0.08,6,1,{left:'f',right:'b'});
const top=pixIsoBox(g,bx,by-1,W,H,Z-1,1,{left:'a',right:'b',top:'c'});
courses(g,top.base.L,top.base.Bm,Z-1,6,'d','d');courses(g,top.base.Bm,top.base.Rr,Z-1,6,'d','d');
pixLine(g,top.L[0],top.L[1],top.Bm[0],top.Bm[1],'d');pixLine(g,top.Bm[0],top.Bm[1],top.Rr[0],top.Rr[1],'d');
for(let k=0;k<60;k++){const u=((k*37)%97)/97,v=((k*53)%89)/89;pixSet(g,top.T[0]+(top.Rr[0]-top.T[0])*u+(top.L[0]-top.T[0])*v,top.T[1]+(top.Rr[1]-top.T[1])*u+(top.L[1]-top.T[1])*v,'d')}
merlons(g,top,3,{left:'a',right:'b',top:'c'},10);
// raised gun platform with a bombard pointing out over the shaded face
const plat=pixIsoBox(g,top.Bm[0],top.Bm[1]-10,1.1,1.1,6,1,{left:'f',right:'b',top:'c'});
const gx=plat.Bm[0]-2,gy=plat.Bm[1]-14;
pixStamp(g,gx-10,gy-8,`
.......hhhh........
......hiiiih.......
.....hiiiiiih......
....hiiijjjih......
...hiiijjjjih......
..hiiijjjjjjih.....
.hiiijjjjjjjjhh....
hiiijjjjjjjjjjjhh..
hjjjjjjjjjjjjjjjjhh
.hhjjjjjjjjjjjjjjjh
...vvvhhhjjjjjjjjh.
..vwwwwvvvhhhhhh...
..vwwwwwwwvv.......
...vvvvvvvvv.......
....vv...vv........
`);
// cannon port on the shaded (right) face with a barrel, and a second blind port on the lit face
const pr=[top.base.Bm[0]+(top.base.Rr[0]-top.base.Bm[0])*0.5,top.base.Bm[1]+(top.base.Rr[1]-top.base.Bm[1])*0.5-Z*0.55];
pixStamp(g,pr[0]-5,pr[1]-4,`
.ddddddd.
deeeeeeed
deeeeeeed
deeeeeeed
deeeeeeed
.ddddddd.
`);
for(let k=0;k<12;k++){pixSet(g,pr[0]+k,pr[1]-1+Math.floor(k/4),'h');pixSet(g,pr[0]+k,pr[1]+Math.floor(k/4),'i');pixSet(g,pr[0]+k,pr[1]+1+Math.floor(k/4),'i');pixSet(g,pr[0]+k,pr[1]+2+Math.floor(k/4),'j')}
pixRect(g,pr[0]+12,pr[1]+1,1,4,'h');
const pl=[top.base.L[0]+(top.base.Bm[0]-top.base.L[0])*0.5,top.base.L[1]+(top.base.Bm[1]-top.base.L[1])*0.5-Z*0.55];
pixStamp(g,pl[0]-4,pl[1]-3,`
.ddddd.
deeeeed
deeeeed
deeeeed
.ddddd.
`);
// arrow slits near the top on both faces
pixRect(g,top.base.L[0]+14,top.base.L[1]+7-Z+6,1,5,'e');pixRect(g,top.base.Bm[0]-12,top.base.Bm[1]-6-Z+6,1,5,'e');pixRect(g,top.base.Rr[0]-16,top.base.Rr[1]+8-Z+6,1,5,'e');
export default {
  id:'btower',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:{a:'#8a847a',b:'#6a655d',c:'#9a948a',d:'#4e4942',e:'#2a2018',f:'#9c968c',h:'#6a6a72',i:'#4a4a52',j:'#2e2e34',w:'#8a6a3a',v:'#5a3a18',T:'team'},
  frames:{idle:[pixText(g)]},
};
