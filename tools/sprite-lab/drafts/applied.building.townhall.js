// @sprite building townhall
// Painted townhall (PIXELS.townhall); pixAge picks the variant for the owner's age (Dark … Imperial). Flags are code-drawn so they wave;
// a variant that moves its flag mount says so in spec.flags ([[dx,dy,h]] from the footprint's bottom corner), read by pixFlags.
export default function townhall(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const S=pixAge(PIXELS.townhall,b);
  pixDraw(S,'idle',b.built?Math.floor(G.time*5):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  pixFlags(S,b,bm,[[64,-112,16]]);
}
