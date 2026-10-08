// @sprite building mine
// Painted mining camp (PIXELS.mine) rising with construction progress.
export default function mine(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.mine,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
