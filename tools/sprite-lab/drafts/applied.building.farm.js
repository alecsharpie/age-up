// @sprite building farm
// Painted farm: frame 0 young crops while being built (faded in), frame 1 mature once built. Flat, so no clip.
export default function farm(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.farm,'idle',b.built?1:0,tc,bm.Bm[0],bm.Bm[1],{alpha:b.built?1:0.35+0.65*p});
}
