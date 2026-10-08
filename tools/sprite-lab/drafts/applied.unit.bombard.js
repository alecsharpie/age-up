// @sprite unit bombard
// Painted bombard (PIXELS.bombard): attack 6 is painted (flash, smoke cloud, recoil roll-back), so the old code-drawn smoke puff is gone.
// Death is played by the engine from PIXELS.bombard.frames.death.
export default function bombard(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.bombard,tc);
}
