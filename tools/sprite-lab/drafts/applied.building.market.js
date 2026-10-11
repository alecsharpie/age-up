// @sprite building market
// Painted market (PIXELS.market); pixAge picks the variant for the owner's age (Dark … Imperial). Flags are code-drawn so they wave;
// a variant that moves its flag mount says so in spec.flags ([[dx,dy,h]] from the footprint's bottom corner), read by pixFlags.
export default function market(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const S=pixAge(PIXELS.market,b);
  pixDraw(S,'idle',b.built?Math.floor(G.time*4):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  pixFlags(S,b,bm,[[90,-51,16]]);
}
