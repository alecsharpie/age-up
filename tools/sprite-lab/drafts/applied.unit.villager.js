// @sprite unit villager
// Hybrid villager: painted body (PIXELS.villager, see drafts/pixel.villager.js) plus code-drawn carried resource.
// Needs pixDraw/pixBuild in the game (lab.mjs apply helpers) and the sprite stored (lab.mjs apply pixel villager).
export default function villager(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle'&&!(u.state==='gather'&&u.phase==='gathering');
  const frame=moving?'walk':working?'work':'idle';
  const i=moving?Math.floor(u.anim*12):working?Math.floor(u.anim*6):0;
  pixDraw(PIXELS.villager,frame,i,tc);
  if(u.carry>0){ // what is being carried, on the back shoulder
    ctx.fillStyle=RES_COLORS[u.carryKind]||'#8a5a2b';ctx.fillRect(-7,-17,4,4);
    ctx.fillStyle='rgba(255,255,255,0.25)';ctx.fillRect(-7,-17,2,1);
  }
}
