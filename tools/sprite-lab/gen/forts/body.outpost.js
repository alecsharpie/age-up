// @pixel outpost
// Outpost 1×1, one variant per age (AGE, AK = pixAgeKit(AGE) come from gen/ages/wrap.mjs):
//   Dark     a slim timber lookout — four log posts on stone pads, X-bracing, a ladder, a plank platform behind a boarded parapet
//            with team shields hung on it, a thatched roof on posts, a brazier on the deck, a torch and a banner below.
//   Feudal   the same lookout on squared stone footings, taller plank screens round the deck with team-shuttered lookout holes, a
//            higher brown oak shingle roof.
//   Castle   the posts rise from a dressed-stone pier with a door and an arrow slit; a stone parapet with merlons round the
//            deck; red clay tiles; the banner hangs on the pier.
//   Imperial a slim limestone lantern tower: a tall shaft with gilt string courses and an arched door, a balustraded stone gallery,
//            four stone piers framing the fire, a steep slate cap with gilt trim and an orb finial.
// Frames: idle 4 — a torch (or the lantern fire) flickers; a team banner ripples.
//@@KIT
const W=1,H=1,PZ=[36,38,38,46][AGE];
const GW=(W+H)*32+4, GH=(W+H)*16+PZ+18+10+[0,4,4,22][AGE];
const bx=W*32+2, by=GH-4;
const g=pixGrid(GW,GH);
const {R,Au,Fe,Gl}=AK;
const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),mix=(a,b,t)=>'#'+hex(a).map((v,i)=>Math.round(v+(hex(b)[i]-v)*t).toString(16).padStart(2,'0')).join('');
// stone chars of the fort kit recoloured with this age's AK stone (Castle keeps the fort kit's dressed grey ashlar)
const sp=i=>AK.pal[AK.S[i]];
const STONE=AGE===2||AGE===0?{}:{h:sp(0),q:sp(0),f:sp(1),a:mix(sp(1),sp(2),0.45),A:sp(2),m:mix(sp(4),sp(5),0.5),p:sp(3),
  H:mix(sp(2),sp(3),0.4),Q:sp(2),n:sp(3),b:mix(sp(3),sp(4),0.4),B:sp(4),M:sp(5),P:mix(sp(4),sp(5),0.5),c:sp(1),C:sp(2),j:sp(3),S:sp(3)};
// pyramid roof faces with the age kit's material: '6' back-left (face 2, flip), '7' back-right (3, flip), '8' front-left (0), '9' front-right (1)
function ageRoof(){const F={'6':[-0.5,2,1],'7':[0.5,3,1],'8':[0.5,0,0],'9':[-0.5,1,0]};
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){const f=F[g[y][x]];if(f)g[y][x]=AK.roofXY(x,y,f[0],f[1],{flip:!!f[2]})}}
const s=0.55, cy0=by-16;  // post square, tile centre
const base={L:[bx-s*32,cy0],Bm:[bx,cy0+s*16],Rr:[bx+s*32,cy0],T:[bx,cy0-s*16]};
// ground: trodden earth and stone pads under the posts (Feudal: squared footing blocks)
if(AGE===0)for(const P of [base.L,base.Rr,base.Bm])pixStamp(g,Math.round(P[0])-2,Math.round(P[1])-1,`
.hhh.
pappP
.PPP.
`);
if(AGE===1)for(const P of [base.L,base.Rr,base.Bm])pixStamp(g,Math.round(P[0])-3,Math.round(P[1])-3,`
.kkkkk.
khhhhhk
kqaaAQk
kfaAQnk
kpPPPPk
.kkkkk.
`);
// platform deck (wider than the posts): planks, or a stone gallery in Imperial
const ps=0.8;const plat=pixIsoBox(g,bx,cy0+ps*16-PZ,ps,ps,3,1,{left:'1',right:'2',top:'3'});
if(AGE<3){
planks(g,'1',plat.base.L,plat.base.Bm,{m:'v',s:'v',g:'x',r:'x'},{bw:5});planks(g,'2',plat.base.Bm,plat.base.Rr,{m:'x',s:'x',g:'y',r:'y'},{bw:5});
for(let y=0;y<g.length;y++)for(let x=0;x<GW;x++)if(g[y][x]==='3')g[y][x]=((x+2*y)>>2)%2?'w':'v';
// joists poking out under the deck
for(const f of [0.2,0.5,0.8]){const p=lerpP(plat.base.L,plat.base.Bm,f);pixSet(g,p[0],p[1]+1,'y');pixSet(g,p[0]-1,p[1]+1,'v');const q=lerpP(plat.base.Bm,plat.base.Rr,f);pixSet(g,q[0],q[1]+1,'y')}
}else{
  ashlar(g,'1',plat.base.L,plat.base.Bm,LIT,{ch:3,bl:6,seed:4,any:true});ashlar(g,'2',plat.base.Bm,plat.base.Rr,SHD,{ch:3,bl:6,seed:5,any:true});
  flagstones(g,'3',plat,{n:3});
  machi(g,[plat.base.L[0]+1,plat.base.L[1]],[plat.base.Bm[0],plat.base.Bm[1]],1,true);machi(g,[plat.base.Bm[0]+1,plat.base.Bm[1]],[plat.base.Rr[0]-1,plat.base.Rr[1]],1,false);
}
// roof posts (back first; Imperial: stone piers), then the brazier spot, then the parapet on the front edges
const rz=[13,15,15,17][AGE];
const pier=(P,lit)=>{for(let k=0;k<3;k++)pixLine(g,P[0]+k-1,P[1]-1,P[0]+k-1,P[1]-rz,lit?['h','q','f'][k]:['Q','b','B'][k]);pixLine(g,P[0]-1,P[1]-rz+1,P[0]+1,P[1]-rz+1,Au[1])};
if(AGE<3){pixLine(g,plat.T[0],plat.T[1]-1,plat.T[0],plat.T[1]-rz,'y');
for(const P of [plat.L,plat.Rr])pixLine(g,P[0]+(P===plat.L?1:-1),P[1]-1,P[0]+(P===plat.L?1:-1),P[1]-rz,'x');}
else{pier([plat.T[0],plat.T[1]],false);pier([plat.L[0]+2,plat.L[1]],true);pier([plat.Rr[0]-2,plat.Rr[1]],false)}
const BRZ=(()=>{const p=lerpP(plat.L,plat.Bm,0.62);return [Math.round(p[0])+1,Math.round(p[1])-4]})();   // brazier on the deck, just inside the front parapet   // brazier on the deck centre
if(AGE===3){// the lantern room: seen through the open bays, a dark interior lit warm from the fire on the deck
  const room=pixIsoBox(g,plat.Bm[0],plat.Bm[1],ps,ps,rz,1,{left:'4',right:'5'});
  const fc=[plat.Bm[0],plat.Bm[1]-ps*16];
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const c=g[y][x];if(c!=='4'&&c!=='5')continue;const d=Math.hypot(x-fc[0],(y-fc[1]+3)*1.6);
    g[y][x]=d<5?Gl[1]:d<9?Gl[0]:d<12&&((x+y)&1)?Gl[0]:c==='4'?'M':'e'}
}
pixStamp(g,BRZ[0]-3,BRZ[1]-3,`
JiIIiJ
.JiiJ.
..JJ..
`);
const PH=[6,9,8,7][AGE];
const par=pixIsoBox(g,plat.Bm[0],plat.Bm[1],ps,0.08,PH,1,{left:'4',right:'5',top:AGE>=2?'h':'v'});
const par2=pixIsoBox(g,plat.Bm[0],plat.Bm[1],0.08,ps,PH,1,{left:'4',right:'5',top:AGE>=2?'h':'v'});
if(AGE<2){planks(g,'4',plat.L,plat.Bm,{l:'w',m:'v',s:'w',g:'x',r:'x'},{bw:3,rails:AGE?[4,8]:[5]});planks(g,'5',plat.Bm,plat.Rr,{m:'x',s:'v',g:'y',r:'y'},{bw:3,rails:AGE?[4,8]:[5]})}
else{ashlar(g,'4',plat.L,plat.Bm,LIT,{ch:4,bl:6,seed:6,any:true,qL:false});ashlar(g,'5',plat.Bm,plat.Rr,SHD,{ch:4,bl:6,seed:7,any:true,qR:false})}
if(AGE===2){// merlons on the stone parapet
  for(const [A,B,c1,c2] of [[plat.L,plat.Bm,'a','h'],[plat.Bm,plat.Rr,'b','H']])for(const f of [0.02,0.4,0.78]){const p=lerpP(A,B,f),sl=(B[1]-A[1])/(B[0]-A[0]);
    for(let c=0;c<6;c++){const x=Math.round(p[0])+c,y=Math.round(p[1]+c*sl)-PH;for(let r=1;r<=3;r++)pixSet(g,x,y-r,r===3?c2:c1)}}}
if(AGE===3){// a gilt coping on the balustrade, dark balusters between pale posts
  for(const [A,B,lit] of [[plat.L,plat.Bm,true],[plat.Bm,plat.Rr,false]]){const sl=(B[1]-A[1])/(B[0]-A[0]);
    for(let x=Math.ceil(A[0]);x<=Math.floor(B[0]);x++){const u=x-Math.ceil(A[0]),y=Math.round(A[1]+(x-A[0])*sl);pixSet(g,x,y-PH,Au[lit?0:1]);
      if(u%3!==0)for(let r=2;r<=PH-2;r++)pixSet(g,x,y-r,u%3===1&&lit?'M':'e')}}}
if(AGE<3){pixLine(g,plat.Bm[0],plat.Bm[1]-1,plat.Bm[0],plat.Bm[1]-7,'w');pixLine(g,plat.Bm[0]+1,plat.Bm[1]-1,plat.Bm[0]+1,plat.Bm[1]-7,'x'); // front roof post
pixLine(g,plat.Bm[0],plat.Bm[1]-7,plat.Bm[0],plat.Bm[1]-rz,'w');pixLine(g,plat.Bm[0]+1,plat.Bm[1]-7,plat.Bm[0]+1,plat.Bm[1]-rz,'x');}
else pier([plat.Bm[0],plat.Bm[1]],true);
if(AGE===1){AK.windowAt(g,Math.round(lerpP(plat.L,plat.Bm,0.78)[0]),Math.round(lerpP(plat.L,plat.Bm,0.78)[1])-5,0.5,0);AK.windowAt(g,Math.round(lerpP(plat.Bm,plat.Rr,0.25)[0]),Math.round(lerpP(plat.Bm,plat.Rr,0.25)[1])-5,-0.5,1)}
if(AGE<3){const p=lerpP(plat.L,plat.Bm,0.45);shield(g,Math.round(p[0])-3,Math.round(p[1])-7-(AGE?1:0));const q=lerpP(plat.Bm,plat.Rr,0.55);shield(g,Math.round(q[0])-2,Math.round(q[1])-7-(AGE?1:0))}
// roof: thatch (Dark), the age kit's shingles / tiles / slate later
const ov=AGE===0?2:AGE===3?3:2;
const roofTop={T:[plat.T[0],plat.T[1]-rz],Rr:[plat.Rr[0]+ov,plat.Rr[1]-rz+1],Bm:[plat.Bm[0],plat.Bm[1]-rz+2],L:[plat.L[0]-ov,plat.L[1]-rz+1]};
const ap=pixIsoRoof(g,roofTop,[11,13,13,22][AGE],1,{left:'6',back:'7',front:'8',right:'9'});
if(AGE===0){
// thatch: strands running down the slope, a darker eave fringe
const thatch=(tmp,tn)=>{for(let y=0;y<g.length;y++)for(let x=0;x<GW;x++){if(g[y][x]!==tmp)continue;const r=hash3(x,Math.floor((y+(x*7)%4)/4),11);g[y][x]=r<0.18?tn[0]:r<0.75?tn[1]:tn[2]}};
thatch('6',['d','E','E']);thatch('7',['E','l','N']);thatch('8',['d','E','l']);thatch('9',['l','N','U']);
for(const [A,B,c] of [[roofTop.L,roofTop.Bm,'N'],[roofTop.Bm,roofTop.Rr,'U']]){pixLine(g,A[0],A[1]-1,B[0],B[1]-1,c)}
pixLine(g,roofTop.Bm[0],roofTop.Bm[1],ap[0],ap[1],'N');pixLine(g,roofTop.L[0],roofTop.L[1],ap[0],ap[1],'d');
}else{
  ageRoof();
  pixLine(g,roofTop.Bm[0],roofTop.Bm[1],ap[0],ap[1],R[6]);pixLine(g,roofTop.L[0],roofTop.L[1],ap[0],ap[1],R[0]);
  if(AGE===3){AK.trim(g,[roofTop.L[0]+1,roofTop.L[1]],[roofTop.Bm[0],roofTop.Bm[1]]);AK.trim(g,[roofTop.Bm[0],roofTop.Bm[1]],[roofTop.Rr[0]-1,roofTop.Rr[1]]);
    const n=Math.round(roofTop.Bm[1]-ap[1]);for(let i=3;i<n-2;i+=3){const t=i/n;pixSet(g,Math.round(roofTop.Bm[0]+(ap[0]-roofTop.Bm[0])*t),Math.round(roofTop.Bm[1]+(ap[1]-roofTop.Bm[1])*t),Au[0])}}
  if(AGE===2)pixSet(g,ap[0],ap[1],Fe[1]);
}
pixLine(g,roofTop.L[0],roofTop.L[1],roofTop.Bm[0],roofTop.Bm[1],'k');pixLine(g,roofTop.Bm[0],roofTop.Bm[1],roofTop.Rr[0],roofTop.Rr[1],'k');
inkOutline(g);
// legs drawn after the outline: 3-tone logs with their own ink edge (thin members would turn solid ink)
// The posts stand inside the deck's footprint, so the deck is in front of their tops: everything drawn below is clipped to the
// deck's bottom edge (cells above it are restored from underLegs), so the posts end under the deck instead of poking up through
// the deck and the roof eave.
const underLegs=cloneG(g);
const deckBottom=x=>x<=bx?plat.base.L[1]+(x-plat.base.L[0])*0.5:plat.base.Bm[1]-(x-bx)*0.5;
// posts: back post thin, front posts two-tone logs (Feudal on: squared posts)
const post=(P,th)=>{const C=th===1?['x']:AGE===0?['k','w','v','y']:['k','w','x','y'];for(let k=0;k<C.length;k++)pixLine(g,P[0]+k-1,P[1]-1-(AGE===1?2:0),P[0]+k-1,P[1]-PZ,C[k])};
post(base.T,1);
// cross bracing on the two front faces (behind the front posts)
const brace=(A,B,c1,c2)=>{pixLine(g,A[0]+1,A[1]-6,B[0]-1,B[1]-PZ+8,c1);pixLine(g,A[0]+1,A[1]-PZ+8,B[0]-1,B[1]-6,c1);pixLine(g,A[0]+1,A[1]-5,B[0]-1,B[1]-PZ+9,c2);pixLine(g,A[0]+1,A[1]-PZ+9,B[0]-1,B[1]-5,c2)};
const BZ=[0,0,20,PZ][AGE];   // stone pier height (Castle, Imperial)
if(AGE<2){brace(base.L,base.Bm,'v','y');brace(base.Bm,base.Rr,'x','y');}
else if(AGE===2){// one X in the open stage between the pier and the deck
  const b2=(A,B,c1)=>{pixLine(g,A[0]+1,A[1]-BZ-2,B[0]-1,B[1]-PZ+4,c1);pixLine(g,A[0]+1,A[1]-PZ+4,B[0]-1,B[1]-BZ-2,c1)};b2(base.L,base.Bm,'v');b2(base.Bm,base.Rr,'y')}
if(AGE<2){pixLine(g,base.L[0],base.L[1]-18,base.Bm[0],base.Bm[1]-18,'x');pixLine(g,base.Bm[0],base.Bm[1]-18,base.Rr[0],base.Rr[1]-18,'y');} // mid ledger
post(base.L,2);post(base.Rr,2);post(base.Bm,2);
if(AGE===0)for(const P of [base.L,base.Rr,base.Bm])for(let y=6;y<PZ-4;y+=7){pixSet(g,P[0],P[1]-y,'x');pixSet(g,P[0]+1,P[1]-y,'k')}  // bark rings
if(AGE===1)for(const P of [base.L,base.Rr,base.Bm])for(const y of [10,24]){pixSet(g,P[0]-1,P[1]-y,'i');pixSet(g,P[0],P[1]-y,'i')} // iron straps
// ladder up the lit face: two rails, rungs every 4 px
if(AGE<2)for(let k=0;k<PZ-3;k++){const y=base.L[1]+3-k,x0=Math.round(base.L[0]+9+k*0.1);pixSet(g,x0,y,'x');pixSet(g,x0+5,y+2,'y');if(k%4===2){pixLine(g,x0+1,y,x0+4,y+2,'w');pixLine(g,x0+1,y+1,x0+4,y+3,'y')}}
for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(y+0.5<deckBottom(x+0.5))g[y][x]=underLegs[y][x];
// Castle / Imperial: the stone pier in front of the post feet (Imperial: the whole shaft up to the gallery)
let pr=null;
if(BZ){const k=0.66;
  const ov=cloneG(g),withLegs=cloneG(g);
  pr=pixIsoBox(g,bx,cy0+k*16,k,k,AGE===3?BZ-3+(ps-k)*16:BZ,1,{left:'1',right:'2'});
  ashlar(g,'1',pr.base.L,pr.base.Bm,LIT,{ch:AGE===3?4:5,bl:7,plinth:3,seed:2});ashlar(g,'2',pr.base.Bm,pr.base.Rr,SHD,{ch:AGE===3?4:5,bl:7,plinth:3,seed:3});
  if(AGE===2){// a low tiled cap on the pier; the posts rise out of it
    const ct={T:[pr.T[0],pr.T[1]-1],L:[pr.L[0]-2,pr.L[1]],Rr:[pr.Rr[0]+2,pr.Rr[1]],Bm:[pr.Bm[0],pr.Bm[1]+1]};
    const cap=pixIsoRoof(g,ct,7,1,{left:'6',back:'7',front:'8',right:'9'});ageRoof();
    pixLine(g,ct.Bm[0],ct.Bm[1],cap[0],cap[1],R[6]);pixLine(g,ct.L[0],ct.L[1],cap[0],cap[1],R[0]);
    pixLine(g,ct.L[0],ct.L[1],ct.Bm[0],ct.Bm[1],'k');pixLine(g,ct.Bm[0],ct.Bm[1],ct.Rr[0],ct.Rr[1],'k');
    for(let x=Math.ceil(pr.L[0]);x<=pr.Rr[0];x++){const y=Math.floor(x<=bx?pr.Bm[1]-(bx-x)*0.5:pr.Bm[1]-(x-bx)*0.5)+1;if(pixGet(g,x,y)!=='.')pixSet(g,x,y,x<=bx?'m':'M')}
  }
  pixLine(g,pr.base.Bm[0],pr.base.Bm[1]-1,pr.Bm[0],pr.Bm[1],'K');
  if(AGE===3)for(const hh of [14,28]){for(let x=Math.ceil(pr.base.L[0]);x<=Math.floor(pr.base.Rr[0]);x++){                 // gilt string courses
    const y=Math.floor(x<=bx?pr.base.L[1]+(x-pr.base.L[0])*0.5:pr.base.Bm[1]-(x-bx)*0.5)-hh;if(pixGet(g,x,y)==='.')continue;pixSet(g,x,y,x<=bx?Au[0]:Au[1]);pixSet(g,x,y+1,x<=bx?Au[1]:Au[2])}}
  // door on the lit face, slit(s)
  const dx=Math.round(pr.base.L[0]+9),dy=Math.round(pr.base.L[1]+9*0.5)-1;
  opening(g,dx,dy,5,AGE===3?10:9,0.5,{fill:(c,r,w,h)=>r===h-1?null:c===0?'x':(c+1)%2?'v':'w'});
  if(AGE===3){pixSet(g,dx+2,dy-10+1,Au[0])}
  if(AGE===3){slit(g,bx+9,by-30,4,false);slit(g,bx-12,by-34,4,false)}else slit(g,bx+9,by-15,4,true);
  // ink only on the pier's own silhouette
  const solid=(x,y)=>pixGet(ov,x,y)!=='.';
  const tmp=cloneG(g);inkOutline(tmp,null,solid);
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(tmp[y][x]!==g[y][x]&&ov[y][x]==='.')g[y][x]=tmp[y][x];
  // Castle: the posts and braces above the cap (they stand on the pier, inside the cap's slope)
  if(AGE===2){const clip=x=>x<=bx?base.L[1]+(x-base.L[0])*0.5-(BZ+3):base.Bm[1]-(x-bx)*0.5-(BZ+3);
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(withLegs[y][x]!==underLegs[y][x]&&y+0.5<clip(x+0.5)&&y+0.5>=deckBottom(x+0.5))g[y][x]=withLegs[y][x];}
}
if(AGE===3)AK.finial(g,Math.round(ap[0]),Math.round(ap[1]));

// idle: a torch on the front post (Imperial: the lantern fire) flickers; a team banner ripples (under the deck, or on the pier)
const frames=[];
for(let k=0;k<4;k++){const f=cloneG(g);
  if(AGE<2){const q=lerpP(plat.base.Bm,plat.base.Rr,0.22);banner(f,Math.round(q[0]),Math.round(q[1])+2,6,AGE?9:11,k,{sl:-0.5});}
  else{const q=lerpP(pr.base.Bm,pr.base.Rr,0.4);const y0=Math.round(q[1])-BZ+(AGE===3?5:3),len=AGE===3?12:11;banner(f,Math.round(q[0]),y0,6,len,k,{sl:-0.5});
    if(AGE===3){for(let c=-1;c<=6;c++){const y=y0+Math.floor((c+0.5)*-0.5);if(pixGet(f,Math.round(q[0])+c,y)==='y')pixSet(f,Math.round(q[0])+c,y,Au[1])}
      for(let c=0;c<6;c++)for(let r=len+2;r>=1;r--){const x=Math.round(q[0])+c,y=y0+Math.floor((c+0.5)*-0.5)+r;if(/[TLD]/.test(pixGet(f,x,y))){pixSet(f,x,y,c%2?Au[1]:Au[0]);break}}}}
  if(AGE<3){const tx=base.Bm[0]-2-(AGE===2?8:0),ty=base.Bm[1]-17+(AGE===2?2:0);torch(f,tx,ty,k);
    for(const [dx,dy] of [[2,-3],[2,-5],[3,-4],[2,1]])if(/[wvk]/.test(pixGet(f,tx+dx,ty+dy)))pixSet(f,tx+dx,ty+dy,(k+dy)%2?'G':'g');}
  else{flame(f,BRZ[0],BRZ[1]-2,k);}
  frames.push(pixText(f));}
export default {
  id:'outpost',kind:'building',footprint:[W,H],anchor:[bx,by],
  palette:Object.assign({},FORT_PAL,AK.pal,{d:'#e6c272',E:'#d8ab4f',l:'#c99a44',N:'#a07a34',U:'#6f5229'},STONE),
  ...(AGE?{flags:[[0,Math.round(ap[1]-by)-(AGE===3?6:3),12]]}:{}),
  frames:{idle:frames},
};
