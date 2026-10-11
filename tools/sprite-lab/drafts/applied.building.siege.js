// @sprite building siege
// Painted siege (PIXELS.siege); pixAge picks the variant for the owner's age (Dark … Imperial). Flags are code-drawn so they wave;
// a variant that moves its flag mount says so in spec.flags ([[dx,dy,h]] from the footprint's bottom corner), read by pixFlags.
export default function siege(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const S=pixAge(PIXELS.siege,b);
  pixDraw(S,'idle',Math.floor(G.time*4),tc,bm.Bm[0],bm.Bm[1],{clip:p});
  pixFlags(S,b,bm,[[-54,-51,14]]);
}
