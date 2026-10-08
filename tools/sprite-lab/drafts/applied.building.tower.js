// @sprite building tower
// Painted watchtower (PIXELS.tower) rising with construction; flag stays code-drawn so it waves.
export default function tower(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.tower,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(cx,cy-44,b.team,12);
}
