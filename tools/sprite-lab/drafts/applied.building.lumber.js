// @sprite building lumber
// Painted lumber camp (PIXELS.lumber) rising with construction progress.
export default function lumber(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.lumber,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
