import {
  units,
  tactics,
  cardInfo,
  isUnit,
  mounted,
  support,
  gates,
  laneNames,
} from "../data/cards.ts";
import type { Card, Unit, Gate } from "../data/cards.ts";

export type Instance = { id: string; kind: Card };
export type Soldier = {
  card: Instance & { kind: Unit };
  hp: number;
  guard: number;
};
export type Side = {
  hp: number;
  gate: Gate;
  charges: number;
  walls: number[];
  lanes: Soldier[][];
  hand: Instance[];
  pile: Instance[];
  supply: number;
  passed: boolean;
  moved: boolean;
};
export type Order = { lane: number; mode: "press" | "hold" | "pulse" };
export type Action = {
  type: "play" | "move" | "pass" | "bottom" | "discard";
  card?: string;
  lane?: number;
  slot?: number;
};
export type Battle = {
  sides: Side[];
  round: number;
  priority: number;
  turn: number;
  phase: "muster" | "order" | "end";
  pending: ("bottom" | "discard" | null)[];
  locked: Order | null;
  log: string[];
  winner: number | null;
  seed: number;
};
export const other = (p: number) => 1 - p;
export function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function shuffle<T>(items: T[], seed: number) {
  const next = random(seed),
    result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export const starter = (): Instance[] =>
  Array.from({ length: 12 }, (_, i) => ({
    id: "u" + i,
    kind: (["swordsman", "pikeman", "archer", "cavalry"] as Unit[])[i % 4],
  }));
function army(roster: Instance[], hp: number, gate: Gate, seed: number): Side {
  const kit = Object.keys(tactics).map((kind, i) => ({
    id: "t" + i,
    kind: kind as Card,
  }));
  return {
    hp,
    gate,
    charges: gates[gate].charges,
    walls: [1, 1],
    lanes: [[], []],
    hand: [],
    pile: shuffle([...roster, ...kit], seed),
    supply: 0,
    passed: false,
    moved: false,
  };
}
export function begin(
  seed: number,
  roster = starter(),
  hp = 20,
  gate: Gate = "timber",
  opponent = starter(),
  rivalGate: Gate = "timber",
): Battle {
  const b: Battle = {
    seed,
    sides: [
      army(roster, hp, gate, seed),
      army(opponent, hp, rivalGate, seed ^ 0x6ac147),
    ],
    round: 0,
    priority: 0,
    turn: 0,
    phase: "muster",
    pending: [null, null],
    locked: null,
    log: [],
    winner: null,
  };
  refill(b);
  return b;
}
function refill(b: Battle) {
  b.round++;
  b.phase = "muster";
  b.turn = b.priority;
  b.locked = null;
  for (const [p, s] of b.sides.entries()) {
    s.supply = Math.min(7, s.supply + 3);
    s.passed = false;
    s.moved = false;
    s.hand.push(...s.pile.splice(0, b.round === 1 ? 4 : 2));
    b.pending[p] = s.hand.length > 8 ? "discard" : null;
  }
  if (b.pending[other(b.turn)] && !b.pending[b.turn]) b.turn = other(b.turn);
}
function targets(s: Side, c: Instance): Action[] {
  if (cardInfo(c.kind).cost > s.supply) return [];
  const play = (lane?: number, slot?: number): Action => ({
    type: "play",
    card: c.id,
    lane,
    slot,
  });
  if (c.kind === "resupply") return [play()];
  if (c.kind === "scout_ledger") return s.pile.length ? [play()] : [];
  const out: Action[] = [];
  for (const [i, l] of s.lanes.entries()) {
    if (
      (isUnit(c.kind) && l.length < 2) ||
      (c.kind === "fort_rally" && s.walls[i] === 0) ||
      (c.kind === "change_standard" && l.length === 2) ||
      (c.kind === "shield_screen" && l.length)
    )
      out.push(play(i));
    if (c.kind === "field_rest")
      for (const [j, u] of l.entries())
        if (u.hp < units[u.card.kind].hp) out.push(play(i, j));
  }
  return out;
}
export function legal(b: Battle): Action[] {
  if (b.phase !== "muster") return [];
  const s = b.sides[b.turn],
    pending = b.pending[b.turn];
  if (pending) return s.hand.map((c) => ({ type: pending, card: c.id }));
  const out = s.hand.flatMap((c) => targets(s, c));
  for (const [i, l] of s.lanes.entries())
    if (
      !s.moved &&
      l.length &&
      !s.lanes[1 - i].length &&
      (mounted(l[0].card.kind) || s.supply > 0)
    )
      out.push({ type: "move", lane: i });
  return [...out, { type: "pass" }];
}
export function orders(s: Side): Order[] {
  return s.walls.flatMap((charge, lane) =>
    (charge === 0
      ? (["press", "hold", "pulse"] as const)
      : (["press", "hold"] as const)
    ).map((mode) => ({ mode, lane })),
  );
}
function advance(b: Battle) {
  const p = b.turn,
    q = other(p);
  if (b.pending[p]) return;
  if (b.pending[q]) {
    b.turn = q;
    return;
  }
  if (b.sides.every((s) => s.passed)) {
    b.phase = "order";
    b.locked = chooseOrder(b, 1);
    return;
  }
  if (!b.sides[q].passed) b.turn = q;
}
export function act(b: Battle, a: Action) {
  if (
    !legal(b).some(
      (v) =>
        v.type === a.type &&
        v.card === a.card &&
        v.lane === a.lane &&
        v.slot === a.slot,
    )
  )
    throw Error("Illegal muster");
  const p = b.turn,
    s = b.sides[p],
    who = p ? "Rival" : "You",
    l = a.lane ?? 0;
  if (a.type === "pass") {
    s.passed = true;
    b.log.push(who + " passed.");
  } else if (a.type === "bottom" || a.type === "discard") {
    const [c] = s.hand.splice(
      s.hand.findIndex((x) => x.id === a.card),
      1,
    );
    if (a.type === "bottom") s.pile.push(c);
    b.pending[p] = s.hand.length > 8 ? "discard" : null;
    // Opening hand-limit choices precede all public muster actions.
    if (a.type === "discard" && !b.pending.some(Boolean)) {
      b.turn = b.sides[b.priority].passed ? other(b.priority) : b.priority;
      return;
    }
  } else if (a.type === "move") {
    const formation = s.lanes[l];
    s.supply -= mounted(formation[0].card.kind) ? 0 : 1;
    s.lanes[1 - l] = formation;
    s.lanes[l] = [];
    s.moved = true;
    b.log.push(who + " moved to " + laneNames[1 - l] + ".");
  } else {
    const [c] = s.hand.splice(
      s.hand.findIndex((x) => x.id === a.card),
      1,
    );
    s.supply -= cardInfo(c.kind).cost;
    if (isUnit(c.kind))
      s.lanes[l].push({
        card: { ...c, kind: c.kind },
        hp: units[c.kind].hp,
        guard: 0,
      });
    else
      switch (c.kind) {
        case "change_standard":
          s.lanes[l].reverse();
          break;
        case "field_rest": {
          const u = s.lanes[l][a.slot ?? 0];
          u.hp = Math.min(units[u.card.kind].hp, u.hp + 2);
          break;
        }
        case "shield_screen":
          s.lanes[l][0].guard += 2;
          break;
        case "scout_ledger":
          s.hand.push(...s.pile.splice(0, 2));
          b.pending[p] = "bottom";
          break;
        case "resupply":
          s.supply = Math.min(7, s.supply + 1);
          break;
        case "fort_rally":
          s.walls[l] = 1;
          break;
      }
    b.log.push(
      who +
        " played " +
        cardInfo(c.kind).name +
        (a.lane === undefined ? "" : " on " + laneNames[l]) +
        ".",
    );
  }
  advance(b);
}
export function chooseOrder(b: Battle, p: number): Order {
  const self = b.sides[p],
    foe = b.sides[other(p)];
  const next = random(b.seed ^ Math.imul(b.round, 12345 + p));
  return orders(self)
    .map((order) => {
      const a = self.lanes[order.lane][0],
        d = foe.lanes[order.lane][0];
      const score =
        order.mode === "press"
          ? a
            ? 2
            : 0
          : order.mode === "hold"
            ? d
              ? 2
              : 0
            : !a
              ? 1.8
              : 0.6;
      return { order, score: score + next() };
    })
    .sort((a, b) => b.score - a.score)[0].order;
}
export function chooseAction(b: Battle): Action {
  const p = b.turn,
    s = b.sides[p],
    foe = b.sides[other(p)],
    moves = legal(b);
  const next = random(
    b.seed ^ Math.imul(b.round, 9457) ^ (s.hand.length * 37 + s.supply),
  );
  return moves
    .map((action) => {
      const l = action.lane ?? 0,
        lane = s.lanes[l],
        enemy = foe.lanes[l],
        c = s.hand.find((v) => v.id === action.card)?.kind;
      let score = 0;
      if (action.type === "play" && c) {
        if (isUnit(c))
          score =
            lane.length === 0
              ? 6 + (enemy.length ? 0.8 : 0) + units[c].atk * 0.15
              : 3 + support(c);
        else if (c === "resupply") score = s.supply < 7 ? 8 : -2;
        else if (c === "change_standard")
          score = lane[1].hp > lane[0].hp + 1 ? 3 : -2;
        else score = 2;
      } else if (action.type === "move")
        score =
          lane.length &&
          !enemy.length &&
          foe.lanes[1 - l].length &&
          s.hp < foe.hp
            ? 1
            : -2;
      else if (c) score = isUnit(c) ? 0 : 1;
      return { action, score: score + next() * 0.7 };
    })
    .sort((a, b) => b.score - a.score)[0].action;
}
export function resolve(b: Battle, player: Order) {
  if (
    b.phase !== "order" ||
    !b.locked ||
    !orders(b.sides[0]).some(
      (o) => o.lane === player.lane && o.mode === player.mode,
    )
  )
    throw Error("Illegal order");
  const picks = [player, b.locked],
    loss = [
      [0, 0],
      [0, 0],
    ],
    fort = [0, 0];
  const report = [
    "Round " +
      b.round +
      " · You " +
      player.mode +
      " " +
      laneNames[player.lane] +
      " / Rival " +
      b.locked.mode +
      " " +
      laneNames[b.locked.lane],
  ];
  for (const [p, o] of picks.entries())
    if (o.mode === "pulse") {
      b.sides[p].walls[o.lane] = 1;
      report.push(
        (p ? "Rival" : "Your") + " " + laneNames[o.lane] + " wall recharged.",
      );
    }
  for (let p = 0; p < 2; p++) {
    const q = other(p),
      s = b.sides[p],
      def = b.sides[q],
      breaches = [0, 0];
    for (let l = 0; l < 2; l++) {
      const [a, rear] = s.lanes[l],
        d = def.lanes[l][0];
      if (!a) continue;
      const press = Number(picks[p].lane === l && picks[p].mode === "press"),
        hold = picks[q].lane === l && picks[q].mode === "hold";
      const prefix = (p ? "Rival " : "Your ") + laneNames[l];
      if (d) {
        const base = units[a.card.kind].atk,
          bonus = Number(
            ["pikeman", "lancer"].includes(a.card.kind) && mounted(d.card.kind),
          );
        const sup = support(rear?.card.kind),
          armour = units[d.card.kind].def,
          guard = d.guard + (hold ? 2 + Number(d.card.kind === "knight") : 0);
        const damage = Math.max(
          0,
          Math.max(1, base + sup + bonus + press - armour) - guard,
        );
        loss[q][l] += damage;
        report.push(
          prefix +
            " strike: " +
            base +
            " ATK + " +
            sup +
            " support + " +
            bonus +
            " trait + " +
            press +
            " Press − " +
            armour +
            " DEF (min 1) − " +
            guard +
            " Guard = " +
            damage +
            " damage.",
        );
      } else {
        const raw = 2 + press;
        breaches[l] = Math.max(0, raw - (hold ? 2 : 0));
        report.push(
          prefix +
            " breach: " +
            raw +
            " − " +
            (hold ? 2 : 0) +
            " Hold = " +
            breaches[l] +
            ".",
        );
        if (breaches[l] > 0 && def.walls[l] > 0) {
          def.walls[l]--;
          breaches[l]--;
          report.push(laneNames[l] + " palisade spent 1 charge; absorbed 1.");
        }
      }
    }
    const total = breaches[0] + breaches[1];
    fort[q] = total;
    if (total > 0 && def.charges > 0) {
      const gate = gates[def.gate],
        l = breaches[0] >= breaches[1] ? 0 : 1;
      def.charges--;
      fort[q] = Math.max(0, total - gate.absorb);
      loss[p][l] += gate.counter;
      report.push(
        gate.name +
          " spent 1 charge: absorbed " +
          Math.min(total, gate.absorb) +
          ", countered " +
          gate.counter +
          " on " +
          laneNames[l] +
          ".",
      );
    }
    if (total)
      report.push((q ? "Rival" : "Your") + " fort lost " + fort[q] + " HP.");
  }
  for (const [p, s] of b.sides.entries()) {
    s.hp = Math.max(0, s.hp - fort[p]);
    s.lanes = s.lanes.map((lane, l) => {
      if (lane.length) lane[0].hp -= loss[p][l];
      for (const u of lane) u.guard = 0;
      return lane.filter((u) => u.hp > 0);
    });
  }
  b.log.push(...report);
  const [a, d] = b.sides;
  if (a.hp === 0 || d.hp === 0 || b.round === 8) {
    const health = (s: Side) => s.lanes.flat().reduce((n, u) => n + u.hp, 0);
    const diff = a.hp - d.hp || (a.hp ? health(a) - health(d) : 0);
    b.winner = diff === 0 ? -1 : diff > 0 ? 0 : 1;
    b.phase = "end";
    b.locked = null;
  } else {
    b.priority = other(b.priority);
    refill(b);
  }
}
export function drive(b: Battle) {
  while (b.phase === "muster" && b.turn === 1) act(b, chooseAction(b));
}
