// @sprite unit monk
// Painted monk (PIXELS.monk). Converting (standing): the `convert` set — staff raised, free hand lifted — with a faint code-drawn halo;
// a carried relic (PIXELS.relic 'carry': the gilt casket with the monk's hands on its sides) is held at the chest, glowing (pixRelic).
export default function monk(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const converting=(u.state==='convert'||u.faith>0)&&!moving;
  pixUnit(u,PIXELS.monk,tc,{set:converting?'convert':undefined});
  if(u.relic)pixRelic(3,-8+(moving?[0,1,0,-1][Math.floor(u.anim*12)%4]:0),'carry',u.id||0);
  if(converting){ctx.strokeStyle='rgba(255,230,120,0.6)';ctx.beginPath();ctx.arc(0,-24,3,0,7);ctx.stroke()}
}
