// @sprite unit tradecart
// Painted trade cart (PIXELS.tradecart): ox strides and the wheel turns when moving; the 'gold' set shows sacks when carrying.
export default function tradecart(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const set=u.carry>0?'gold':moving?'walk':'idle';
  pixDraw(PIXELS.tradecart,set,moving?Math.floor(u.anim*10):0,tc);
}
