// @sprite resource food
// Painted food (PIXELS.food): idle frame v = the variant. Runs inside resSprite; x is the 64×80 sprite ctx, (ox,oy) the ground point.
export default function food(x,{c,key,kind,v,r,ox,oy}){
  x.imageSmoothingEnabled=false;
  const f=pixFrame(PIXELS.food,'idle',v,null);
  x.drawImage(f,ox-PIXELS.food.anchor[0],oy-PIXELS.food.anchor[1]);
}
