// @sprite building gate
// Painted gatehouse (PIXELS.gate): a big portcullis arch between two tall flanking towers; idle sets: banner ripple (6 fps, offset
// per gate). The passage runs across the wall line: set 'y' (arch on the +x face) when walls/gates join it along y only, else 'x'
// (arch on the +y face), the same neighbour test the wall case uses.
export default function gate(b,{d,cx,cy,w,h,p,tc,bm,z}){
  const at=(x,y)=>G.bAt&&typeof inMap==='function'&&inMap(x,y)?G.bAt[idx(x,y)]:null;
  const joins=o=>o&&o!==b&&(o.type==='wall'||o.type==='gate')&&(o.built||o.progress>0.5)?1:0;
  const nb=(dx,dy)=>joins(at(b.tx+dx,b.ty+dy));
  const alongY=(nb(0,1)||nb(0,-1))&&!(nb(1,0)||nb(-1,0));
  pixDraw(PIXELS.gate,alongY?'y':'x',Math.floor(G.time*6+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
