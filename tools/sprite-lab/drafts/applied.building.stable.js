// @sprite building stable
// Painted Stable (PIXELS.stable) rising with construction; idle set at 3 fps (horses bob heads, swish a tail).
// Flag on the left end of the roof ridge.
export default function stable(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.stable,'idle',Math.floor(G.time*3),tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.Bm[0]-7,bm.Bm[1]-116,b.team,14);
}
