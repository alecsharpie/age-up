// @sprite building stable
// Painted Stable (PIXELS.stable) rising with construction; flag on the stall block's left roof corner.
export default function stable(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.stable,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.Bm[0]-38,bm.Bm[1]-31-16-2,b.team,14);
}
