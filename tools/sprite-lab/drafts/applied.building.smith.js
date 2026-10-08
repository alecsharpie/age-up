// @sprite building smith
// Painted blacksmith (PIXELS.smith): 6 idle frames at 5 fps once built: chimney smoke rises, the forge glow pulses, sparks fly off the anvil.
export default function smith(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.smith,'idle',b.built?Math.floor(G.time*5):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
}
