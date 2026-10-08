// @sprite building temple
// Painted Temple (PIXELS.temple, 4 idle frames: bells swing, candlelight flickers) rising with construction. Relics inside show as a warm glow in the rose window.
export default function temple(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.temple,'idle',b.built?Math.floor(G.time*3):0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built&&b.relics){const gl=0.35+0.25*Math.sin(G.time*2);ctx.fillStyle=`rgba(255,220,120,${gl})`;ctx.beginPath();ctx.arc(bm.Bm[0]+39,bm.Bm[1]-55,6,0,7);ctx.fill()}
}
