// @sprite resource wood
// Painted wood (PIXELS.wood): idle frame v = the variant. Runs inside resSprite; x is the 64×80 sprite ctx, (ox,oy) the ground point.
export default function wood(x,{c,key,kind,v,r,ox,oy}){
  x.imageSmoothingEnabled=false;
  const f=pixFrame(PIXELS.wood,'idle',v,null);
  x.drawImage(f,ox-PIXELS.wood.anchor[0],oy-PIXELS.wood.anchor[1]);
}
