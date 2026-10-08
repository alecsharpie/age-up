// @sprite unit catapult
// Painted mangonel (PIXELS.catapult): wheels turn when moving; attack = cocked → fired → settling (stone is the game's projectile).
export default function catapult(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*10):u.swing>0?Math.floor((0.3-u.swing)/0.3*3):0;
  pixDraw(PIXELS.catapult,frame,i,tc);
}
