// @sprite building smith
// Painted blacksmith (PIXELS.smith): 3 frames pulse the forge glow and lift the chimney smoke once built.
export default function smith(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.smith,'idle',b.built?Math.floor(G.time*4):2,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
