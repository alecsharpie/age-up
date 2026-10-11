// @sprite building btower
// Painted bombard tower (PIXELS.btower); idle set: deck-gun smoke, banner ripple (4 fps, offset per tower). Flag on the apex
// of the stair turret's slate cap when built (the apex is 134 px above the anchor).
export default function btower(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.btower,'idle',Math.floor(G.time*4+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.Bm[0],bm.Bm[1]-135,b.team,13);
}
