// @sprite building house
// Painted house (PIXELS.house) rising with construction progress; flag and scaffold stay code-drawn.
export default function house(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.house,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
