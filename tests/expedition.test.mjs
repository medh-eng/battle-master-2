import test from "node:test";
import assert from "node:assert/strict";
import {
  begin,
  act,
  legal,
  chooseAction,
  chooseOrder,
  resolve,
  starter,
} from "../src/engine/rules.ts";
import {
  start,
  finish,
  reward,
  canFuse,
  fuse,
  gateUpgrade,
  march,
} from "../src/campaign/run.ts";
import { recipes, units, gates } from "../src/data/cards.ts";

function soldier(kind, id = kind) {
  return { card: { kind, id }, hp: units[kind].hp, guard: 0 };
}
function end(seed) {
  const b = begin(seed);
  for (let i = 0; b.phase !== "end"; i++) {
    assert(i < 250, "Duel must end");
    if (b.phase === "order") resolve(b, chooseOrder(b, 0));
    else act(b, chooseAction(b));
  }
  return b;
}
test("32 seeds finish and replay identically", () => {
  for (let seed = 8; seed < 40; seed++) assert.deepEqual(end(seed), end(seed));
});
test("order uses public information, commits before human input", () => {
  const b = begin(15);
  const chosen = chooseOrder(b, 1);
  b.sides[0].hand = [];
  b.sides[0].pile.reverse();
  assert.deepEqual(chooseOrder(b, 1), chosen);
  act(b, { type: "pass" });
  act(b, { type: "pass" });
  assert.deepEqual(b.locked, chosen);
});
test("snapshot: rear support and Press versus armoured lead, zero damage spillover", () => {
  const b = begin(1);
  b.phase = "order";
  b.locked = { mode: "hold", lane: 1 };
  b.sides[0].lanes[0] = [soldier("horse_archer"), soldier("archer")];
  b.sides[1].lanes[0] = [soldier("knight")];
  resolve(b, { mode: "press", lane: 0 });
  assert.equal(b.sides[1].lanes[0][0].hp, 1);
  assert.equal(b.sides[0].lanes[0][0].hp, 1);
  assert.equal(b.sides[1].hp, 20);
});
test("wall first, gate once, largest breach counter, Road breaks ties", () => {
  const b = begin(5);
  const [a, d] = b.sides;
  b.phase = "order";
  b.locked = { mode: "press", lane: 0 };
  a.lanes = [[soldier("archer")], [soldier("archer")]];
  d.gate = "thorn";
  d.charges = 2;
  resolve(b, { mode: "hold", lane: 1 });
  assert.deepEqual(d.walls, [0, 0]);
  assert.equal(d.charges, 1);
  assert.equal(d.hp, 19);
  assert.equal(a.lanes[0][0].hp, 1);
  assert.equal(a.lanes[1][0].hp, 3);
});
test("Hold cancels breach before spending charges; Pulse recharges a spent wall", () => {
  const b = begin(8);
  b.phase = "order";
  b.sides[1].lanes[0] = [soldier("swordsman")];
  b.locked = { mode: "press", lane: 1 };
  resolve(b, { mode: "hold", lane: 0 });
  assert.equal(b.sides[0].walls[0], 1);
  assert.equal(b.sides[0].charges, 1);
  b.sides[0].walls[0] = 0;
  b.phase = "order";
  b.locked = { mode: "press", lane: 1 };
  resolve(b, { mode: "pulse", lane: 0 });
  assert.equal(b.sides[0].walls[0], 0);
  assert.equal(b.sides[0].hp, 20);
});
test("simultaneous fort destruction is a draw", () => {
  const b = begin(9);
  b.phase = "order";
  b.locked = { mode: "press", lane: 1 };
  b.sides.forEach((s) => {
    s.hp = 1;
    s.charges = 0;
    s.walls = [0, 0];
  });
  b.sides[0].lanes[0] = [soldier("archer")];
  b.sides[1].lanes[1] = [soldier("cavalry")];
  resolve(b, { mode: "press", lane: 0 });
  assert.equal(b.winner, -1);
});
test("formation move, hand cap and Scout Ledger give legal owner choices", () => {
  const b = begin(21);
  const s = b.sides[0];
  s.lanes[0] = [soldier("cavalry")];
  const supply = s.supply;
  act(b, { type: "move", lane: 0 });
  assert.equal(s.supply, supply);
  assert.equal(s.lanes[1].length, 1);
  act(b, { type: "pass" });
  const scout = { kind: "scout_ledger", id: "sc" };
  s.hand = [scout];
  act(b, { type: "play", card: "sc" });
  assert.equal(b.pending[0], "bottom");
  const id = s.hand[0].id;
  act(b, { type: "bottom", card: id });
  assert.equal(s.pile.at(-1).id, id);
  s.hand = starter().slice(0, 8);
  b.phase = "order";
  b.locked = { mode: "press", lane: 0 };
  resolve(b, { mode: "hold", lane: 0 });
  assert.equal(legal(b)[0].type, "discard");
  while (b.pending[0]) act(b, legal(b)[0]);
  assert.equal(s.hand.length, 8);
});
test("first camp, every mounted recipe in both input orders, both gate branches and reload", () => {
  for (const seed of [2050, 2049])
    for (const h of Object.keys(recipes))
      for (const reverse of [false, true]) {
        const r = start(seed);
        r.battle = end(seed);
        finish(r);
        assert.equal(r.scene, "camp");
        assert.equal(r.marks, 6);
        assert(reward(r, "token"));
        assert(!reward(r, "token"));
        const a = r.roster.find((c) => c.kind === recipes[h]),
          b = r.roster.find((c) => c.kind === "cavalry");
        assert(fuse(r, h, ...(reverse ? [b.id, a.id] : [a.id, b.id])));
        assert.equal(r.roster.length, 11);
        assert(!fuse(r, h, a.id, b.id));
        assert(gateUpgrade(r));
        assert(!gateUpgrade(r));
        assert.equal(r.marks, 0);
        const copy = JSON.parse(JSON.stringify(r));
        assert(march(copy));
        assert(!march(copy));
        assert.equal(copy.stop, 2);
        const s = copy.battle.sides[0];
        assert.equal(s.gate, seed % 2 === 0 ? "armoured" : "thorn");
        assert.equal(s.charges, gates[s.gate].charges);
        assert([...s.pile, ...s.hand].some((c) => c.kind === h));
      }
});
test("wrong parents, duplicate identity, insufficient funds and deck floor are atomic rejections", () => {
  const r = start(46);
  r.scene = "camp";
  r.reward = true;
  r.marks = 3;
  const before = structuredClone(r);
  assert(!fuse(r, "horse_archer", "u0", "u3"));
  assert(!fuse(r, "horse_archer", "u2", "u2"));
  assert.deepEqual(r, before);
  r.roster = r.roster.slice(0, 8);
  assert(!canFuse(r, "horse_archer"));
  r.roster = starter();
  r.marks = 2;
  assert(!canFuse(r, "horse_archer"));
});
