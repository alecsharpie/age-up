// @sprite building house
// Painted house (PIXELS.house, 6 idle frames: chimney smoke rising, firelit window flicker) rising with construction progress.
export default function house(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.house,'idle',b.built?Math.floor(G.time*4+(b.id||0)*1.7):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
