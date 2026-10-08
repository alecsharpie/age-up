// @sprite unit villager
// Painted villager (PIXELS.villager). Work set by job: build → hammer, wood → axe, gold/stone → pick, food/farm → hoe.
// Hunting uses the spear `attack` set. Carried loads are painted props (loadwood/loadfood/loadgold/loadstone) drawn over the
// walk/idle frames; their grids are cropped to their rows, so they are drawn at a per-kind y and bob 1 px with the walk.
export default function villager(u,{tc,d,swing,working,wph,r,wx,wy}){
  const S=PIXELS.villager;
  const work=u.state==='build'?'build':u.carryKind==='wood'?'chop':(u.carryKind==='gold'||u.carryKind==='stone')?'mine':'farm';
  const set=pixUnit(u,S,tc,{work});
  if(u.carry>0&&(set==='walk'||set==='idle')&&S.frames['load'+u.carryKind]){
    const bob=set==='walk'?[0,1,0,-1][Math.floor(u.anim*12)%4]:0;
    pixDraw(S,'load'+u.carryKind,0,tc,0,{wood:-11,food:-8,gold:-8,stone:-11}[u.carryKind]+bob);
  }
}
