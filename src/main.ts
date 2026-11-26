import "./style.css";
import { gsap } from "gsap";
import { stage } from "./game/stage.ts";
import { plate } from "./game/art.ts";
import {
  units,
  basics,
  recipes,
  gates,
  cardInfo,
  isUnit,
  laneNames,
} from "./data/cards.ts";
import type { Card, Hybrid, Unit } from "./data/cards.ts";
import { act, drive, legal, orders, resolve } from "./engine/rules.ts";
import { mounted } from "./data/cards.ts";
import type { Action, Order } from "./engine/rules.ts";
import {
  start,
  finish,
  reward,
  offerToken,
  offerUnit,
  canFuse,
  fuse,
  gateUpgrade,
  recruit,
  repair,
  march,
} from "./campaign/run.ts";
import { load, save } from "./meta/save.ts";
import assetRows from "../art/ASSET_MANIFEST.json";

const app = document.querySelector<HTMLElement>("#app")!,
  dialog = document.querySelector<HTMLDialogElement>("#dialog")!;
const approved = new Map(
  assetRows
    .filter((a) => a.status === "approved")
    .map((a) => [a.id, a.runtime]),
);
let run = load(),
  home = true,
  selected: string | null = null,
  lane = 0,
  order: Order["mode"] = "press",
  notice = "",
  saveFailed = false;
const titleNames = ["Foundry Road", "Copper Crossing"];
const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const label = (s: string) => s[0].toUpperCase() + s.slice(1);
const asset = (key: string) =>
  approved.has(key) ? import.meta.env.BASE_URL + approved.get(key) : null;
const btn = (a: string, name: string, cls = "", disabled = false) =>
  '<button type="button" data-do="' +
  a +
  '" class="' +
  cls +
  '" ' +
  (disabled ? "disabled" : "") +
  ">" +
  name +
  "</button>";
const seal = '<span class="brand-seal" aria-hidden="true"><b>Ⅱ</b></span>';
const brand = seal + '<span class="brand-name">BATTLE MASTER <i>II</i></span>';
function picture(kind: Card) {
  const src = asset((isUnit(kind) ? "u_" : "t_") + kind);
  return (
    '<img class="painting" alt="" data-kind="' +
    kind +
    '" src="' +
    (src ?? plate(kind)) +
    '">'
  );
}
function largeCard(kind: Unit, extra = "") {
  const u = units[kind],
    tier = kind in recipes ? "II" : "I";
  return (
    '<div class="collector ' +
    extra +
    '">' +
    picture(kind) +
    '<div class="inner-frame"></div><span class="tier">' +
    tier +
    '</span><div class="cardtitle"><small>' +
    u.role +
    "</small><strong>" +
    u.name +
    "</strong><span>" +
    u.atk +
    " ATK <i>◆</i> " +
    u.def +
    " DEF <i>◆</i> " +
    u.hp +
    " HP</span></div></div>"
  );
}
function top(context: string) {
  return (
    '<header><button data-do="home" class="brand">' +
    brand +
    '</button><span class="context">' +
    context +
    "</span><nav>" +
    btn("codex", "Forge Codex", "nav-link") +
    btn("help", "?", "help") +
    "</nav></header>"
  );
}
function homeView() {
  const resumable = run && run.scene !== "result";
  return (
    top("Ironwake frontier") +
    '<main class="home"><section class="intro"><span class="eyebrow"><i></i> THE IRONWAKE CAMPAIGN</span><h1>Battle Master <em>II</em></h1><h2>The Fusion Forge</h2><p>Two lanes. One citadel. Combine your regiments at the forge and carry your new army into the next duel.</p><div class="home-actions">' +
    btn(
      resumable ? "resume" : "new",
      resumable ? "Resume campaign &nbsp; →" : "Enter the campaign &nbsp; →",
      "primary",
    ) +
    btn("codex", "Explore the cards", "quiet") +
    '</div></section><section class="showcase" aria-label="Featured fusion"><div class="display-stack">' +
    largeCard("archer", "back left") +
    largeCard("cavalry", "back right") +
    '<button data-do="detail-horse_archer" aria-label="Inspect Horse Archer" class="hero-card">' +
    largeCard("horse_archer") +
    '</button></div><div class="caption"><span>ARCHER</span><b>+</b><span>CAVALRY</span><b>→</b><strong>HORSE ARCHER</strong></div></section></main><footer><span>◆ &nbsp; FOUNDRY ROAD</span><i></i><span>COPPER CROSSING &nbsp; ◆</span></footer>'
  );
}
function popup(title: string, body: string) {
  dialog.innerHTML =
    '<div class="modal-head"><h2>' +
    title +
    "</h2>" +
    btn("close", "Close", "quiet") +
    "</div>" +
    body;
  if (!dialog.open) dialog.showModal();
}
function codex() {
  popup(
    "Forge Codex",
    '<p class="muted">Inspect a regiment to see its role and its recipe.</p><div class="gallery">' +
      Object.keys(units)
        .map(
          (k) =>
            '<button aria-label="Inspect ' +
            units[k as Unit].name +
            '" data-do="detail-' +
            k +
            '">' +
            largeCard(k as Unit) +
            "</button>",
        )
        .join("") +
      "</div>",
  );
}
function detail(kind: Unit) {
  const h = kind in recipes ? (kind as Hybrid) : null,
    u = units[kind];
  const paths = Object.entries(recipes)
    .filter(([, k]) => k === kind || kind === "cavalry")
    .map(([k]) => units[k as Unit].name);
  popup(
    u.name,
    '<div class="inspect">' +
      largeCard(kind) +
      '<div><span class="eyebrow">' +
      u.role +
      "</span><h3>" +
      u.cost +
      " Supply</h3><p>" +
      u.text +
      "</p><p>" +
      (h
        ? "Forge at camp for 3 Marks. Combine " +
          units[recipes[h]].name +
          " and Cavalry."
        : "Can forge into " + paths.join(", ") + ".") +
      "</p>" +
      btn("codex", "All cards", "quiet") +
      "</div></div>",
  );
}
function help() {
  popup(
    "How to play",
    '<ol class="instructions"><li><b>Muster.</b> Select a card, then choose Road or Ridge. The first unit leads. An Archer behind it adds one attack against an enemy lead.</li><li><b>End muster.</b> Your rival finishes deploying. Pick one lane and secretly order Press, Hold, or Forge Pulse if its wall is spent.</li><li><b>Clash.</b> Strikes land together. An open lane hits the wall, then the gate, then the fort. The round log explains every hit.</li><li><b>Win the duel.</b> Break the rival fort or lead on fort HP after eight rounds. Surviving unit HP breaks ties.</li><li><b>Forge at camp.</b> A win earns six Marks and a reward. Spend three Marks to combine two regiments, or upgrade a gate with a matching component.</li></ol>',
  );
}
function battleView() {
  const b = run!.battle,
    [s, r] = b.sides,
    must = b.phase === "muster",
    moves = legal(b);
  const pending = b.pending[0],
    chosen = s.hand.find((c) => c.id === selected),
    info = chosen ? cardInfo(chosen.kind) : null;
  const sides = (p: number, l: number) => {
    const formation = b.sides[p].lanes[l];
    return (
      '<div class="formation ' +
      (p ? "enemy" : "friendly") +
      '"><small>' +
      (p ? "RIVAL" : "YOU") +
      "</small>" +
      [0, 1]
        .map((i) => {
          const u = formation[i];
          if (!u)
            return (
              '<span class="empty-slot">' + (i ? "Rear" : "Lead") + "</span>"
            );
          return (
            '<span class="unit-chip" title="' +
            units[u.card.kind].name +
            '">' +
            picture(u.card.kind) +
            "<span>" +
            units[u.card.kind].name +
            "<small>" +
            units[u.card.kind].atk +
            " ATK · " +
            u.hp +
            " HP" +
            (u.guard ? " · " + u.guard + " Guard" : "") +
            "</small></span></span>"
          );
        })
        .join("") +
      "</div>"
    );
  };
  const lanes = [0, 1]
    .map((l) => {
      const targets = moves.filter((m) => m.card === selected && m.lane === l);
      const moving = moves.some((m) => m.type === "move" && m.lane === l);
      return (
        '<section class="lane ' +
        (!must && lane === l ? "active" : "") +
        '"><div class="lane-head"><h3>' +
        laneNames[l] +
        "</h3><span>Wall " +
        s.walls[l] +
        "/1 · Rival " +
        r.walls[l] +
        "/1</span></div>" +
        sides(1, l) +
        sides(0, l) +
        '<div class="lane-controls">' +
        (must
          ? targets.length
            ? targets
                .map((t) =>
                  btn(
                    "target-" + l + "-" + (t.slot ?? "n"),
                    (chosen && isUnit(chosen.kind) ? "Deploy" : "Use tactic") +
                      (t.slot === undefined
                        ? " here"
                        : t.slot === 0
                          ? " on lead"
                          : " on rear"),
                    "target",
                  ),
                )
                .join("")
            : moving
              ? btn(
                  "move-" + l,
                  "Move → " +
                    laneNames[1 - l] +
                    " · " +
                    (mounted(s.lanes[l][0].card.kind) ? "free" : "1 Supply"),
                  "subtle",
                )
              : ""
          : btn(
              "lane-" + l,
              lane === l ? "Selected lane" : "Select " + laneNames[l],
              lane === l ? "target" : "subtle",
            )) +
        "</div></section>"
      );
    })
    .join("");
  const cards =
    s.hand
      .map((c) => {
        const u = cardInfo(c.kind),
          available = moves.some((m) => m.card === c.id);
        return (
          '<button class="hand-card ' +
          (selected === c.id ? "picked" : "") +
          '" data-do="hand-' +
          c.id +
          '" ' +
          (!must ? "disabled" : "") +
          ' aria-label="' +
          u.name +
          ", " +
          u.cost +
          " Supply" +
          (!available ? ", cannot play now" : "") +
          '">' +
          picture(c.kind) +
          '<span class="cost">' +
          u.cost +
          "</span><strong>" +
          u.name +
          "</strong></button>"
        );
      })
      .join("") || '<span class="muted">Your hand is empty.</span>';
  const global =
    chosen &&
    moves.some(
      (m) => m.type === "play" && m.card === chosen.id && m.lane === undefined,
    );
  const summary = must
    ? pending
      ? pending === "bottom"
        ? "Scout Ledger · Choose one card to put under your deck."
        : "Choose excess cards to discard."
      : chosen
        ? info!.name +
          " · " +
          info!.text +
          (moves.some((m) => m.card === chosen.id)
            ? ""
            : " Currently unavailable.")
        : "Select a card to deploy or play a tactic."
    : "Choose one lane and one order before the clash.";
  const legalOrders = orders(s);
  return (
    top("Encounter " + run!.stop + " of 2") +
    '<main class="battle"><div class="battle-title"><div><span class="eyebrow">ROUND ' +
    b.round +
    " / 8 &nbsp; · &nbsp; " +
    (must ? "MUSTER" : "SECRET ORDER") +
    "</span><h2>" +
    titleNames[run!.stop - 1] +
    '</h2></div><div class="vitals"><span>Your fort <b>' +
    s.hp +
    "</b><small>" +
    gates[s.gate].name +
    " " +
    s.charges +
    "/" +
    gates[s.gate].charges +
    "</small></span><span>Rival fort <b>" +
    r.hp +
    "</b><small>" +
    gates[r.gate].name +
    " " +
    r.charges +
    "/" +
    gates[r.gate].charges +
    '</small></span></div></div><div class="lanes">' +
    lanes +
    '</div><div class="command"><p aria-live="polite">' +
    esc(summary) +
    "</p><div>" +
    (must
      ? (global ? btn("use", "Play " + info!.name, "target") : "") +
        btn("pass", "End muster →", "primary", !!pending)
      : ["press", "hold", "pulse"]
          .map((m) =>
            btn(
              "order-" + m,
              m === "pulse" ? "Forge Pulse" : label(m),
              order === m ? "target" : "subtle",
              !legalOrders.some((o) => o.lane === lane && o.mode === m),
            ),
          )
          .join("") + btn("clash", "Reveal clash →", "primary")) +
    "</div></div>" +
    (!must
      ? '<div class="order-hint">' +
        (order === "press"
          ? "Press · +1 attack or +1 open-lane breach."
          : order === "hold"
            ? "Hold · +2 lead Guard or absorb 2 breach in an empty lane."
            : "Forge Pulse · Restore 1 charge to this wall before the clash.") +
        "</div>"
      : "") +
    '<section class="hand"><div class="hand-label"><b>' +
    s.supply +
    " / 7</b> Supply<small>" +
    s.pile.length +
    ' in deck</small></div><div class="hand-tray">' +
    cards +
    "</div>" +
    btn("log", "Clash log", "subtle") +
    "</section></main>"
  );
}
function campView() {
  const r = run!,
    token = offerToken(r);
  let shop = "";
  if (!r.reward) {
    shop =
      '<h3>Choose your victory reward</h3><div class="choices">' +
      btn(
        "reward-token",
        label(token) +
          "<small>Unlocks " +
          (token === "armour" ? "Armoured" : "Thorn") +
          " Gate</small>",
        "choice",
      ) +
      btn(
        "reward-unit",
        units[offerUnit(r)].name + "<small>Add one regiment</small>",
        "choice",
      ) +
      btn(
        "reward-marks",
        "2 extra Marks<small>Spend on camp services</small>",
        "choice",
      ) +
      "</div>";
  } else {
    shop =
      '<div class="camp-grid"><section><h3>Regiment forge</h3><div class="forge-cards">' +
      (Object.keys(recipes) as Hybrid[])
        .map(
          (h) =>
            '<button data-do="forge-' +
            h +
            '" ' +
            (canFuse(r, h) ? "" : "disabled") +
            ">" +
            largeCard(h) +
            "<span>" +
            units[recipes[h]].name +
            " + Cavalry</span><b>3 Marks</b></button>",
        )
        .join("") +
      '</div></section><section class="workshop"><h3>Citadel workshop</h3><p>' +
      gates[r.gate].name +
      " · " +
      r.hp +
      "/20 fort HP</p>" +
      btn(
        "upgrade",
        r.token
          ? "Forge " +
              (r.token === "armour" ? "Armoured" : "Thorn") +
              " Gate · 3 Marks"
          : "Gate forge · component required",
        "quiet",
        !r.token || r.fortUsed || r.marks < 3,
      ) +
      btn(
        "repair",
        "Repair up to 5 HP · 2 Marks",
        "quiet",
        r.repaired || r.marks < 2 || r.hp >= 20,
      ) +
      btn(
        "recruit",
        "Recruit a basic · 2 Marks",
        "quiet",
        r.buys >= 2 || r.marks < 2 || r.roster.length >= 16,
      ) +
      "</section></div>";
  }
  return (
    top("Campaign camp") +
    '<main class="page"><span class="eyebrow">FOUNDRY ROAD · VICTORY</span><div class="heading-row"><h1>The Forge</h1><b class="balance">' +
    r.marks +
    " Marks · " +
    r.roster.length +
    " units</b></div>" +
    shop +
    '<p class="status" aria-live="polite">' +
    esc(notice) +
    "</p>" +
    (r.reward
      ? '<div class="next"><div><span class="eyebrow">NEXT · COPPER CROSSING</span><p>Copper Captain · Horse Archer, Armoured Gate, two Palisades. Entry fort HP ' +
        r.hp +
        ".</p></div>" +
        btn("march", "March to battle →", "primary") +
        "</div>"
      : "") +
    "</main>"
  );
}
function resultView() {
  const r = run!,
    won = r.battle.winner === 0,
    draw = r.battle.winner === -1;
  return (
    top("Campaign chronicle") +
    '<main class="page result"><span class="eyebrow">IRONWAKE · SEED ' +
    r.seed +
    "</span><h1>" +
    (won ? "Crossing secured" : draw ? "A drawn duel" : "The citadel falls") +
    "</h1><p>" +
    titleNames[r.stop - 1] +
    " ended with " +
    r.hp +
    " fort HP and " +
    r.marks +
    " Marks. Your final army held " +
    r.roster.length +
    " regiments.</p><ul>" +
    r.history.map((v) => "<li>" + esc(v) + "</li>").join("") +
    '</ul><div class="home-actions">' +
    btn("again", "Replay this seed", "primary") +
    btn("newseed", "New expedition", "quiet") +
    btn("log", "Last clash", "quiet") +
    "</div></main>"
  );
}
function render() {
  app.innerHTML =
    home || !run
      ? homeView()
      : run.scene === "battle"
        ? battleView()
        : run.scene === "camp"
          ? campView()
          : resultView();
  const bgKey =
    run?.stop === 2 && !home ? "b_copper_crossing" : "b_foundry_road";
  const stageEl = document.querySelector<HTMLElement>("#stage")!;
  stageEl.style.backgroundImage = asset(bgKey)
    ? 'url("' + asset(bgKey) + '")'
    : "";
  stageEl.classList.toggle("approved", !!asset(bgKey));
  if (saveFailed)
    app.insertAdjacentHTML(
      "beforeend",
      '<p role="alert" class="save-warning">Storage unavailable. Progress lasts for this session.</p>',
    );
}
function persist() {
  if (run) saveFailed = !save(run);
  render();
}
function nextSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
function newRun(seed: number) {
  run = start(seed);
  home = false;
  notice = "";
  selected = null;
  lane = 0;
  order = "press";
  persist();
}
function play(a: Action) {
  if (!run) return;
  act(run.battle, a);
  drive(run.battle);
  selected = null;
  persist();
}
function log() {
  if (!run) return;
  popup(
    "Clash log",
    '<div class="events">' +
      (run.battle.log.length
        ? run.battle.log
            .map(
              (t) =>
                '<p class="' +
                (t.startsWith("Round ") ? "round" : "") +
                '">' +
                esc(t) +
                "</p>",
            )
            .join("")
        : "<p>Orders and clashes will appear here.</p>") +
      "</div>",
  );
  const e = dialog.querySelector(".events")!;
  e.scrollTop = e.scrollHeight;
}
function chooseForge(h: Hybrid) {
  const r = run!;
  if (!canFuse(r, h)) return;
  const select = (kind: Unit, id: string) =>
    "<label>" +
    units[kind].name +
    '<select id="' +
    id +
    '">' +
    r.roster
      .filter((c) => c.kind === kind)
      .map(
        (c) =>
          '<option value="' +
          c.id +
          '">' +
          units[kind].name +
          " · " +
          c.id +
          "</option>",
      )
      .join("") +
    "</select></label>";
  popup(
    "Forge " + units[h].name,
    '<div class="inspect">' +
      largeCard(h) +
      "<div><p>" +
      units[h].text +
      "</p><p>" +
      r.roster.length +
      " → " +
      (r.roster.length - 1) +
      " units · " +
      units[h].cost +
      " Supply to deploy.</p>" +
      select(recipes[h], "parent-a") +
      select("cavalry", "parent-b") +
      btn("confirm-" + h, "Confirm fusion · 3 Marks", "primary") +
      "</div></div>",
  );
}
document.addEventListener("click", (event) => {
  const el = (event.target as Element).closest<HTMLButtonElement>(
    "button[data-do]",
  );
  if (!el || el.disabled) return;
  const action = el.dataset.do!,
    [op, arg, slot] = action.split("-");
  if (op === "close") {
    dialog.close();
    return;
  }
  if (op === "codex") {
    codex();
    return;
  }
  if (op === "help") {
    help();
    return;
  }
  if (op === "detail") {
    detail(arg as Unit);
    return;
  }
  if (op === "home") {
    home = true;
    render();
    return;
  }
  if (op === "new") {
    newRun(run ? nextSeed() : 2194);
    return;
  }
  if (op === "resume") {
    home = false;
    render();
    return;
  }
  if (!run) return;
  const r = run,
    b = r.battle;
  if (op === "log") {
    log();
    return;
  }
  if (op === "again" || op === "newseed") {
    newRun(op === "again" ? r.seed : nextSeed());
    return;
  }
  if (op === "hand") {
    if (b.pending[0]) {
      const a = legal(b).find((x) => x.card === arg);
      if (a) play(a);
      return;
    }
    selected = selected === arg ? null : arg;
    render();
    return;
  }
  if (op === "target" || op === "use") {
    const a = legal(b).find(
      (x) =>
        x.type === "play" &&
        x.card === selected &&
        (op === "use"
          ? x.lane === undefined
          : x.lane === Number(arg) &&
            (x.slot === undefined ? slot === "n" : x.slot === Number(slot))),
    );
    if (a) play(a);
    return;
  }
  if (op === "pass") {
    play({ type: "pass" });
    return;
  }
  if (op === "move") {
    play({ type: "move", lane: Number(arg) });
    return;
  }
  if (op === "lane") {
    lane = Number(arg);
    if (!orders(b.sides[0]).some((o) => o.mode === order && o.lane === lane))
      order = "press";
    render();
    return;
  }
  if (op === "order") {
    order = arg as Order["mode"];
    render();
    return;
  }
  if (op === "clash") {
    const from = b.log.length;
    resolve(b, { lane, mode: order });
    const clash = b.log.slice(from);
    drive(b);
    finish(r);
    order = "press";
    selected = null;
    persist();
    popup(
      "Clash report",
      '<div class="events">' +
        clash.map((t) => "<p>" + esc(t) + "</p>").join("") +
        "</div>" +
        btn(
          "close",
          r.scene === "camp"
            ? "Enter the forge"
            : r.scene === "result"
              ? "See chronicle"
              : "Continue",
          "primary",
        ),
    );
    return;
  }
  if (op === "reward") {
    reward(r, arg as "unit" | "marks" | "token");
    notice = "Reward collected.";
  }
  if (op === "forge") {
    chooseForge(arg as Hybrid);
    return;
  }
  if (op === "confirm") {
    const h = arg as Hybrid,
      a = dialog.querySelector<HTMLSelectElement>("#parent-a")!,
      c = dialog.querySelector<HTMLSelectElement>("#parent-b")!;
    if (fuse(r, h, a.value, c.value)) {
      notice = units[h].name + " joined your army.";
      popup(
        "Fusion complete",
        '<div class="reveal">' +
          largeCard(h) +
          "<p>" +
          esc(notice) +
          "</p>" +
          btn("close", "Return to camp", "primary") +
          "</div>",
      );
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        gsap.from(dialog.querySelector(".collector"), {
          scale: 0.85,
          opacity: 0.1,
          y: 15,
          duration: 0.4,
        });
    }
  }
  if (op === "upgrade" && gateUpgrade(r))
    notice = gates[r.gate].name + " installed.";
  if (op === "repair" && repair(r))
    notice = "Fort restored to " + r.hp + " HP.";
  if (op === "recruit") {
    popup(
      "Choose a recruit",
      '<div class="choices">' +
        basics.map((k) => btn("buy-" + k, units[k].name, "choice")).join("") +
        "</div>",
    );
    return;
  }
  if (op === "buy" && recruit(r, arg as Unit)) {
    dialog.close();
    notice = units[arg as Unit].name + " recruited.";
  }
  if (op === "march") {
    march(r);
    selected = null;
    lane = 0;
    order = "press";
  }
  persist();
});
document.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (
      img instanceof HTMLImageElement &&
      img.dataset.kind &&
      !img.src.startsWith("data:")
    )
      img.src = plate(img.dataset.kind as Card);
  },
  true,
);
render();
void stage();
