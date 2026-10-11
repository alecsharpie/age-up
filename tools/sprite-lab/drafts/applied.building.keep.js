// @sprite building keep
// Painted castle (PIXELS.keep); idle set: donjon banners ripple, the four painted flags on the donjon's corners stream, gate
// torches flicker (4 fps, offset per keep). The flags are part of the painting, so the case draws no code flags.
export default function keep(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.keep,'idle',Math.floor(G.time*4+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
