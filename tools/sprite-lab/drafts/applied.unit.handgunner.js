// @sprite unit handgunner
// Painted handgunner (PIXELS.handgunner). On firing, a code-drawn smoke puff leaves the muzzle.
export default function handgunner(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*12):u.swing>0?((0.3-u.swing)<0.12?0:1):0;
  pixDraw(PIXELS.handgunner,frame,i,tc);
  if(u.swing>0){const f=(0.3-u.swing)/0.3;ctx.fillStyle=`rgba(220,220,210,${0.7*(1-f)})`;ctx.beginPath();ctx.arc(9+f*5,-14-f*3,1.5+f*3,0,7);ctx.fill()}
}
