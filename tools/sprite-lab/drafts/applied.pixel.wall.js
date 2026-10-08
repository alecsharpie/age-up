// @pixel wall
// Stone wall 1×1: a full-tile block with two merlons per top edge at the same fractions as every neighbour, so a line of walls reads as one battlement.
const W=1,H=1,Z=18;
const GW=(W+H)*32+4, GH=(W+H)*16+Z+6+10;
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
function courses(g,A,B,z,step,ch,joint){const n=Math.floor((z-1)/step);for(let k=1;k<=n;k++){const y=k*step;pixLine(g,A[0],A[1]-y,B[0],B[1]-y,ch);if(joint){const segs=Math.max(2,Math.round(Math.hypot(B[0]-A[0],B[1]-A[1])/8));for(let j=0;j<segs;j++){const t=(j+(k%2?0.5:0.1))/segs;if(t>=1)continue;const x=A[0]+(B[0]-A[0])*t,yy=A[1]+(B[1]-A[1])*t-y;pixSet(g,x,yy+1,joint);pixSet(g,x,yy+2,joint)}}}}
function merlons(g,top,n,ch,sz){sz=sz||32/n*0.5;const put=(P,Q)=>{for(let i=0;i<n;i++){const f=(i+0.25)/n;const a=[P[0]+(Q[0]-P[0])*f,P[1]+(Q[1]-P[1])*f];pixIsoBox(g,a[0],a[1]+sz*0.5,sz/32,sz/32,5,1,ch)}};put(top.L,top.Bm);put(top.Bm,top.Rr)}
const top=pixIsoBox(g,bx,by,W,H,Z,1,{left:'a',right:'b',top:'c'});
courses(g,top.base.L,top.base.Bm,Z,5,'d','d');courses(g,top.base.Bm,top.base.Rr,Z,5,'d','d');
// walkway line on top and merlons
pixLine(g,top.T[0],top.T[1]+2,top.Rr[0]-2,top.Rr[1]+1,'f');pixLine(g,top.T[0],top.T[1]+2,top.L[0]+2,top.L[1]+1,'f');
pixLine(g,top.L[0],top.L[1],top.Bm[0],top.Bm[1],'d');pixLine(g,top.Bm[0],top.Bm[1],top.Rr[0],top.Rr[1],'d');
merlons(g,top,2,{left:'a',right:'b',top:'c'},9);
export default {
  id:'wall',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:{a:'#9a9285',b:'#7d7468',c:'#a8a094',d:'#5e574f',e:'#2a2018',f:'#b8b0a3'},
  frames:{idle:[pixText(g)]},
};
