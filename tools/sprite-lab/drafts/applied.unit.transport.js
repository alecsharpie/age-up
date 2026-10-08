// @sprite unit transport
// Painted transport cog (PIXELS.transport): bobs; idle / walk. The garrison badge shows how many are aboard.
export default function transport(u,{tc,d,swing,working,wph,r,wx,wy}){
  ctx.translate(0,Math.sin(G.time*2+u.id)*1.2);
  pixUnit(u,PIXELS.transport,tc);
  if(u.cargo&&u.cargo.length){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(-10,-40,20,10);ctx.fillStyle='#fff';ctx.font='9px Georgia';ctx.textAlign='center';ctx.fillText('⌂'+u.cargo.length,0,-32);ctx.textAlign='left'}
}
