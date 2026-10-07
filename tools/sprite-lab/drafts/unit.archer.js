// @sprite unit archer
// Painted archer (PIXELS.archer): idle / walk ×4 / attack. Shadow and selection ring are drawn by the game.
export default function archer(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const n=PIXELS.archer.frames.attack.length;
  const i=moving?Math.floor(u.anim*12):u.swing>0?Math.min(n-1,Math.floor((0.3-u.swing)/0.3*n)):0;
  pixDraw(PIXELS.archer,frame,i,tc);
}
