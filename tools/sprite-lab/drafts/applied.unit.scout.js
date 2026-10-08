// @sprite unit scout
// Painted scout (PIXELS.scout): idle ×6 (tail swish, head dip, breath, hoof shift), walk ×8 (canter), attack ×4, death ×7 (played by the engine).
export default function scout(u,{tc,d,swing,working,wph,r,wx,wy}){
  pixUnit(u,PIXELS.scout,tc);
}
