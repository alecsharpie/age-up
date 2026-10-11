// @sprite building gate
// Painted gate (PIXELS.gate); pixAge picks the variant for the owner's age (Dark … Imperial). Flags are code-drawn so they wave;
// a variant that moves its flag mount says so in spec.flags ([[dx,dy,h]] from the footprint's bottom corner), read by pixFlags.
export default function gate(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const at=(x,y)=>G.bAt&&typeof inMap==='function'&&inMap(x,y)?G.bAt[idx(x,y)]:null;
  const joins=o=>o&&o!==b&&(o.type==='wall'||o.type==='gate')&&(o.built||o.progress>0.5)?1:0;
  const nb=(dx,dy)=>joins(at(b.tx+dx,b.ty+dy));
  const alongY=(nb(0,1)||nb(0,-1))&&!(nb(1,0)||nb(-1,0));
  const S=pixAge(PIXELS.gate,b);
  pixDraw(S,alongY?'y':'x',Math.floor(G.time*6+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p})
}
