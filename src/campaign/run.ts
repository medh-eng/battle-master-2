import { begin, starter, drive } from "../engine/rules.ts";
import type { Battle, Instance } from "../engine/rules.ts";
import { recipes, basics, units, gates } from "../data/cards.ts";
import type { Gate, Hybrid, Unit } from "../data/cards.ts";
export type Token = "armour" | "spikes";
export type Run = {
  version: 1;
  seed: number;
  stop: 1 | 2;
  scene: "battle" | "camp" | "result";
  battle: Battle;
  roster: Instance[];
  hp: number;
  gate: Gate;
  marks: number;
  token: Token | null;
  reward: boolean;
  fusions: number;
  fortUsed: boolean;
  repaired: boolean;
  buys: number;
  serial: number;
  history: string[];
};
export function start(seed: number): Run {
  const roster = starter(),
    battle = begin(seed, roster);
  drive(battle);
  return {
    version: 1,
    seed,
    stop: 1,
    scene: "battle",
    battle,
    roster,
    hp: 20,
    gate: "timber",
    marks: 0,
    token: null,
    reward: false,
    fusions: 0,
    fortUsed: false,
    repaired: false,
    buys: 0,
    serial: 12,
    history: [],
  };
}
export function finish(r: Run) {
  if (r.scene !== "battle" || r.battle.phase !== "end") return;
  r.hp = r.battle.sides[0].hp;
  const won = r.battle.winner === 0;
  r.history.push(
    (r.stop === 1 ? "Foundry Road" : "Copper Crossing") +
      " · " +
      (won ? "victory" : r.battle.winner === -1 ? "draw" : "defeat") +
      " in " +
      r.battle.round +
      " rounds",
  );
  if (won) r.marks += 6;
  r.scene = won && r.stop === 1 ? "camp" : "result";
}
export const offerToken = (r: Run): Token =>
  r.seed % 2 === 0 ? "armour" : "spikes";
export const offerUnit = (r: Run): Unit => basics[(r.seed >>> 2) % 4];
export function reward(r: Run, choice: "unit" | "token" | "marks") {
  if (r.scene !== "camp" || r.reward) return false;
  if (choice === "unit")
    r.roster.push({ id: "u" + r.serial++, kind: offerUnit(r) });
  if (choice === "token") r.token = offerToken(r);
  if (choice === "marks") r.marks += 2;
  r.reward = true;
  return true;
}
const atCamp = (r: Run) => r.scene === "camp" && r.reward;
export function canFuse(r: Run, h: Hybrid) {
  return (
    atCamp(r) &&
    r.fusions < 2 &&
    r.marks >= 3 &&
    r.roster.length > 8 &&
    [recipes[h], "cavalry"].every((k) => r.roster.some((c) => c.kind === k))
  );
}
export function fuse(r: Run, h: Hybrid, a: string, b: string) {
  const pair = r.roster.filter((c) => c.id === a || c.id === b);
  if (
    !canFuse(r, h) ||
    pair.length !== 2 ||
    !pair.some((c) => c.kind === recipes[h]) ||
    !pair.some((c) => c.kind === "cavalry")
  )
    return false;
  r.roster = r.roster.filter((c) => !pair.includes(c));
  r.roster.push({ id: "u" + r.serial++, kind: h });
  r.fusions++;
  r.marks -= 3;
  r.history.push("Forged " + units[h].name);
  return true;
}
export function gateUpgrade(r: Run) {
  if (
    !atCamp(r) ||
    r.fortUsed ||
    r.marks < 3 ||
    r.gate !== "timber" ||
    !r.token
  )
    return false;
  r.gate = r.token === "armour" ? "armoured" : "thorn";
  r.marks -= 3;
  r.token = null;
  r.fortUsed = true;
  r.history.push("Installed " + gates[r.gate].name);
  return true;
}
export function repair(r: Run) {
  if (!atCamp(r) || r.repaired || r.marks < 2 || r.hp >= 20) return false;
  r.hp = Math.min(20, r.hp + 5);
  r.marks -= 2;
  r.repaired = true;
  return true;
}
export function recruit(r: Run, kind: Unit) {
  if (
    !atCamp(r) ||
    r.buys >= 2 ||
    r.marks < 2 ||
    r.roster.length >= 16 ||
    !basics.includes(kind)
  )
    return false;
  r.roster.push({ id: "u" + r.serial++, kind });
  r.marks -= 2;
  r.buys++;
  return true;
}
export function march(r: Run) {
  if (!atCamp(r)) return false;
  const rival = starter().filter((c) => !["u2", "u3"].includes(c.id));
  rival.push({ id: "v12", kind: "horse_archer" });
  r.stop = 2;
  r.battle = begin(
    (r.seed ^ 0x419785) >>> 0,
    r.roster,
    r.hp,
    r.gate,
    rival,
    "armoured",
  );
  r.scene = "battle";
  drive(r.battle);
  return true;
}
