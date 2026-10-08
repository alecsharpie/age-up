// @sprite unit fishing
// Painted fishing boat (PIXELS.fishing): bobs; idle / walk (bow wave, wake) / work (casts and hauls the net) while fishing.
// The ripple ring over the fishing spot stays code-drawn. Death frames are played by the engine.
export default function fishing(u,{tc,d,swing,working,wph,r,wx,wy}){
  ctx.translate(0,Math.sin(G.time*2+u.id)*1.2);
  pixUnit(u,PIXELS.fishing,tc,{work:'work'});
  if(u.state==='gather'&&u.phase==='gathering'){ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.arc(14,-4,3+Math.sin(u.anim*6)*2,0,7);ctx.stroke()}
}
