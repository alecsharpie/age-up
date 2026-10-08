// @sprite building mill
// Painted windmill (PIXELS.mill): 4 sail frames at 22.5° steps; ~3 frames/s matches the old 1.2 rad/s sails. Sails still while unbuilt.
export default function mill(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.mill,'idle',b.built?Math.floor(G.time*3):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
