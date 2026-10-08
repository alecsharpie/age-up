// @sprite unit fireship
// Painted fire ship (PIXELS.fireship): bobs; fire-basket flickers in idle/walk and flares into a blaze on attack.
export default function fireship(u,{tc,d,swing,working,wph,r,wx,wy}){
  ctx.translate(0,Math.sin(G.time*2+u.id)*1.2);
  pixUnit(u,PIXELS.fireship,tc);
}
