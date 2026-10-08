// @sprite building house
// Painted house (PIXELS.house, 3 smoke frames) rising with construction progress.
export default function house(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.house,'idle',b.built?Math.floor(G.time*1.5):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
