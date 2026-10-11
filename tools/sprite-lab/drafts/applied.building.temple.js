// @sprite building temple
// Painted temple (PIXELS.temple); pixAge picks the variant for the owner's age (Dark … Imperial). Flags are code-drawn so they wave;
// a variant that moves its flag mount says so in spec.flags ([[dx,dy,h]] from the footprint's bottom corner), read by pixFlags.
export default function temple(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const S=pixAge(PIXELS.temple,b);
  pixDraw(S,'idle',b.built?Math.floor(G.time*3):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built&&b.relics){const gl=0.35+0.25*Math.sin(G.time*2);ctx.fillStyle=`rgba(255,220,120,${gl})`;ctx.beginPath();const ra=S.relicAt||[39,-55];ctx.arc(bm.Bm[0]+ra[0],bm.Bm[1]+ra[1],6,0,7);ctx.fill()}
}
