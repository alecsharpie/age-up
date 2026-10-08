// @sprite unit ram
// Painted covered ram (PIXELS.ram): idle log sway, walk 8 (wheels turn), attack 6 (log rammed out, hut rocks, drawn back).
// Death is played by the engine from PIXELS.ram.frames.death.
export default function ram(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.ram,tc);
}
