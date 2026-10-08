// @sprite building wall
// Painted stone wall segment (PIXELS.wall); merlons line up with neighbouring segments.
export default function wall(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.wall,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
