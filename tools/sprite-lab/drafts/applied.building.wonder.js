// @sprite building wonder
// Painted wonder (PIXELS.wonder); pixAge picks the variant for the owner's age (Dark … Imperial). Flags are code-drawn so they wave;
// a variant that moves its flag mount says so in spec.flags ([[dx,dy,h]] from the footprint's bottom corner), read by pixFlags.
export default function wonder(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const S=pixAge(PIXELS.wonder,b);
  pixDraw(S,'idle',b.built?Math.floor(G.time*4):0,tc,bm.Bm[0],bm.Bm[1],{clip:p})
}
