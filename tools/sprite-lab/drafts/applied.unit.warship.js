// @sprite unit warship
// Painted galley (PIXELS.warship): bobs; attack frames show the archers nocking, then the volley away.
export default function warship(u,{tc,d,swing,working,wph,r,wx,wy}){
  ctx.translate(0,Math.sin(G.time*2+u.id)*1.2);
  if(u.swing>0)pixDraw(PIXELS.warship,'attack',u.swing>0.15?0:1,tc);
  else pixDraw(PIXELS.warship,'idle',0,tc);
}
