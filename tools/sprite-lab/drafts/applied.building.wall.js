// @sprite building wall
// Painted stone wall (PIXELS.wall). The set is picked from the neighbours (built walls/gates on the four sides), so parapets, quoins
// and ink appear only on open sides and a line reads as one wall-walk; every other segment ('t') carries a team shield and a
// flickering torch (6 fps, offset per segment), the rest ('p') are plain.
export default function wall(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const at=(x,y)=>G.bAt&&typeof inMap==='function'&&inMap(x,y)?G.bAt[idx(x,y)]:null;
  const joins=o=>o&&o!==b&&(o.type==='wall'||o.type==='gate')&&(o.built||o.progress>0.5)?1:0;
  const nb=(dx,dy)=>joins(at(b.tx+dx,b.ty+dy));
  const m=nb(1,0)|nb(0,1)<<1|nb(-1,0)<<2|nb(0,-1)<<3;
  pixDraw(PIXELS.wall,((b.tx+b.ty)&1?'p':'t')+m,Math.floor(G.time*6+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
