// @sprite building farm
// Painted farm (PIXELS.farm); pixAge picks the variant for the owner's age (Dark … Imperial). Flags are code-drawn so they wave;
// a variant that moves its flag mount says so in spec.flags ([[dx,dy,h]] from the footprint's bottom corner), read by pixFlags.
export default function farm(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const S=pixAge(PIXELS.farm,b);
  pixDraw(S,b.built?'idle':'young',b.built?Math.floor(G.time*3+(b.id||0)):0,tc,bm.Bm[0],bm.Bm[1],{alpha:b.built?1:0.35+0.65*p})
}
