// @pixel wall
// Wall 1×1, one variant per age (AGE, AK from gen/ages/wrap.mjs). 16 variants by neighbour mask (bit0 wall at +x, bit1 +y,
// bit2 −x, bit3 −y): parapets, quoins and ink only where the segment is not joined, so a line of walls reads as one continuous
// wall and caps its ends. Sets p<mask> (1 frame, plain) and t<mask> (4 frames, with the age's team cloth and fire); the case
// body alternates them along the line. idle = t0 (a lone segment).
//   Dark     a low dyke of rough fieldstones under a turf cap, topped by a stockade of sharpened stakes on the centre line;
//            t: a team rag tied to the stakes and a team pennant on a tall pole.
//   Feudal   a plain grey rubble-stone wall with a plank walkway and a timber breastwork (boards between taller posts, no
//            crenels); t: a team cloth hung over the breastwork and a torch.
//   Castle   the dressed-stone curtain with a crenellated parapet (the original art, unchanged); t: shields and torches.
//   Imperial taller pale limestone, a gilt string course under taller merlons; t: gilt-fringed team banners and torches.
// Walls and gates of one player share an age; the gate draft (body.gate.js) knows these heights (WALL_TOP there).
//@@KIT
const W=1,H=1;
const NB=[[32,16],[-32,16],[-32,-16],[32,-16]];   // screen offset of the neighbour for each mask bit
const {S:AS,W:AW,Au}=AK;
// ---------------------------------------------------------------- Castle (original) and Imperial: crenellated ashlar
// Imperial re-uses the castle segment with limestone tones (the stone chars re-coloured from AK.S), taller walls and merlons.
const LS=AS.map(c=>AK.pal[c]);
const LIME={h:LS[0],q:LS[0],f:LS[1],a:LS[1],A:LS[2],m:LS[4],p:LS[3],H:LS[2],Q:LS[2],n:LS[3],b:LS[3],B:'#9c8d6c',M:LS[5],P:LS[5],
  c:LS[1],C:'#d8cbac',j:LS[3],S:LS[3],g:'#f6dca0',G:'#fbe8b8'};
const STONE=/[hqfaAmpHQnbBMP]/;
function crenWall(Z,lo,hi,gilt){
  const GW=(W+H)*32+4, GH=(W+H)*16+Z+6+10;
  const bx=W*32+2, by=GH-4;
  function segment(mask){
    const g=pixGrid(GW,GH);
    const nI=mask&1,nJ=mask&2,pI=mask&4,pJ=mask&8;
    const top=pixIsoBox(g,bx,by,W,H,Z,1,{left:'1',right:'2',top:'3'});
    ashlar(g,'1',top.base.L,top.base.Bm,LIT,{ch:5,bl:8,plinth:2,seed:2,qL:!pI,qR:!nI});
    ashlar(g,'2',top.base.Bm,top.base.Rr,SHD,{ch:5,bl:8,plinth:2,seed:3,qL:!nJ,qR:!pJ});
    flagstones(g,'3',top,{n:4});
    if(!nI&&!nJ)pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,'K');
    if(gilt)   // a gilt string course with a dark undercut, under the wall-walk on both outer faces
      for(const [A,B,c1,c2] of [[top.base.L,top.base.Bm,Au[0],'m'],[top.base.Bm,top.base.Rr,Au[1],'M']])
        for(let x=Math.ceil(A[0]);x<=Math.floor(B[0]);x++){const y=Math.floor(A[1]+(x+0.5-A[0])*(B[1]-A[1])/(B[0]-A[0]))-Z+4;
          if(STONE.test(pixGet(g,x,y)))pixSet(g,x,y,c1);if(STONE.test(pixGet(g,x,y+1)))pixSet(g,x,y+1,c2)}
    const front=crenels(g,top,W,H,{th:0.12,n:[2,2],ml:0.25,f0:0.125,lo,hi,skip:{TL:pI,TR:pJ,LB:nJ,BR:nI},tex:{L:[top.base.L,top.base.Bm],R:[top.base.Bm,top.base.Rr],seed:2}});front();
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
      if(!gilt){
        if(open.L){const p=lerpP(top.base.L,top.base.Bm,0.32);shield(f,Math.round(p[0])-3,Math.round(p[1])-14);const q=lerpP(top.base.L,top.base.Bm,0.66);const tx=Math.round(q[0]),ty=Math.round(q[1])-8;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,k)}
        if(open.R){const p=lerpP(top.base.Bm,top.base.Rr,0.62);shield(f,Math.round(p[0])-2,Math.round(p[1])-14);const q=lerpP(top.base.Bm,top.base.Rr,0.3);const tx=Math.round(q[0]),ty=Math.round(q[1])-8;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,(k+2)%4)}
      }else{   // Imperial: a gilt-fringed banner hung from the string course, a torch in an iron bracket
        if(open.L){const p=lerpP(top.base.L,top.base.Bm,0.3);giltBanner(f,Math.round(p[0])-3,Math.round(p[1])-Z+5,6,12,k,0.5);const q=lerpP(top.base.L,top.base.Bm,0.68);const tx=Math.round(q[0]),ty=Math.round(q[1])-9;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,k)}
        if(open.R){const p=lerpP(top.base.Bm,top.base.Rr,0.62);giltBanner(f,Math.round(p[0])-2,Math.round(p[1])-Z+5,6,12,k+2,-0.5);const q=lerpP(top.base.Bm,top.base.Rr,0.3);const tx=Math.round(q[0]),ty=Math.round(q[1])-9;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,(k+2)%4)}
      }
      fr.push(pixText(f));}
    sets['t'+m]=fr;
  }
  sets.idle=sets.t0;
  return {anchor:[bx,by],palette:gilt?{...FORT_PAL,...AK.pal,...LIME}:{...FORT_PAL,...AK.pal},frames:sets};
}
/** Imperial banner: the kit banner with gilt hems down both sides and a gilt fringe along the foot. */
function giltBanner(g,x,y,w,h,ph,sl){
  banner(g,x,y,w,h,ph,{sl});
  const oy=c=>Math.floor((c+0.5)*sl);
  for(let c=0;c<w;c++){let last=-1;for(let r=1;r<=h+2;r++)if(/[TLD]/.test(pixGet(g,x+c,y+oy(c)+r)))last=r;
    if(last>0){pixSet(g,x+c,y+oy(c)+last,c%2?Au[1]:Au[0]);if(c===0||c===w-1)for(let r=2;r<last-1;r++)pixSet(g,x+c,y+oy(c)+r,c?Au[2]:Au[1])}}
  for(let c=-1;c<=w;c++)pixSet(g,x+c,y+oy(c),c<0?Au[2]:Au[1]);
}
// ---------------------------------------------------------------- Dark: fieldstone dyke and a stockade of stakes
// tile-local (u along +x, v along +y; T corner = 0,0) to screen, for a grid whose bottom corner is (bx,by)
const tileP=(bx,by,u,v)=>[bx+32*(u-v),by-32+16*(u+v)];
/** Rough fieldstones on a face (cells == tmp) over base edge A→B: rounded stones of uneven length in uneven courses, a lit crown
 *  on each stone, dark gaps between; tones from AK.S (lit face S0–S2, shaded S2–S4). */
function fieldstone(g,tmp,A,B,lit,seed){
  const sl=(B[1]-A[1])/(B[0]-A[0]),T=lit?[AS[0],AS[1],AS[2]]:[AS[2],AS[3],AS[4]],J=AS[5];
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){if(g[y][x]!==tmp)continue;
    const u=Math.floor(x+0.5-A[0]),h=Math.max(0,Math.floor(A[1]+(x+0.5-A[0])*sl-(y+0.5)));
    const c=h<4?0:h<7?1:2,c0=[0,4,7][c],ch=[4,3,4][c],r=h-c0;
    // stones along the course: lengths 3–7 from a hash chain so a run of segments lines up
    const off=Math.floor(hash3(c,seed,3)*5);let s=0,k=0,len=0;for(;;){len=3+Math.floor(hash3(k,c,seed)*5);if(u+off<s+len)break;s+=len;k++}
    const j=u+off-s;
    if(j===0||(r===ch-1&&(j===1||j===len-1))){g[y][x]=J;continue}          // gap and rounded shoulders
    if(r===ch-1&&c<2){g[y][x]=J;continue}
    const tone=Math.floor(hash3(k,c,seed+1)*3);
    g[y][x]=r===ch-2||(r===ch-3&&j===1&&lit)?T[Math.max(0,tone-1)]:T[tone];
  }
}
/** Turf on the dyke's top: dark earth with tufts of grass. */
function turf(g,tmp,seed){for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){if(g[y][x]!==tmp)continue;
  const t=hash3(x>>1,y>>1,seed);g[y][x]=t<0.22?'U':t<0.8?'V':t<0.95?'d':'l'}}
/** A sharpened stake at screen (x,y) foot, h tall, 3 px wide: lit / mid / dark columns, a pale cut point, a lashing row. */
function stake(g,x,y,h,lit,lash){
  const cols=lit?[AW[0],AW[0],AW[1]]:[AW[0],AW[1],AW[2]];
  for(let c=0;c<3;c++)for(let r=0;r<h-(c===1?0:c===0?1:2);r++)pixSet(g,x+c,y-r,r===lash?AW[2]:r>=h-3&&c<2?'E':cols[c]);
  pixSet(g,x+1,y-h+1,'E');
}
/** Stake positions of a segment: centre-line runs toward each joined side; a lone or one-ended segment runs straight through. */
function stakeRuns(mask){
  const nI=mask&1,nJ=mask&2,pI=mask&4,pJ=mask&8,X=nI||pI,Y=nJ||pJ,out=[];
  const run=(a0,a1,f)=>{for(let i=0;i<8;i++){const a=(i+0.5)/8;if(a>=a0&&a<=a1)out.push(f(a))}};
  if(X||!Y)run(pI?0:Y?0.5:0.1,nI?1:Y?0.5:0.9,a=>[a,0.5,'x']);
  if(Y)run(pJ?0:X?0.5:0.1,nJ?1:X?0.5:0.9,a=>[0.5,a,'y']);
  if(X&&Y)out.push([0.5,0.5,'c']);
  return out.sort((p,q)=>(p[0]+p[1])-(q[0]+q[1]));
}
function dark(){
  const Z=10,SH=13,GW=(W+H)*32+4,GH=(W+H)*16+Z+SH+24;
  const bx=W*32+2,by=GH-4,D0=0.27,D1=0.73,E=0.06;   // the dyke runs down the middle of the tile, half a tile wide
  const drawStakes=(g,ox,oy,runs)=>{for(const [u,v,ax] of runs){const p=tileP(bx+ox,by+oy,u,v),hh=SH+Math.floor(hash3(Math.round(u*16),Math.round(v*16),4)*3);
    stake(g,Math.round(p[0])-1,Math.round(p[1])-Z+1,hh,ax!=='y',5)}};
  /** the dyke as boxes [u0,v0,u1,v1], back to front: a centre block and an arm toward each joined side (or the ends of a lone run) */
  const pieces=mask=>{const nI=mask&1,nJ=mask&2,pI=mask&4,pJ=mask&8,X=nI||pI,Y=nJ||pJ,out=[[D0,D0,D1,D1]];
    if(pI||(!X&&!Y)||(nI&&!Y))out.push([pI?0:E,D0,D0,D1]);if(pJ||(nJ&&!X))out.push([D0,pJ?0:E,D1,D0]);
    if(nI||(!X&&!Y)||(pI&&!Y))out.push([D1,D0,nI?1:1-E,D1]);if(nJ||(pJ&&!X))out.push([D0,D1,D1,nJ?1:1-E]);
    return out.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]))};
  const dyke=(g,ox,oy,mask,ch)=>pieces(mask).map(([u0,v0,u1,v1])=>{const B=tileP(bx+ox,by+oy,u1,v1);return pixIsoBox(g,B[0],B[1],u1-u0,v1-v0,Z,1,ch)});
  function segment(mask){
    const g=pixGrid(GW,GH);
    const nI=mask&1,nJ=mask&2;
    const tops=dyke(g,0,0,mask,{left:'1',right:'2',top:'3'});
    // fieldstone faces: every lit face lies on the plane v=D1, every shaded face on u=D1, so texture them in one pass each
    fieldstone(g,'1',tileP(bx,by,0,D1),tileP(bx,by,1,D1),true,2);fieldstone(g,'2',tileP(bx,by,D1,1),tileP(bx,by,D1,0),false,3);
    turf(g,'3',5);
    // the turf cap spills a ragged lip over the top course of the open faces
    for(let y=1;y<GH;y++)for(let x=0;x<GW;x++){const c=g[y][x];if(c!==AS[0]&&c!==AS[1]&&c!==AS[2]&&c!==AS[3]&&c!==AS[4]&&c!==AS[5])continue;
      const up=g[y-1][x];if(/[UVdl]/.test(up)&&hash3(x,y,9)<0.55)g[y][x]=hash3(x,2,9)<0.5?'V':'d'}
    const runs=stakeRuns(mask);
    // the stakes' shadow falls back-right onto the turf
    for(const [u,v] of runs){const p=tileP(bx,by,u,v);for(let d=1;d<=3;d++){const x=Math.round(p[0])+1+d,y=Math.round(p[1])-Z;if(/[UVdl]/.test(pixGet(g,x,y)))pixSet(g,x,y,'l');if(d<3&&/[UVdl]/.test(pixGet(g,x,y-1)))pixSet(g,x,y-1,'d')}}
    drawStakes(g,0,0,runs);
    // joints: the neighbour behind covers this edge (its dyke and its stakes)
    const cover=pixGrid(GW,GH);
    for(let b=2;b<4;b++)if(mask&(1<<b)){const nm=b===2?5:10;dyke(cover,NB[b][0],NB[b][1],nm,{left:'#',right:'#',top:'#'});drawStakes(cover,NB[b][0],NB[b][1],stakeRuns(nm))}
    inkOutline(g,null,(x,y)=>pixGet(cover,x,y)!=='.');
    return {g,runs,open:{L:!nJ,R:!nI}};
  }
  const sets={};
  for(let m=0;m<16;m++){
    const {g,runs,open}=segment(m);
    sets['p'+m]=[pixText(g)];
    const fr=[];
    // the pennant pole stands at the middle stake; a rag is tied across the stakes on an open face
    const mid=runs[Math.floor(runs.length/2)],mp=tileP(bx,by,mid[0],mid[1]);
    for(let k=0;k<4;k++){const f=cloneG(g);
      if(open.L||open.R){const lit=open.L&&runs.some(r=>r[2]==='x'),ax=lit?'x':'y';const st=runs.filter(r=>r[2]===ax);
        if(st.length>=3){const s=st[Math.max(0,Math.floor(st.length/2)-2)],p=tileP(bx,by,s[0],s[1]);rag(f,Math.round(p[0])-1,Math.round(p[1])-Z-8,lit?0.5:-0.5,k)}}
      const px=Math.round(mp[0])+1,py=Math.round(mp[1])-Z-2;
      flagpole(f,px,py,SH+11,k,{w:8,fh:5});pixSet(f,px,py-SH-11,AW[0]);pixSet(f,px,py-SH-12,'k');
      fr.push(pixText(f));}
    sets['t'+m]=fr;
  }
  sets.idle=sets.t0;
  return {anchor:[bx,by],palette:{...FORT_PAL,...AK.pal,U:'#7a9a44',V:'#5c7a30',d:'#4a5e26',l:'#3e3a24',E:'#d9b98a'},frames:sets};
}
/** A team rag knotted across the stakes on a face of slope sl: 7 wide, ragged foot that sways with frame k. */
function rag(g,x,y,sl,k){
  for(let c=0;c<7;c++){const oy=Math.floor((c+0.5)*sl),len=4+((c*3+k)%3===0?1:0)+(c===3?1:0);
    for(let r=0;r<len;r++)pixSet(g,x+c,y+oy+r,r===0?AW[2]:r===len-1||c===6?'D':c===0?'L':(c+r+k)%5===0?'D':'T')}
}
// ---------------------------------------------------------------- Feudal: rubble wall with a timber breastwork
function feudal(){
  const Z=15,BH=5,PH=8,GW=(W+H)*32+4,GH=(W+H)*16+Z+PH+14;
  const bx=W*32+2,by=GH-4;
  const LIT1={m:AS[5],h:AS[0],t:[AS[1],AS[2],AS[1]],q:AS[0],p:AS[2]},SHD1={m:AS[5],h:AS[2],t:[AS[3],AS[4],AS[3]],q:AS[2],p:AS[4]};
  /** a timber breastwork along one edge of the top (edges as in the kit's parapet): boards '7'/'8', posts '5'/'6' standing taller. */
  function breast(g,top,edge,th){
    const base=edge==='LB'||edge==='BR'?top.Bm:edge==='TL'?[top.L[0]+32*th,top.L[1]+16*th]:[top.Rr[0]-32*th,top.Rr[1]+16*th];
    const box=(f,len,z,ch)=>{if(edge==='LB'||edge==='TR'){const B=[base[0]-f*32,base[1]-f*16];return pixIsoBox(g,B[0],B[1],len,th,z,1,ch)}
      const B=[base[0]+f*32,base[1]-f*16];return pixIsoBox(g,B[0],B[1],th,len,z,1,ch)};
    box(0,1,BH,{left:'7',right:'8',top:'9'});
    for(const f of [0.03,0.53])box(f,0.07,PH,{left:'5',right:'6',top:'9'});
  }
  function segment(mask){
    const g=pixGrid(GW,GH);
    const nI=mask&1,nJ=mask&2,pI=mask&4,pJ=mask&8;
    const top=pixIsoBox(g,bx,by,W,H,Z,1,{left:'1',right:'2',top:'3'});
    ashlar(g,'1',top.base.L,top.base.Bm,LIT1,{ch:4,bl:6,plinth:3,seed:4,qL:!pI,qR:!nI});
    ashlar(g,'2',top.base.Bm,top.base.Rr,SHD1,{ch:4,bl:6,plinth:3,seed:5,qL:!nJ,qR:!pJ});
    flagstones(g,'3',top,{n:3,t1:AS[1],t2:AS[2],j:AS[3],seed:7});
    if(!nI&&!nJ)pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,AS[5]);
    const th=0.1;
    if(!pI)breast(g,top,'TL',th);if(!pJ)breast(g,top,'TR',th);
    if(!nJ)breast(g,top,'LB',th);if(!nI)breast(g,top,'BR',th);
    // boards: vertical planks with a dark seam every 3 px; posts darker; the breastwork's top shows the board ends
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const c=g[y][x];
      if(c==='7')g[y][x]=x%3===0?AW[2]:x%3===1?'w':'v';
      else if(c==='8')g[y][x]=x%3===0?'y':x%3===1?'v':AW[1];
      else if(c==='5')g[y][x]=AW[1];else if(c==='6')g[y][x]=AW[2];else if(c==='9')g[y][x]='E'}
    const cover=pixGrid(GW,GH);for(let b=2;b<4;b++)if(mask&(1<<b))pixIsoBox(cover,bx+NB[b][0],by+NB[b][1],W,H,Z+PH,1,{left:'#',right:'#',top:'#'});
    inkOutline(g,null,(x,y)=>pixGet(cover,x,y)==='#');
    return {g,top,open:{L:!nJ,R:!nI}};
  }
  const sets={};
  for(let m=0;m<16;m++){
    const {g,top,open}=segment(m);
    sets['p'+m]=[pixText(g)];
    const fr=[];
    for(let k=0;k<4;k++){const f=cloneG(g);
      if(open.L){const p=lerpP(top.base.L,top.base.Bm,0.3);banner(f,Math.round(p[0])-3,Math.round(p[1])-Z-BH+2,6,9,k,{sl:0.5,charge:false});const q=lerpP(top.base.L,top.base.Bm,0.7);const tx=Math.round(q[0]),ty=Math.round(q[1])-7;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,k)}
      if(open.R){const p=lerpP(top.base.Bm,top.base.Rr,0.62);banner(f,Math.round(p[0])-2,Math.round(p[1])-Z-BH+2,6,9,k+2,{sl:-0.5,charge:false});const q=lerpP(top.base.Bm,top.base.Rr,0.3);const tx=Math.round(q[0]),ty=Math.round(q[1])-7;glow(f,tx,ty-4,k%2?3:4);torch(f,tx,ty,(k+2)%4)}
      fr.push(pixText(f));}
    sets['t'+m]=fr;
  }
  sets.idle=sets.t0;
  return {anchor:[bx,by],palette:{...FORT_PAL,...AK.pal,E:'#c09a62'},frames:sets};
}
const V=AGE===0?dark():AGE===1?feudal():AGE===2?crenWall(18,3,7,false):crenWall(22,3,9,true);
export default {
  id:'wall',kind:'building',footprint:[W,H],anchor:V.anchor,
  palette:V.palette,
  frames:V.frames,
};
