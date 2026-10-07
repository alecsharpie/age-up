// @sprite resource gold
// Painted gold (PIXELS.gold): idle frame v = the variant. Runs inside resSprite; x is the 64×80 sprite ctx, (ox,oy) the ground point.
export default function gold(x,{c,key,kind,v,r,ox,oy}){
  x.imageSmoothingEnabled=false;
  const f=pixFrame(PIXELS.gold,'idle',v,null);
  x.drawImage(f,ox-PIXELS.gold.anchor[0],oy-PIXELS.gold.anchor[1]);
}
