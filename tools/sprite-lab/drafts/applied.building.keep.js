// @sprite building keep
// Painted castle (PIXELS.keep); idle set: donjon banners ripple, gate torches flicker (4 fps, offset per keep). Flags on the donjon and the two side towers wave in code.
export default function keep(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.keep,'idle',Math.floor(G.time*4+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built){const mx=cx+(w-h)*HW/2,my=cy+(w+h)*HH/2;flag(mx,my-36-36-2,b.team,24);flag(cx-96,cy+64-62,b.team,14);flag(cx+96,cy+64-62,b.team,14);}
}
