// @sprite unit monk
// Painted monk (PIXELS.monk). Converting (standing): the `convert` set — staff raised, free hand lifted — with a faint code-drawn halo;
// a carried relic is held overhead, glowing (code-drawn).
export default function monk(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const converting=(u.state==='convert'||u.faith>0)&&!moving;
  pixUnit(u,PIXELS.monk,tc,{set:converting?'convert':undefined});
  if(u.relic){ctx.fillStyle='#e8c55a';ctx.fillRect(-3,-28,6,5);ctx.strokeStyle='#8a6a12';ctx.strokeRect(-3.5,-28.5,7,6);ctx.fillStyle='#fff8d0';ctx.fillRect(-1,-27,2,2);const gl=0.4+0.3*Math.sin(G.time*3);ctx.strokeStyle=`rgba(255,240,160,${gl})`;ctx.beginPath();ctx.arc(0,-25,7,0,7);ctx.stroke()}
  if(converting){ctx.strokeStyle='rgba(255,230,120,0.6)';ctx.beginPath();ctx.arc(0,-24,3,0,7);ctx.stroke()}
}
