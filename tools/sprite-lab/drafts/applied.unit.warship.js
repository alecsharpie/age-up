// @sprite unit warship
// Painted war galley (PIXELS.warship): bobs; idle / walk (oars stroke) / attack (archers' volley).
export default function warship(u,{tc,d,swing,working,wph,r,wx,wy}){
  ctx.translate(0,Math.sin(G.time*2+u.id)*1.2);
  pixUnit(u,PIXELS.warship,tc);
}
