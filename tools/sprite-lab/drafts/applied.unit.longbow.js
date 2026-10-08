// @sprite unit longbow
// Painted longbowman (PIXELS.longbow): idle 6 / walk 8 / ready 3 (full draw to the ear) / attack 5 (release, recoil,
// reach to the quiver, arrow out, nock) / death 6 (played by the engine). The arrow in flight is the game's projectile.
export default function longbow(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.longbow,tc);
}
