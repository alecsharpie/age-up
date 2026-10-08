// @sprite unit trebuchet
// Painted trebuchet (PIXELS.trebuchet): idle/walk at rest (beam tall), ready = cocked between shots, attack 6 (release → follow-through → winch back).
// Death is played by the engine from PIXELS.trebuchet.frames.death.
export default function trebuchet(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.trebuchet,tc);
}
