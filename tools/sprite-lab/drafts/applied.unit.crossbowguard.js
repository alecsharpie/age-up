// @sprite unit crossbowguard
// Painted crossbowguard (PIXELS.crossbowguard): idle 6 / walk 8 / ready 3 (aimed at the cheek) / attack 6 (trigger,
// kick, nose down, crank, crank, bolt laid) / death 6 (played by the engine). The bolt in flight is the game's projectile.
export default function crossbowguard(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.crossbowguard,tc);
}
