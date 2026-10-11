// @sprite building house
// Painted house (PIXELS.house, one variant per age via pixAge: the owner's age picks it; 6 idle frames: smoke, firelit windows), rising with construction progress.
export default function house(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(pixAge(PIXELS.house,b),'idle',b.built?Math.floor(G.time*4+(b.id||0)*1.7):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
