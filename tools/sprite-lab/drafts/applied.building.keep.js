// @sprite building keep
// Painted keep (PIXELS.keep); pixAge picks the variant for the owner's age (Dark … Imperial). Flags are code-drawn so they wave;
// a variant that moves its flag mount says so in spec.flags ([[dx,dy,h]] from the footprint's bottom corner), read by pixFlags.
export default function keep(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const S=pixAge(PIXELS.keep,b);
  pixDraw(S,'idle',Math.floor(G.time*4+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p})
}
