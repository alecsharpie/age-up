// @sprite building btower
// Painted bombard tower (PIXELS.btower); idle set: muzzle smoke, brazier flicker, banner ripple (4 fps, offset per tower). Flag on the battlements when built.
export default function btower(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.btower,'idle',Math.floor(G.time*4+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(cx,cy-36,b.team,12);
}
