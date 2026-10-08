// @sprite unit sheep
// Painted sheep (PIXELS.sheep). Owner marker stays code-drawn, as before.
export default function sheep(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixDraw(PIXELS.sheep,u.goal?'walk':'idle',Math.floor(u.anim*10),null);
  if(u.team>=0){ctx.fillStyle=TEAM[u.team].c;ctx.fillRect(-2,-15,4,3)}
}
