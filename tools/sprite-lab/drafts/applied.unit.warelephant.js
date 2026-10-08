// @sprite unit warelephant
// Painted war elephant (PIXELS.warelephant): slow 4-frame walk, head and trunk rear up on attack.
export default function warelephant(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*7):u.swing>0?Math.floor((0.3-u.swing)/0.3*2):0;
  pixDraw(PIXELS.warelephant,frame,i,tc);
}
