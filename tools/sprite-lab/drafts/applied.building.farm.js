// @sprite building farm
// Painted farm: 'young' green shoots while being built (faded in), then ripe wheat swaying in a travelling wave (idle ×4 at 3 fps). Flat, so no clip.
export default function farm(b,{d,cx,cy,w,h,p,tc,bm,z}){
  pixDraw(PIXELS.farm,b.built?'idle':'young',b.built?Math.floor(G.time*3+(b.id||0)):0,tc,bm.Bm[0],bm.Bm[1],{alpha:b.built?1:0.35+0.65*p});
}
