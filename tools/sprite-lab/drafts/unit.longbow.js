// @sprite unit longbow
// Painted longbowman (PIXELS.longbow). Attack frames: draw, hold, loose; the arrow itself is the game's projectile.
export default function longbow(u,{tc,d,swing,working,wph,r,wx,wy}){
  const moving=u.goal&&u.state!=='idle';
  const frame=moving?'walk':u.swing>0?'attack':'idle';
  const i=moving?Math.floor(u.anim*12):u.swing>0?Math.floor((0.3-u.swing)/0.3*3):0;
  pixDraw(PIXELS.longbow,frame,i,tc);
}
