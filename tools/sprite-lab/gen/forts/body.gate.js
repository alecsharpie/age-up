// @pixel gate
// Gate 1×1, one variant per age (AGE, AK from gen/ages/wrap.mjs; the gate stands from Feudal). The passage runs across the wall
// line, so there are two sets:
//   x — the wall runs along x (neighbours at ±x): the arch is on the +y (lit) face;
//   y — the wall runs along y (neighbours at ±y): the arch is on the +x (shaded) face.
// The wall-axis edges of the gatehouse have no parapet so the wall-walk runs straight through. idle = x. Frames: 4 per set.
//   Feudal   a timber gatehouse on stone footings: a rubble block as high as the Feudal wall with a round arch closed by
//            team-colour plank doors, and over it a jettied, close-studded timber gate room under a brown shingle hip roof with a
//            knob finial; a team banner hangs over the arch.
//   Castle   the original art, unchanged: an ashlar block a little taller than the curtain wall, a voussoir arch with a lowered
//            portcullis, a corbelled parapet, two tall square crenellated towers with team banners.
//   Imperial pale limestone, taller: a gilt string course, taller towers whose corbelled crowns carry steep slate spires with
//            gilt orb finials, gilt-fringed banners.
// The heights of the wall each age meets are in WALL_TOP (keep in step with body.wall.js).
//@@KIT
const W=1,H=1;
const {S:AS,W:AW,R:AR,Au}=AK;
const LS=AS.map(c=>AK.pal[c]);
const LIME={h:LS[0],q:LS[0],f:LS[1],a:LS[1],A:LS[2],m:LS[4],p:LS[3],H:LS[2],Q:LS[2],n:LS[3],b:LS[3],B:'#9c8d6c',M:LS[5],P:LS[5],
  c:LS[1],C:'#d8cbac',j:LS[3],S:LS[3],g:'#f6dca0',G:'#fbe8b8'};
const STONE=/[hqfaAmpHQnbBMP]/;
// per age: block height Z, tower height TZ (0 = no towers), the joining wall's height + parapet (cover), arch size
const F1={Z:21,TZ:0,wall:15+8,AW:11,AH:15,head:34};
const C=[F1,F1,{Z:24,TZ:54,wall:18+7,AW:11,AH:17,head:0},{Z:28,TZ:64,wall:22+9,AW:11,AH:19,head:22}][AGE];
const {Z,TZ}=C,TS=0.27;
const GW=(W+H)*32+8, GH=(W+H)*16+Math.max(TZ,Z)+8+10+C.head;
const bx=W*32+4, by=GH-4;   // 2 px of margin each side for the towers' oversailing crowns
// tile-local point (u along +x, v along +y; T corner = 0,0) to screen
const P=(u,v)=>[bx+32*(u-v),by-32+16*(u+v)];
/** Imperial banner: the kit banner with gilt hems down both sides and a gilt fringe along the foot. */
function giltBanner(g,x,y,w,h,ph,sl){
  banner(g,x,y,w,h,ph,{sl});
  const oy=c=>Math.floor((c+0.5)*sl);
  for(let c=0;c<w;c++){let last=-1;for(let r=1;r<=h+2;r++)if(/[TLD]/.test(pixGet(g,x+c,y+oy(c)+r)))last=r;
    if(last>0){pixSet(g,x+c,y+oy(c)+last,c%2?Au[1]:Au[0]);if(c===0||c===w-1)for(let r=2;r<last-1;r++)pixSet(g,x+c,y+oy(c)+r,c?Au[2]:Au[1])}}
  for(let c=-1;c<=w;c++)pixSet(g,x+c,y+oy(c),c<0?Au[2]:Au[1]);
}
/** A hip / pyramid roof on a box top (pixIsoBox result), apex `rise` px up, textured with the age's roof material (AK.roofXY);
 *  the back faces are hidden behind the front ones except at the very top. Returns the apex. */
function hipRoof(g,top,rise,ridge=0){
  const ap=pixIsoRoof(g,top,rise,1,{back:'!',left:'@',front:'$',right:'%'});
  const y0=Math.max(0,Math.floor(ap[1])),y1=Math.min(g.length-1,Math.ceil(top.Bm[1])+1),x0=Math.max(0,Math.floor(top.L[0])-1),x1=Math.min(g[0].length-1,Math.ceil(top.Rr[0])+1);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const c=g[y][x];
    if(c==='$')g[y][x]=AK.roofXY(x,y,0.5,0);else if(c==='%')g[y][x]=AK.roofXY(x,y,-0.5,1);
    else if(c==='@')g[y][x]=AK.roofXY(x,y,-0.5,2,{flip:true});else if(c==='!')g[y][x]=AK.roofXY(x,y,0.5,3,{flip:true})}
  // hip lines: a lit ridge down the front hip, an eave shadow line along the two front eaves
  pixLine(g,ap[0],ap[1],top.Bm[0],top.Bm[1],AR[0]);
  pixLine(g,top.L[0],top.L[1],top.Bm[0],top.Bm[1],AR[5]);pixLine(g,top.Bm[0],top.Bm[1],top.Rr[0],top.Rr[1],AR[6]);
  return ap;
}
function gatehouse(axis){
  const g=pixGrid(GW,GH);
  const imp=AGE===3,feu=AGE===1;
  // set y is the mirror of set x across the u=v diagonal
  const box=(u0,v0,u1,v1,z,ch,zb=0)=>{if(axis==='y')[u0,v0,u1,v1]=[v0,u0,v1,u1];const B=P(u1,v1);return pixIsoBox(g,B[0],B[1]-zb,u1-u0,v1-v0,z,1,ch)};
  // ---- the gatehouse block
  const top=box(0,0,1,1,Z,{left:'1',right:'2',top:'3'});
  if(feu){const L1={m:AS[5],h:AS[0],t:[AS[1],AS[2],AS[1]],q:AS[0],p:AS[2]},S1={m:AS[5],h:AS[2],t:[AS[3],AS[4],AS[3]],q:AS[2],p:AS[4]};
    ashlar(g,'1',top.base.L,top.base.Bm,L1,{ch:4,bl:6,plinth:3,seed:4,qL:false,qR:false});ashlar(g,'2',top.base.Bm,top.base.Rr,S1,{ch:4,bl:6,plinth:3,seed:5,qL:false,qR:false});
    flagstones(g,'3',top,{n:3,t1:AS[1],t2:AS[2],j:AS[3],seed:7});}
  else{ashlar(g,'1',top.base.L,top.base.Bm,LIT,{ch:5,bl:8,plinth:2,seed:2,qL:false,qR:false});
    ashlar(g,'2',top.base.Bm,top.base.Rr,SHD,{ch:5,bl:8,plinth:2,seed:3,qL:false,qR:false});
    flagstones(g,'3',top,{n:4});}
  pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,feu?AS[5]:'K');
  const lit=axis==='x',[A,B]=lit?[top.base.L,top.base.Bm]:[top.base.Bm,top.base.Rr],sl=lit?0.5:-0.5;
  if(imp)   // gilt string course under the parapet on both faces
    for(const [a,b,c1,c2] of [[top.base.L,top.base.Bm,Au[0],'m'],[top.base.Bm,top.base.Rr,Au[1],'M']])
      for(let x=Math.ceil(a[0]);x<=Math.floor(b[0]);x++){const y=Math.floor(a[1]+(x+0.5-a[0])*(b[1]-a[1])/(b[0]-a[0]))-Z+4;
        if(STONE.test(pixGet(g,x,y)))pixSet(g,x,y,c1);if(STONE.test(pixGet(g,x,y+1)))pixSet(g,x,y+1,c2)}
  const front=feu?()=>{}:crenels(g,top,W,H,{th:0.12,n:[2,2],ml:0.25,f0:0.25,lo:3,hi:imp?9:7,skip:lit?{TL:1,BR:1}:{LB:1,TR:1},tex:{L:[top.base.L,top.base.Bm],R:[top.base.Bm,top.base.Rr],seed:2}});
  // the arch, centred between the towers: a round arch with a dark passage behind a lowered iron portcullis (Feudal: team plank
  // doors), a lit reveal on the right, a ring of voussoirs with radial joints and a keystone, jamb stones down to a worn sill.
  // Every row follows the face's slope.
  const AW=C.AW,AH=C.AH,mid=lerpP(A,B,0.5),x0=Math.round(mid[0]-AW/2),y0=Math.round(A[1]+(x0+0.5-A[0])*sl)-2;
  const cx=(AW-1)/2,R=AW/2+0.5,Ro=R+2,SP=AH-R,yb=c=>y0+Math.floor((c+0.5)*sl);
  const hIn=c=>Math.abs(c-cx)<R?SP+Math.sqrt(R*R-(c-cx)**2):-1,hOut=c=>Math.abs(c-cx)<Ro?SP+Math.sqrt(Ro*Ro-(c-cx)**2):-1;
  const st=feu?(lit?{a:AS[0],b:AS[1],j:AS[5],d:'k'}:{a:AS[2],b:AS[3],j:AS[5],d:'k'}):lit?{a:'q',b:'h',j:'m',d:'k'}:{a:'Q',b:'H',j:'M',d:'k'};
  const door=(c,r,hi)=>{const top=r===hi-1;if(top)return 'k';if(c===Math.floor(cx)||c===Math.ceil(cx)&&AW%2===0)return 'D';   // the meeting stiles
    if(r===2||r===hi-4)return r===2?'i':'I';return c%3===0?'D':c%3===1?(lit?'L':'T'):'T'};
  for(let c=-2;c<=AW+1;c++){const hi=Math.floor(hIn(c)),ho=Math.round(hOut(c));
    if(c>=0&&c<AW)for(let r=0;r<hi;r++){const top=r===hi-1;
      pixSet(g,x0+c,yb(c)-r,feu?(c===AW-1&&!top?st.b:door(c,r,hi)):c===AW-1?(top?'k':st.b):top?'k':r===0?(c%3===1?'i':'e'):c%3===1?(r%2?'i':'I'):r%4===2?'i':'e')}
    const from=c>=0&&c<AW?hi:(c===-1||c===AW?0:Math.ceil(SP));
    for(let r=from;r<=ho;r++){const ang=Math.atan2(r-SP,c-cx),seg=Math.floor((ang+0.0001)/(Math.PI/7)),seg2=Math.floor((Math.atan2(r-SP,c+1-cx)+0.0001)/(Math.PI/7));
      const key=Math.abs(c-cx)<1&&r>=hi;pixSet(g,x0+c,yb(c)-r,r<SP?(r%4===3?st.j:st.a):key?(imp?Au[0]:st.a):seg!==seg2?st.j:r===ho?st.b:st.a)}
    if(ho>0)pixSet(g,x0+c,yb(c)-ho-1,st.j);}   // a dark joint outlines the ring against the ashlar
  for(const c of [-3,AW+2])for(let r=0;r<Math.ceil(SP);r++)pixSet(g,x0+c,yb(c)-r,st.j);
  for(let c=-1;c<=AW;c++)pixSet(g,x0+c,yb(c)+1,feu?(lit?AS[2]:AS[4]):lit?'p':'P');
  const preFront=cloneG(g);front();const postFront=cloneG(g),frontParapet=(x,y)=>preFront[y][x]!==postFront[y][x];
  const TW=[];let room=null;
  if(TZ){
  // ---- flanking towers at the two ends of the arch face. Their outer faces are flush with the block; the one inner face that
  // shows (beside the arch: the L tower's +x face in set x, the Rr tower's +y face in set y) is inside the block below the
  // wall-walk and behind the front parapet, so those cells are restored from what was there before.
  const under=cloneG(g),inner=[];
  for(const [u0,v0,u1,v1,side] of [[0,1-TS,TS,1,0],[1-TS,1-TS,1,1,1]]){
    const t=box(u0,v0,u1,v1,TZ,{left:'4',right:'5',top:'6'});
    const innerCh=side?null:lit?'5':'4';
    if(innerCh){const [IA,IB]=innerCh==='4'?[t.base.L,t.base.Bm]:[t.base.Bm,t.base.Rr],isl=(IB[1]-IA[1])/(IB[0]-IA[0]);
      for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(g[y][x]===innerCh)inner.push([x,y,IA[1]+(x+0.5-IA[0])*isl-(y+0.5)])}
    ashlar(g,'4',t.base.L,t.base.Bm,LIT,{ch:5,bl:6,plinth:2,seed:6+side});ashlar(g,'5',t.base.Bm,t.base.Rr,SHD,{ch:5,bl:6,plinth:2,seed:8+side});
    flagstones(g,'6',t,{n:2});
    pixLine(g,t.base.Bm[0],t.base.Bm[1]-1,t.Bm[0],t.Bm[1]+1,'K');
    const SC=Z+4;   // string course just above the wall-walk
    pixLine(g,t.base.L[0],t.base.L[1]-SC,t.base.Bm[0],t.base.Bm[1]-SC,imp?Au[0]:'q');pixLine(g,t.base.L[0],t.base.L[1]-SC+1,t.base.Bm[0],t.base.Bm[1]-SC+1,'m');
    pixLine(g,t.base.Bm[0],t.base.Bm[1]-SC,t.base.Rr[0],t.base.Rr[1]-SC,imp?Au[1]:'Q');pixLine(g,t.base.Bm[0],t.base.Bm[1]-SC+1,t.base.Rr[0],t.base.Rr[1]-SC+1,'M');
    if(imp)for(const f of [0.5]){const p=lerpP(t.base.L,t.base.Bm,f),q=lerpP(t.base.Bm,t.base.Rr,f);
      slit(g,Math.round(p[0])-1,Math.round(p[1])-TZ+14,5,true);slit(g,Math.round(q[0])-1,Math.round(q[1])-TZ+14,5,true)}
    // crown: a corbelled band that oversails the shaft, then a low parapet with a merlon on each corner (back one first, front
    // last); Imperial: a steep slate spire on the band instead of the parapet, with a gilt orb finial
    const CE=0.05,CW=TS+2*CE,CZ=6,cr=box(u0-CE,v0-CE,u1+CE,v1+CE,CZ,{left:'7',right:'8',top:'6'},TZ-CZ);
    flagstones(g,'6',cr,{n:2});
    pixLine(g,cr.base.L[0],cr.base.L[1]+1,cr.base.Bm[0],cr.base.Bm[1]+1,'k');pixLine(g,cr.base.Bm[0],cr.base.Bm[1]+1,cr.base.Rr[0],cr.base.Rr[1]+1,'k');
    for(const [a,b,c] of [[cr.base.L,cr.base.Bm,'m'],[cr.base.Bm,cr.base.Rr,'M']])for(let x=Math.ceil(a[0])+1;x<b[0]-1;x+=3){const y=Math.round(a[1]+(x+0.5-a[0])*(b[1]-a[1])/(b[0]-a[0]));pixSet(g,x,y+2,c)}
    if(imp){ashlar(g,'7',cr.base.L,cr.base.Bm,LIT,{ch:4,bl:6,seed:6,qL:false,qR:false,any:true});ashlar(g,'8',cr.base.Bm,cr.base.Rr,SHD,{ch:4,bl:6,seed:7,qL:false,qR:false,any:true});
      pixLine(g,cr.L[0],cr.L[1],cr.Bm[0],cr.Bm[1],Au[0]);pixLine(g,cr.Bm[0],cr.Bm[1],cr.Rr[0],cr.Rr[1],Au[1]);
      const ap=hipRoof(g,cr,22);AK.finial(g,Math.round(ap[0]),Math.round(ap[1])-1);
    }else{
    const cap=crenels(g,cr,CW,CW,{th:0.14,n:[0,0],lo:3,hi:3,chs:{left:'7',right:'8',top:'h'}});
    const m=0.12,corner=(du,dv)=>{const u=du*(CW-m)+m,v=dv*(CW-m)+m;pixIsoBox(g,cr.T[0]+32*(u-v),cr.T[1]+16*(u+v),m,m,8,1,{left:'7',right:'8',top:'h'})};
    corner(0,0);corner(0,1);corner(1,0);cap();corner(1,1);
    ashlar(g,'7',cr.base.L,cr.base.Bm,LIT,{ch:4,bl:6,seed:6,qL:false,qR:false,any:true});ashlar(g,'8',cr.base.Bm,cr.base.Rr,SHD,{ch:4,bl:6,seed:7,qL:false,qR:false,any:true});
    }
    TW.push(t);
  }
  for(const [x,y,z] of inner)if(z<Z||frontParapet(x,y))g[y][x]=under[y][x];
  for(const [x,y,z] of inner)if(z>=Z&&!frontParapet(x,y)&&inner.some(([x2,y2,z2])=>x2===x&&y2===y+1&&z2<Z)&&!frontParapet(x,y+1))g[y][x]=lit?'M':'P';   // seam where it rises out of the walk
  }else{
    // ---- Feudal: a jettied timber gate room over the passage, under a shingle hip roof. It sits back from the wall-axis edges so
    // the wall-walk runs into its doors, and oversails the arch faces by a joist's depth.
    const RZ=15,i0=0.2,o=0.03;
    const rm=box(i0,-o,1-i0,1+o,RZ,{left:'4',right:'5',top:'6'},Z);
    const rA=lit?rm.base.L:rm.base.Bm,rB=lit?rm.base.Bm:rm.base.Rr,len=Math.round(rB[0]-rA[0]);
    for(const [ch,a,b,face] of [['4',rm.base.L,rm.base.Bm,0],['5',rm.base.Bm,rm.base.Rr,1]]){const s2=(b[1]-a[1])/(b[0]-a[0]),L=Math.round(b[0]-a[0]);
      for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){if(g[y][x]!==ch)continue;const u=x-a[0],h=Math.floor(a[1]+(x+0.5-a[0])*s2-(y+0.5));
        g[y][x]=AK.wallTex(u,h,face,{len:L,H:RZ,pl:0,step:L>40?9:7})}}
    // joist ends under the jetty
    for(const [a,b,c] of [[rm.base.L,rm.base.Bm,AW[2]],[rm.base.Bm,rm.base.Rr,AW[2]]])for(let x=Math.ceil(a[0]);x<=Math.floor(b[0]);x++){const y=Math.round(a[1]+(x+0.5-a[0])*(b[1]-a[1])/(b[0]-a[0]));
      pixSet(g,x,y+1,x%3===0?AW[0]:c)}
    // a shuttered window over the arch face
    const wm=lerpP(rA,rB,0.5);AK.windowAt(g,Math.round(wm[0]),Math.round(wm[1])-8,sl,lit?0:1);
    // the roof's eaves oversail the room by a couple of px all round
    const ev=box(i0-0.05,-o-0.04,1-i0+0.05,1+o+0.04,0,{},Z+RZ),evTop={T:ev.base.T,L:ev.base.L,Bm:ev.base.Bm,Rr:ev.base.Rr};
    const ap=hipRoof(g,evTop,20);
    AK.finial(g,Math.round(ap[0]),Math.round(ap[1])-1);
    room=rm;
  }
  // joints: the wall segment behind (−x in set x, −y in set y) covers this edge up to its parapet, so no ink there
  const cover=pixGrid(GW,GH);pixIsoBox(cover,bx+(lit?-32:32),by-16,1,1,C.wall,1,{left:'#',right:'#',top:'#'});
  inkOutline(g,null,(x,y)=>pixGet(cover,x,y)==='#');
  const frames=[];
  for(let k=0;k<4;k++){const f=cloneG(g);
    TW.forEach((t,i)=>{const [a,b]=lit?[t.base.L,t.base.Bm]:[t.base.Bm,t.base.Rr],p=lerpP(a,b,0.5);
      if(imp)giltBanner(f,Math.round(p[0])-3,Math.round(p[1])-TZ+24,6,18,k+i*2,sl);else banner(f,Math.round(p[0])-3,Math.round(p[1])-TZ+10,6,16,k+i*2,{sl})});
    if(room){const [a,b]=lit?[room.base.L,room.base.Bm]:[room.base.Bm,room.base.Rr];
      const [c,d]=lit?[top.base.L,top.base.Bm]:[top.base.Bm,top.base.Rr];
      for(const [fr,ph] of [[0.15,0],[0.85,2]]){const p=lerpP(c,d,fr);banner(f,Math.round(p[0])-2,Math.round(p[1])-Z+1,5,11,k+ph,{sl,charge:false})}}
    frames.push(pixText(f));}
  return frames;
}
const sets={x:gatehouse('x'),y:gatehouse('y')};
sets.idle=sets.x;
export default {
  id:'gate',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:AGE===3?{...FORT_PAL,...AK.pal,...LIME}:{...FORT_PAL,...AK.pal},
  frames:sets,
};
