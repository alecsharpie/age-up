// @sprite unit deer
// Painted stag (PIXELS.deer); wild, no team colour. Flees fast, so the walk cycle runs quicker.
export default function deer(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixDraw(PIXELS.deer,u.goal?'walk':'idle',Math.floor(u.anim*14),null);
}
