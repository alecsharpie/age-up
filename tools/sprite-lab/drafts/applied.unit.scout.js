// @sprite unit scout
// Painted scout (PIXELS.scout): mounted; walk ×4 (legs cycle), attack ×3. Splits off the shared horseman/knight/scout case when applied.
export default function scout(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*12):u.swing>0?Math.floor((0.3-u.swing)/0.3*3):0;
  pixDraw(PIXELS.scout,frame,i,tc);
}
