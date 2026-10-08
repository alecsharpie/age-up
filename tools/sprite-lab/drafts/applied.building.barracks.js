// @sprite building barracks
// Painted Barracks (PIXELS.barracks) rising with construction; idle set at 4 fps (banners ripple, the dummy wobbles).
// The flag flies from the front turret.
export default function barracks(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.barracks,'idle',Math.floor(G.time*4),tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.Bm[0],bm.Bm[1]-20-22-14,b.team,16);
}
