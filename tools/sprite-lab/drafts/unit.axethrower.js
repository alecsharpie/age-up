// @sprite unit axethrower
// Painted axethrower (PIXELS.axethrower): idle, walk ×4, attack ×3 (wind-up, release, follow-through).
export default function axethrower(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*12):u.swing>0?Math.floor((0.3-u.swing)/0.3*3):0;
  pixDraw(PIXELS.axethrower,frame,i,tc);
}
