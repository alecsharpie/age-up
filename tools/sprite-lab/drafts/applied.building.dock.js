// @sprite building dock
// Painted dock (PIXELS.dock, 4 idle frames: water lapping around the piles, crane crate swinging) rising with construction; the flag stays code-drawn so it waves.
export default function dock(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.dock,'idle',b.built?Math.floor(G.time*3):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built){const t=corners(cx,cy,w,h,6);flag(t.Rr[0]-6,t.Rr[1]-1,b.team,19)}
}
