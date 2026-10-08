// @sprite building market
// Painted Market (PIXELS.market) rising with construction; flag on the back stall's rear post.
export default function market(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.market,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.T[0],bm.T[1]+4+6,b.team,16);
}
