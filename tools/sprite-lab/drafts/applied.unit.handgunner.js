// @sprite unit handgunner
// Painted hand cannoneer (PIXELS.handgunner): idle 4 / walk 8 / attack 4 (muzzle flash + smoke puff painted in frames 0–1,
// recoil, lower to reload) / death 6 (played by the engine). Shadow and selection ring are drawn by the game.
export default function handgunner(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.handgunner,tc);
}
