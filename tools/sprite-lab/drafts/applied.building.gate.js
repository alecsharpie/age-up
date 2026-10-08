// @sprite building gate
// Painted gate (PIXELS.gate): arch with portcullis between two flanking towers.
export default function gate(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.gate,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
