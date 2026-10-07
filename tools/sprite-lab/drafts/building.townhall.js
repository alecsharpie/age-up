// @sprite building townhall
// Painted Town Hall (PIXELS.townhall) rising with construction; the flag waves from the tower apex.
export default function townhall(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.townhall,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(bm.Bm[0]+64,bm.Bm[1]-4-32-44-12,b.team,16);
}
