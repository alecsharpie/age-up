// @sprite building siege
// Painted Siege Workshop (PIXELS.siege) rising with construction; flag flies from the shed's front post.
export default function siege(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.siege,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.Bm[0]-54,bm.Bm[1]-29-22,b.team,14);
}
