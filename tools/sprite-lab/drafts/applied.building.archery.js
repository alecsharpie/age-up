// @sprite building archery
// Painted Archery Range (PIXELS.archery) rising with construction; idle set at 5 fps (awning valance flutters).
// No pole flag: the team-striped awning carries the team colour (feedback round 1 asked for the extra flag to go).
export default function archery(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.archery,'idle',Math.floor(G.time*5),tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
