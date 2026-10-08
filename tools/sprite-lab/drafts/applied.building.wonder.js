// @sprite building wonder
// Painted gothic cathedral (PIXELS.wonder, 4 idle frames: glint running up the gold spire tip, candlelit windows); flag on the transept end when built.
export default function wonder(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.wonder,'idle',b.built?Math.floor(G.time*4):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(cx+(w-h)*HW/2+58,cy+(w+h)*HH/2-10-52,b.team,18);
}
