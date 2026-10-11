// @sprite building wall
// Painted wall (PIXELS.wall); pixAge picks the variant for the owner's age (Dark … Imperial). Flags are code-drawn so they wave;
// a variant that moves its flag mount says so in spec.flags ([[dx,dy,h]] from the footprint's bottom corner), read by pixFlags.
export default function wall(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const at=(x,y)=>G.bAt&&typeof inMap==='function'&&inMap(x,y)?G.bAt[idx(x,y)]:null;
  const joins=o=>o&&o!==b&&(o.type==='wall'||o.type==='gate')&&(o.built||o.progress>0.5)?1:0;
  const nb=(dx,dy)=>joins(at(b.tx+dx,b.ty+dy));
  const m=nb(1,0)|nb(0,1)<<1|nb(-1,0)<<2|nb(0,-1)<<3;
  const S=pixAge(PIXELS.wall,b);
  pixDraw(S,((b.tx+b.ty)&1?'p':'t')+m,Math.floor(G.time*6+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p})
}
