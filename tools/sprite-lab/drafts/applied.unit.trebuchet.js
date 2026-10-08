// @sprite unit trebuchet
// Painted trebuchet (PIXELS.trebuchet): idle is cocked; attack = cocked → mid-swing → fired; wheels turn when moving.
export default function trebuchet(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*10):u.swing>0?Math.floor((0.3-u.swing)/0.3*3):0;
  pixDraw(PIXELS.trebuchet,frame,i,tc);
}
