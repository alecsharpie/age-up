// @sprite unit ram
// Painted battering ram (PIXELS.ram): three wheels turn when moving; attack = log back / forward.
export default function ram(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*10):u.swing>0?Math.floor((0.3-u.swing)/0.3*2):0;
  pixDraw(PIXELS.ram,frame,i,tc);
}
