// @sprite building outpost
// Painted outpost (PIXELS.outpost); pixAge picks the variant for the owner's age (Dark … Imperial). Flags are code-drawn so they wave;
// a variant that moves its flag mount says so in spec.flags ([[dx,dy,h]] from the footprint's bottom corner), read by pixFlags.
export default function outpost(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const S=pixAge(PIXELS.outpost,b);
  pixDraw(S,'idle',Math.floor(G.time*6+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p});
  pixFlags(S,b,bm,[[0,-81,12]]);
}
