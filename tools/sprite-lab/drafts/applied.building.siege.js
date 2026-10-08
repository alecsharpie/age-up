// @sprite building siege
// Painted Siege Workshop (PIXELS.siege) rising with construction; idle set at 4 fps (crane hook sways, brazier
// flickers). The flag flies from the shed's front eave corner.
export default function siege(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.siege,'idle',Math.floor(G.time*4),tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.Bm[0]-54,bm.Bm[1]-29-22,b.team,14);
}
