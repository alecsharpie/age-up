// @sprite unit siegeship
// Painted siege ship (PIXELS.siegeship): the deck mangonel is cocked at rest and lets fly during the attack swing.
export default function siegeship(u,{tc,d,swing,working,wph,r,wx,wy}){
  ctx.translate(0,Math.sin(G.time*2+u.id)*1.2);
  if(u.swing>0)pixDraw(PIXELS.siegeship,'attack',u.swing>0.15?0:1,tc);
  else pixDraw(PIXELS.siegeship,'idle',0,tc);
}
