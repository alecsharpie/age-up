// @sprite building btower
// Painted bombard tower (PIXELS.btower); flag on the battlements when built.
export default function btower(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.btower,'idle',0,tc,bm.Bm[0],bm.Bm[1],{clip:p});
  if(b.built)flag(cx,cy-36,b.team,12);
}
