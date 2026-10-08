// @sprite unit archer
// Painted archer (PIXELS.archer): idle 6 / walk 8 / ready 2 (full draw while in combat) / attack 5 (release, recoil,
// reach to the quiver, arrow out, nock) / death 6 (played by the engine). The arrow in flight is the game's projectile.
export default function archer(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.archer,tc);
}
