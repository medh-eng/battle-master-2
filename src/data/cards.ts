export const units = {
  swordsman: {
    name: "Swordsman",
    cost: 2,
    atk: 2,
    def: 0,
    hp: 4,
    role: "Vanguard",
    text: "A durable lead. Four health keeps the front line standing.",
  },
  pikeman: {
    name: "Pikeman",
    cost: 2,
    atk: 2,
    def: 0,
    hp: 3,
    role: "Anti-mounted",
    text: "Deals +1 damage against a mounted lead.",
  },
  archer: {
    name: "Archer",
    cost: 2,
    atk: 2,
    def: 0,
    hp: 3,
    role: "Support",
    text: "Adds 1 attack from the rear in a contested lane.",
  },
  cavalry: {
    name: "Cavalry",
    cost: 2,
    atk: 2,
    def: 0,
    hp: 3,
    role: "Mounted",
    text: "As lead, moves its formation into an empty lane for free.",
  },
  horse_archer: {
    name: "Horse Archer",
    cost: 3,
    atk: 3,
    def: 0,
    hp: 4,
    role: "Mounted support",
    text: "Free formation move as lead. Support 1 from the rear.",
  },
  lancer: {
    name: "Lancer",
    cost: 3,
    atk: 3,
    def: 0,
    hp: 4,
    role: "Mounted counter",
    text: "Free formation move as lead. +1 against mounted leads.",
  },
  knight: {
    name: "Knight",
    cost: 4,
    atk: 3,
    def: 1,
    hp: 5,
    role: "Mounted guard",
    text: "Free formation move as lead. Gains 1 extra Guard when holding.",
  },
} as const;
export type Unit = keyof typeof units;
export const basics: Unit[] = ["swordsman", "pikeman", "archer", "cavalry"];
export const tactics = {
  change_standard: {
    name: "Change Standard",
    cost: 1,
    text: "Swap your lead and rear.",
  },
  field_rest: {
    name: "Field Rest",
    cost: 1,
    text: "Restore 2 HP to a wounded unit.",
  },
  shield_screen: {
    name: "Shield Screen",
    cost: 1,
    text: "Give a friendly lead 2 Guard this clash.",
  },
  scout_ledger: {
    name: "Scout Ledger",
    cost: 1,
    text: "Draw two, then place one card under your deck.",
  },
  resupply: { name: "Resupply", cost: 0, text: "Gain 1 Supply, up to 7." },
  fort_rally: {
    name: "Fort Rally",
    cost: 2,
    text: "Restore one spent wall charge.",
  },
} as const;
export type Tactic = keyof typeof tactics;
export type Card = Unit | Tactic;
export const isUnit = (card: Card): card is Unit => card in units;
export const cardInfo = (card: Card) =>
  isUnit(card) ? units[card] : tactics[card];
export const mounted = (u: Unit) =>
  ["cavalry", "horse_archer", "lancer", "knight"].includes(u);
export const support = (u?: Unit) =>
  u === "archer" || u === "horse_archer" ? 1 : 0;
export const recipes = {
  horse_archer: "archer",
  lancer: "pikeman",
  knight: "swordsman",
} as const;
export type Hybrid = keyof typeof recipes;
export const gates = {
  timber: { name: "Timber Gate", charges: 1, absorb: 1, counter: 0 },
  armoured: { name: "Armoured Gate", charges: 2, absorb: 2, counter: 0 },
  thorn: { name: "Thorn Gate", charges: 2, absorb: 1, counter: 2 },
} as const;
export type Gate = keyof typeof gates;
export const laneNames = ["Road", "Ridge"];
