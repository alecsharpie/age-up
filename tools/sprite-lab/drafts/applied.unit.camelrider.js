// @sprite unit camelrider
// Painted camel rider (PIXELS.camelrider): spear upright, thrust forward on attack.
export default function camelrider(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*11):u.swing>0?Math.floor((0.3-u.swing)/0.3*2):0;
  pixDraw(PIXELS.camelrider,frame,i,tc);
}
