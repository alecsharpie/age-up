// @sprite unit tradecart
// Painted trade cart (PIXELS.tradecart): idle 4 (ox grazes, tail swish) / walk 8 (4-beat ox walk, wheel spokes turn) /
// gold 8 (walking loaded: tilt rolled back over the gold) / death 6 (cart overturns, played by the engine).
export default function tradecart(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  if(u.carry>0)pixUnit(u,PIXELS.tradecart,tc,{set:'gold',i:moving?u.anim*12:0});  // loaded: gold shows standing too
  else pixUnit(u,PIXELS.tradecart,tc);
}
