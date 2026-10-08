// @sprite building wonder
// Painted gothic cathedral (PIXELS.wonder); the spire tip glints on frame 2; flag on the transept end when built.
export default function wonder(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.wonder,'idle',Math.floor(G.time*1.5)%4===0?1:0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(cx+(w-h)*HW/2+58,cy+(w+h)*HH/2-10-52,b.team,18);
}
