// @sprite building tower
// Painted watch tower (PIXELS.tower) rising with construction; idle set: banner ripple + loophole fire (4 fps, offset per tower). Flag stays code-drawn on the roof apex.
export default function tower(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.tower,'idle',Math.floor(G.time*4+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(cx,cy-44,b.team,12);
}
