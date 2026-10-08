// @sprite building lumber
// Painted lumber camp (PIXELS.lumber) rising with construction progress; once built the bow saw rocks, sawdust falls and the pennant flutters (4 fps).
export default function lumber(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.lumber,'idle',b.built?Math.floor(G.time*4):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
