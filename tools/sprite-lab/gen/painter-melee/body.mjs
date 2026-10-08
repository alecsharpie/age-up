import { Frame, RAMP } from './engine.mjs';
// Standing/walking human, facing right. Upper body = torso+head+arms, offset (ux,uy). Feet on the ground row G-1 (outline at G).
export function human(W, H, pose, o) {
  const f = new Frame(W, H); const G = H - 1; const cx = (pose.cx ?? 7);
  const ux = pose.ux || 0, uy = pose.uy || 0, hy = pose.hy ?? uy;
  const P = { f, G, cx, ux, uy,
    shN: [cx - 2 + ux, G - 14 + uy], shF: [cx + 2 + ux, G - 14 + uy],
    head: [cx - 2 + ux + (pose.hx || 0), G - 21 + uy + (pose.hdy || 0)], belt: G - 9 + uy };
  if (o.back) o.back(f, P, pose);
  const leg = (L, far) => { const ramp = far ? (o.hoseFar || RAMP.hoseFar) : (o.hose || RAMP.hose); const bt = far ? RAMP.bootFar : RAMP.boot;
    const hipX = (far ? cx - 2 : cx) + Math.round(ux / 2) + (L.hipDx || 0), hipY = G - 9 + hy; const fy = G - 1 - (L.lift || 0); const fx = L.x;
    const lp = f.part({ ramp, outline: true });
    const kx = Math.round((hipX + fx) / 2 + (L.knee ?? (L.lift ? 1 : 0))), ky = Math.round((hipY + fy) / 2) + 1;
    lp.line(hipX, hipY, kx, ky, 2, 1).line(kx, ky, fx, fy - 2, 2, 1);
    const bp = f.part({ ramp: bt });
    if (L.toe) bp.stamp(fx, fy - 1, '00\n.00'); else bp.stamp(fx, fy - 1, '00.\n000');
  };
  leg(pose.far, true); leg(pose.near, false);
  // tunic
  const tp = f.part({ ramp: RAMP.team, shadeCols: 1 });
  const ty = G - 14 + uy, tx = cx + ux;
  tp.rows(tx, ty, [[-2, 2], [-2, 2], [-2, 2], [-2, 2], [-2, 2], [-2, 2], [-2, 3], [-3, 3]]);
  const hem = pose.hem || 0; if (hem === 1) { f.part({ ramp: RAMP.team }).px(tx + 4, ty + 7, 'D'); } if (hem === -1) { tp.erase(tx + 3, ty + 7); tp.erase(tx + 3, ty + 6); f.part({ ramp: RAMP.team }).px(tx - 4, ty + 7, 'D'); }
  if (o.torso) o.torso(f, P, pose, tp);
  // belt
  f.part({ ramp: RAMP.wood, outline: true }).rect(tx - 2, P.belt, 5, 1, 'v').px(tx, P.belt, 'G');
  // neck + head
  f.part({ ramp: RAMP.skin }).rect(P.head[0] + 2, G - 15 + uy + (pose.hdy || 0) * 0, 2, 1, 'S');
  const hp = f.part({ ramp: RAMP.steel, ink: o.headInk || 'k', sel: o.headSel });
  hp.stamp(P.head[0], P.head[1], pose.blink ? o.headBlink : o.head);
  if (o.front) o.front(f, P, pose);
  return f;
}
// 8-frame walk: [nearX, nearLift, nearToe, farX, farLift, farToe, bob]
export const WALK = [
  { near: { x: 9 }, far: { x: 3, toe: 1 }, uy: 0 },
  { near: { x: 8 }, far: { x: 4, lift: 1, toe: 1 }, uy: 1 },
  { near: { x: 6 }, far: { x: 6, lift: 2 }, uy: 0 },
  { near: { x: 4, toe: 1 }, far: { x: 8, lift: 1 }, uy: -1 },
  { near: { x: 3, toe: 1 }, far: { x: 9 }, uy: 0 },
  { near: { x: 4, lift: 1, toe: 1 }, far: { x: 8 }, uy: 1 },
  { near: { x: 6, lift: 2 }, far: { x: 6 }, uy: 0 },
  { near: { x: 8, lift: 1 }, far: { x: 4, toe: 1 }, uy: -1 },
];
export const STAND = { near: { x: 7 }, far: { x: 4 }, uy: 0 };
