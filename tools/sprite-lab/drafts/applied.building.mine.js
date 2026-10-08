// @sprite building mine
// Painted mining camp (PIXELS.mine) rising with construction progress; once built the pulley turns, the bucket rides and the gold glints (4 fps).
export default function mine(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.mine,'idle',b.built?Math.floor(G.time*4):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
