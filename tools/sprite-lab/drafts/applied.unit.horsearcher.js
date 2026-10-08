// @sprite unit horsearcher
// Painted horse archer (PIXELS.horsearcher): walk when moving, draw-and-loose when shooting; the arrow is the game's projectile.
export default function horsearcher(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*12):u.swing>0?Math.floor((0.3-u.swing)/0.3*2):0;
  pixDraw(PIXELS.horsearcher,frame,i,tc);
}
