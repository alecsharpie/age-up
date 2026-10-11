// @pixel gate
// Gate 1×1: a gatehouse that reads as a gate from across the map. An ashlar block a little taller than the curtain wall, with one
// big voussoir arch, a lowered iron portcullis and a corbelled parapet over it, flanked by two tall square towers (string course,
// cross slit, merlon caps) that rise well above the wall-walk, with a team banner high on each tower's arch-side face. The passage
// runs across the wall line, so there are two sets:
//   x — the wall runs along x (neighbours at ±x): the arch is on the +y (lit) face, towers at the L and Bm corners;
//   y — the wall runs along y (neighbours at ±y): the arch is on the +x (shaded) face, towers at the Rr and Bm corners.
// The wall-axis edges of the gatehouse have no parapet so the wall-walk runs straight through. idle = x.
// Frames: 4 per set — the banners ripple.
//@@KIT
const W=1,H=1,Z=24,TZ=54,TS=0.27;
const GW=(W+H)*32+8, GH=(W+H)*16+TZ+8+10;
const bx=W*32+4, by=GH-4;   // 2 px of margin each side for the towers' oversailing crowns
// tile-local point (u along +x, v along +y; T corner = 0,0) to screen
const P=(u,v)=>[bx+32*(u-v),by-32+16*(u+v)];
function gatehouse(axis){
  const g=pixGrid(GW,GH);
  // set y is the mirror of set x across the u=v diagonal
  const box=(u0,v0,u1,v1,z,ch,zb=0)=>{if(axis==='y')[u0,v0,u1,v1]=[v0,u0,v1,u1];const B=P(u1,v1);return pixIsoBox(g,B[0],B[1]-zb,u1-u0,v1-v0,z,1,ch)};
  // ---- the gatehouse block
  const top=box(0,0,1,1,Z,{left:'1',right:'2',top:'3'});
  ashlar(g,'1',top.base.L,top.base.Bm,LIT,{ch:5,bl:8,plinth:2,seed:2,qL:false,qR:false});
  ashlar(g,'2',top.base.Bm,top.base.Rr,SHD,{ch:5,bl:8,plinth:2,seed:3,qL:false,qR:false});
  flagstones(g,'3',top,{n:4});
  pixLine(g,top.base.Bm[0],top.base.Bm[1]-1,top.Bm[0],top.Bm[1]+1,'K');
  const lit=axis==='x',[A,B]=lit?[top.base.L,top.base.Bm]:[top.base.Bm,top.base.Rr],[TA,TB]=lit?[top.L,top.Bm]:[top.Bm,top.Rr],sl=lit?0.5:-0.5;
  const front=crenels(g,top,W,H,{th:0.12,n:[2,2],ml:0.25,f0:0.25,lo:3,hi:7,skip:lit?{TL:1,BR:1}:{LB:1,TR:1},tex:{L:[top.base.L,top.base.Bm],R:[top.base.Bm,top.base.Rr],seed:2}});
  // the arch, centred between the towers: dark passage, iron portcullis, voussoirs with a keystone, a worn sill
  const AW=11,AH=17,mid=lerpP(A,B,0.5),x0=Math.round(mid[0]-AW/2),y0=Math.round(A[1]+(x0+0.5-A[0])*sl)-2;
  // a round arch: dark passage behind a lowered iron portcullis (spiked foot), a lit reveal on the right, a ring of voussoirs
  // with radial joints and a keystone, jamb stones down to a worn sill. Every row follows the face's slope.
  const cx=(AW-1)/2,R=AW/2+0.5,Ro=R+2,SP=AH-R,yb=c=>y0+Math.floor((c+0.5)*sl);
  const hIn=c=>Math.abs(c-cx)<R?SP+Math.sqrt(R*R-(c-cx)**2):-1,hOut=c=>Math.abs(c-cx)<Ro?SP+Math.sqrt(Ro*Ro-(c-cx)**2):-1;
  const st=lit?{a:'q',b:'h',j:'m',d:'k'}:{a:'Q',b:'H',j:'M',d:'k'};
  for(let c=-2;c<=AW+1;c++){const hi=Math.floor(hIn(c)),ho=Math.round(hOut(c));
    if(c>=0&&c<AW)for(let r=0;r<hi;r++){const top=r===hi-1;
      pixSet(g,x0+c,yb(c)-r,c===AW-1?(top?'k':st.b):top?'k':r===0?(c%3===1?'i':'e'):c%3===1?(r%2?'i':'I'):r%4===2?'i':'e')}
    const from=c>=0&&c<AW?hi:(c===-1||c===AW?0:Math.ceil(SP));
    for(let r=from;r<=ho;r++){const ang=Math.atan2(r-SP,c-cx),seg=Math.floor((ang+0.0001)/(Math.PI/7)),seg2=Math.floor((Math.atan2(r-SP,c+1-cx)+0.0001)/(Math.PI/7));
      const key=Math.abs(c-cx)<1&&r>=hi;pixSet(g,x0+c,yb(c)-r,r<SP?(r%4===3?st.j:st.a):key?st.a:seg!==seg2?st.j:r===ho?st.b:st.a)}
    if(ho>0)pixSet(g,x0+c,yb(c)-ho-1,st.j);}   // a dark joint outlines the ring against the ashlar
  for(const c of [-3,AW+2])for(let r=0;r<Math.ceil(SP);r++)pixSet(g,x0+c,yb(c)-r,st.j);
  for(let c=-1;c<=AW;c++)pixSet(g,x0+c,yb(c)+1,lit?'p':'P');
  const preFront=cloneG(g);front();const postFront=cloneG(g),frontParapet=(x,y)=>preFront[y][x]!==postFront[y][x];
  // ---- flanking towers at the two ends of the arch face. Their outer faces are flush with the block; the one inner face that
  // shows (beside the arch: the L tower's +x face in set x, the Rr tower's +y face in set y) is inside the block below the
  // wall-walk and behind the front parapet, so those cells are restored from what was there before.
  const under=cloneG(g),inner=[],TW=[];
  for(const [u0,v0,u1,v1,side] of [[0,1-TS,TS,1,0],[1-TS,1-TS,1,1,1]]){
    const t=box(u0,v0,u1,v1,TZ,{left:'4',right:'5',top:'6'});
    const innerCh=side?null:lit?'5':'4';
    if(innerCh){const [IA,IB]=innerCh==='4'?[t.base.L,t.base.Bm]:[t.base.Bm,t.base.Rr],isl=(IB[1]-IA[1])/(IB[0]-IA[0]);
      for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(g[y][x]===innerCh)inner.push([x,y,IA[1]+(x+0.5-IA[0])*isl-(y+0.5)])}
    ashlar(g,'4',t.base.L,t.base.Bm,LIT,{ch:5,bl:6,plinth:2,seed:6+side});ashlar(g,'5',t.base.Bm,t.base.Rr,SHD,{ch:5,bl:6,plinth:2,seed:8+side});
    flagstones(g,'6',t,{n:2});
    pixLine(g,t.base.Bm[0],t.base.Bm[1]-1,t.Bm[0],t.Bm[1]+1,'K');
    const SC=Z+4;   // string course just above the wall-walk
    pixLine(g,t.base.L[0],t.base.L[1]-SC,t.base.Bm[0],t.base.Bm[1]-SC,'q');pixLine(g,t.base.L[0],t.base.L[1]-SC+1,t.base.Bm[0],t.base.Bm[1]-SC+1,'m');
    pixLine(g,t.base.Bm[0],t.base.Bm[1]-SC,t.base.Rr[0],t.base.Rr[1]-SC,'Q');pixLine(g,t.base.Bm[0],t.base.Bm[1]-SC+1,t.base.Rr[0],t.base.Rr[1]-SC+1,'M');
    // crown: a corbelled band that oversails the shaft, then a low parapet with a merlon on each corner (back one first, front last)
    const CE=0.05,CW=TS+2*CE,CZ=6,cr=box(u0-CE,v0-CE,u1+CE,v1+CE,CZ,{left:'7',right:'8',top:'6'},TZ-CZ);
    flagstones(g,'6',cr,{n:2});
    pixLine(g,cr.base.L[0],cr.base.L[1]+1,cr.base.Bm[0],cr.base.Bm[1]+1,'k');pixLine(g,cr.base.Bm[0],cr.base.Bm[1]+1,cr.base.Rr[0],cr.base.Rr[1]+1,'k');
    for(const [a,b,c] of [[cr.base.L,cr.base.Bm,'m'],[cr.base.Bm,cr.base.Rr,'M']])for(let x=Math.ceil(a[0])+1;x<b[0]-1;x+=3){const y=Math.round(a[1]+(x+0.5-a[0])*(b[1]-a[1])/(b[0]-a[0]));pixSet(g,x,y+2,c)}
    const cap=crenels(g,cr,CW,CW,{th:0.14,n:[0,0],lo:3,hi:3,chs:{left:'7',right:'8',top:'h'}});
    const m=0.12,corner=(du,dv)=>{const u=du*(CW-m)+m,v=dv*(CW-m)+m;pixIsoBox(g,cr.T[0]+32*(u-v),cr.T[1]+16*(u+v),m,m,8,1,{left:'7',right:'8',top:'h'})};
    corner(0,0);corner(0,1);corner(1,0);cap();corner(1,1);
    ashlar(g,'7',cr.base.L,cr.base.Bm,LIT,{ch:4,bl:6,seed:6,qL:false,qR:false,any:true});ashlar(g,'8',cr.base.Bm,cr.base.Rr,SHD,{ch:4,bl:6,seed:7,qL:false,qR:false,any:true});
    TW.push(t);
  }
  for(const [x,y,z] of inner)if(z<Z||frontParapet(x,y))g[y][x]=under[y][x];
  for(const [x,y,z] of inner)if(z>=Z&&!frontParapet(x,y)&&inner.some(([x2,y2,z2])=>x2===x&&y2===y+1&&z2<Z)&&!frontParapet(x,y+1))g[y][x]=lit?'M':'P';   // seam where it rises out of the walk
  // joints: the wall segment behind (−x in set x, −y in set y) covers this edge up to its merlons, so no ink there
  const cover=pixGrid(GW,GH);pixIsoBox(cover,bx+(lit?-32:32),by-16,1,1,18+7,1,{left:'#',right:'#',top:'#'});
  inkOutline(g,null,(x,y)=>pixGet(cover,x,y)==='#');
  const frames=[];
  for(let k=0;k<4;k++){const f=cloneG(g);
    TW.forEach((t,i)=>{const [a,b]=lit?[t.base.L,t.base.Bm]:[t.base.Bm,t.base.Rr],p=lerpP(a,b,0.5);banner(f,Math.round(p[0])-3,Math.round(p[1])-TZ+10,6,16,k+i*2,{sl})});
    frames.push(pixText(f));}
  return frames;
}
const sets={x:gatehouse('x'),y:gatehouse('y')};
sets.idle=sets.x;
export default {
  id:'gate',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:FORT_PAL,
  frames:sets,
};
