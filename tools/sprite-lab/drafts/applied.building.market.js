// @sprite building market
// Painted Market (PIXELS.market) rising with construction; once built the awning hems flutter and the pennant waves (4 fps). Flag on the back corner.
export default function market(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.market,'idle',b.built?Math.floor(G.time*4):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.T[0],bm.T[1]+4+6,b.team,16);
}
