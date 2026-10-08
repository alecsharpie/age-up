// @sprite unit fishing
// Painted fishing ship (PIXELS.fishing): bobs on the water; ripple ring while fishing stays code-drawn.
export default function fishing(u,{tc,d,swing,working,wph,r,wx,wy}){
  ctx.translate(0,Math.sin(G.time*2+u.id)*1.2);
  pixDraw(PIXELS.fishing,'idle',0,tc);
  if(u.state==='gather'&&u.phase==='gathering'){ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.arc(14,-4,3+Math.sin(u.anim*6)*2,0,7);ctx.stroke()}
}
