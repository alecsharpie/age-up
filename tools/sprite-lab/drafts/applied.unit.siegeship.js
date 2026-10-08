// @sprite unit siegeship
// Painted siege ship (PIXELS.siegeship): bobs; idle / walk / attack (bow cannon fires: flash, recoil, smoke).
export default function siegeship(u,{tc,d,swing,working,wph,r,wx,wy}){
  ctx.translate(0,Math.sin(G.time*2+u.id)*1.2);
  pixUnit(u,PIXELS.siegeship,tc);
}
