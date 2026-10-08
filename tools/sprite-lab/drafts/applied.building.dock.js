// @sprite building dock
// Painted dock (PIXELS.dock) rising with construction progress; the flag stays code-drawn so it waves.
export default function dock(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.dock,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built){const t=corners(cx,cy,w,h,6);flag(t.Rr[0]-6,t.Rr[1]-4,b.team,16)}
}
