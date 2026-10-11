// @sprite building market
// Painted Market (PIXELS.market) rising with construction; once built the awning hems flutter and the pennant waves (4 fps). Flag on the right corner.
export default function market(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.market,'idle',b.built?Math.floor(G.time*4):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.Rr[0]-6,bm.Rr[1]-3,b.team,16);   // on the kerb at the right corner: the back corner sits behind the back stall's awning
}
