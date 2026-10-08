// @sprite building archery
// Painted Archery Range (PIXELS.archery) rising with construction; the flag flies from the shed's front corner.
export default function archery(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.archery,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.Bm[0]-64,bm.Bm[1]-34-14,b.team,16);
}
