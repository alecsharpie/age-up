// @pixel wall
// Stone wall 1×1: an ashlar block with a plinth course and a crenellated parapet. 16 variants by neighbour mask
// (bit0 wall at +x, bit1 +y, bit2 −x, bit3 −y): a parapet, quoins and ink only where the segment is not joined, so a line of
// walls reads as one continuous wall-walk with both parapets, merlons on a steady half-tile rhythm, and caps at the ends.
// Sets p<mask> (1 frame, plain) and t<mask> (4 frames, a team shield and a flickering torch on each open face); the case
// body alternates them along the line. idle = t0 (a lone segment).
//@@KIT
const W=1,H=1,Z=18;
const GW=(W+H)*32+4, GH=(W+H)*16+Z+6+10;
const bx=W*32+2, by=GH-4;
const NB=[[32,16],[-32,16],[-32,-16],[32,-16]];   // screen offset of the neighbour for each mask bit
function segment(mask){
  const g=pixGrid(GW,GH);
  const nI=mask&1,nJ=mask&2,pI=mask&4,pJ=mask&8;
  const top=pixIsoBox(g,bx,by,W,H,Z,1,{left:'1',right:'2',top:'3'});
  ashlar(g,'1',top.base.L,top.base.Bm,LIT,{ch:5,bl:8,plinth:2,seed:2,qL:!pI,qR:!nI});
  ashlar(g,'2',top.base.Bm,top.base.Rr,SHD,{ch:5,bl:8,plinth:2,seed:3,qL:!nJ,qR:!pJ});
  flagstones(g,'3',top,{n:4});
  if(!nI&&!nJ)pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,'K');
  const front=crenels(g,top,W,H,{th:0.12,n:[2,2],ml:0.25,f0:0.125,lo:3,hi:7,skip:{TL:pI,TR:pJ,LB:nJ,BR:nI},tex:{L:[top.base.L,top.base.Bm],R:[top.base.Bm,top.base.Rr],seed:2}});front();
  // joints: cells a neighbour behind would cover are not edges
  const cover=pixGrid(GW,GH);for(let b=2;b<4;b++)if(mask&(1<<b))pixIsoBox(cover,bx+NB[b][0],by+NB[b][1],W,H,Z+7,1,{left:'#',right:'#',top:'#'});
  inkOutline(g,null,(x,y)=>pixGet(cover,x,y)==='#');
  return {g,top,open:{L:!nJ,R:!nI}};
}
const sets={};
for(let m=0;m<16;m++){
  const {g,top,open}=segment(m);
  sets['p'+m]=[pixText(g)];
  const fr=[];
  for(let k=0;k<4;k++){const f=cloneG(g);
    if(open.L){const p=lerpP(top.base.L,top.base.Bm,0.32);shield(f,Math.round(p[0])-3,Math.round(p[1])-14);const q=lerpP(top.base.L,top.base.Bm,0.66);const tx=Math.round(q[0]),ty=Math.round(q[1])-8;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,k)}
    if(open.R){const p=lerpP(top.base.Bm,top.base.Rr,0.62);shield(f,Math.round(p[0])-2,Math.round(p[1])-14);const q=lerpP(top.base.Bm,top.base.Rr,0.3);const tx=Math.round(q[0]),ty=Math.round(q[1])-8;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,(k+2)%4)}
    fr.push(pixText(f));}
  sets['t'+m]=fr;
}
sets.idle=sets.t0;
export default {
  id:'wall',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:FORT_PAL,
  frames:sets,
};
