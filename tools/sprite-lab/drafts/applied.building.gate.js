// @sprite building gate
// Painted gate (PIXELS.gate): arch with portcullis between two flanking towers; idle set: torch flicker + banner ripple (6 fps, offset per gate).
export default function gate(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.gate,'idle',Math.floor(G.time*6+b.id),tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
