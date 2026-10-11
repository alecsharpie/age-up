// @sprite unit sheep
// Painted sheep (PIXELS.sheep) through pixUnit: idle grazes / twitches / flicks, walk while herded or wandering. Team colour only on the collar
// (T/D/L keys); a wild sheep passes wool colours so the collar disappears into the fleece. Death + carcass come from PIXELS.sheep.frames.death (engine).
export default function sheep(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.sheep,u.team>=0?tc:{c:'#ddd4bf',d:'#b3a993',l:'#f4eedd'}); // owner shown by the collar only; a wild sheep's collar keys take wool colours
}
