// @sprite unit boar
// Painted boar (PIXELS.boar); wild, no team colour.
export default function boar(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixDraw(PIXELS.boar,u.goal?'walk':'idle',Math.floor(u.anim*12),null);
}
