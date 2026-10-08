// @sprite building keep
// Painted keep (PIXELS.keep): curtain wall, corner towers, central donjon. Flags on the donjon and the two front towers wave in code.
export default function keep(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.keep,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built){const mx=cx+(w-h)*HW/2,my=cy+(w+h)*HH/2;flag(mx,my-36-36-2,b.team,24);flag(cx-96,cy+64-62,b.team,14);flag(cx+96,cy+64-62,b.team,14);}
}
