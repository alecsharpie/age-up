// @sprite unit skirmisher
// Painted skirmisher (PIXELS.skirmisher): idle 4 / walk 8 / attack 4 (frame 0 = the javelin leaving the hand) / death 6 (played by the engine).
// Shadow and selection ring are drawn by the game; the thrown javelin is the game's projectile.
export default function skirmisher(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.skirmisher,tc);
}
