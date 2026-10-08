// @sprite unit bombard
// Painted bombard (PIXELS.bombard): attack frame 0 has the muzzle flash; a code-drawn smoke puff drifts up and forward after the shot.
export default function bombard(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*10):u.swing>0?Math.floor((0.3-u.swing)/0.3*2):0;
  pixDraw(PIXELS.bombard,frame,i,tc);
  if(u.swing>0&&u.swing<0.22){const f=(0.22-u.swing)/0.22;ctx.fillStyle=`rgba(200,200,200,${0.6*(1-f)})`;for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(14+f*8+k*3,-15-f*6-k*2,2.5+f*3,0,7);ctx.fill()}}
}
