// @sprite unit catapult
// Painted mangonel (PIXELS.catapult): idle cocked + creak, walk 8 (wheels turn), attack 6 (arm slams the crossbar, winds back); the stone is the game's projectile.
// Death is played by the engine from PIXELS.catapult.frames.death.
export default function catapult(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.catapult,tc);
}
