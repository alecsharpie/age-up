// @sprite unit knight
// Painted knight (PIXELS.knight): idle ×6 (tail swish, head dip, breath, hoof shift), walk ×8 (canter), attack ×4, death ×7 (played by the engine).
export default function knight(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.knight,tc);
}
