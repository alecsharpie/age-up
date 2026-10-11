// @sprite building wonder
// Painted gothic cathedral (PIXELS.wonder, 4 idle frames: glint running up the gold spire tip, candlelit windows). No flag: the team colour reads on the portals and banners.
export default function wonder(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.wonder,'idle',b.built?Math.floor(G.time*4):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
