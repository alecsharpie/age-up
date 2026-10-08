// @sprite unit sheep
// Painted sheep (PIXELS.sheep) through pixUnit: idle grazes / twitches / flicks, walk while herded or wandering. Wild sprite (no team keys);
// the owner marker stays code-drawn, as before. Death + carcass come from PIXELS.sheep.frames.death (engine).
export default function sheep(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.sheep,null);
  if(u.team>=0){ctx.fillStyle=TEAM[u.team].c;ctx.fillRect(-2,-16,4,3)}
}
