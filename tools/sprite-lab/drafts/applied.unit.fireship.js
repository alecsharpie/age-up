// @sprite unit fireship
// Painted fire ship (PIXELS.fireship): brazier flames flicker between two frames; a bigger blaze while attacking.
export default function fireship(u,{tc,d,swing,working,wph,r,wx,wy}){
  ctx.translate(0,Math.sin(G.time*2+u.id)*1.2);
  pixDraw(PIXELS.fireship,u.swing>0?'attack':'idle',Math.floor(G.time*8+u.id),tc);
}
