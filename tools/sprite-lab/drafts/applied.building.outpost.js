// @sprite building outpost
// Painted timber outpost (PIXELS.outpost); idle set: torch flicker + banner ripple (6 fps, offset per outpost). Flag on the roof when built.
export default function outpost(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.outpost,'idle',Math.floor(G.time*6+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.Bm[0]+3,bm.Bm[1]-16-50,b.team,12);
}
