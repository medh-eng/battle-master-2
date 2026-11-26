import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve as fullPath } from "node:path";
import { chromium } from "playwright";
import { chooseAction, chooseOrder } from "../src/engine/rules.ts";

const port = Number(process.env.SMOKE_PORT ?? 4398),
  url = "http://127.0.0.1:" + port;
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  browser = await chromium.launch({ args: ["--no-sandbox"] });
  await mkdir("playwright-report", { recursive: true });
  for (const [width, height] of [
    [844, 390],
    [1280, 720],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    const click = async (action) =>
      page
        .locator('button[data-do="' + action + '"]:visible')
        .last()
        .click();
    const state = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("bm2.ironwake.v1")));
    await page.locator(".hero-card").waitFor();
    await page.screenshot({
      path: "playwright-report/title-" + width + ".png",
    });
    await click("detail-horse_archer");
    assert(await page.getByRole("dialog").isVisible());
    await click("close");
    await click("new");
    await page.screenshot({ path: "playwright-report/duel-" + width + ".png" });
    assert(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
      "initial duel must fit viewport",
    );
    async function duel() {
      for (let n = 0; n < 130; n++) {
        const r = await state();
        if (r.scene !== "battle") return r;
        const b = r.battle;
        if (b.phase === "order") {
          const o = chooseOrder(b, 0);
          await click("lane-" + o.lane);
          await click("order-" + o.mode);
          await click("clash");
          await click("close");
          continue;
        }
        const a = chooseAction(b);
        if (a.type === "pass") {
          await click("pass");
          continue;
        }
        if (a.type === "move") {
          await click("move-" + a.lane);
          continue;
        }
        await click("hand-" + a.card);
        if (a.type === "play")
          await click(
            a.lane === undefined
              ? "use"
              : "target-" + a.lane + "-" + (a.slot ?? "n"),
          );
      }
      assert.fail("Duel did not finish");
    }
    const camp = await duel();
    assert.equal(camp.scene, "camp");
    assert.equal(camp.marks, 6);
    await click("reward-token");
    await click("forge-horse_archer");
    await click("confirm-horse_archer");
    await click("close");
    await click("upgrade");
    await page.screenshot({ path: "playwright-report/camp-" + width + ".png" });
    const forged = await state();
    assert.equal(forged.roster.length, 11);
    assert.equal(forged.gate, "armoured");
    assert.equal(forged.marks, 0);
    await page.reload();
    await click("resume");
    assert.deepEqual(await state(), forged);
    await click("march");
    assert.equal((await state()).stop, 2);
    assert.equal((await state()).battle.sides[0].charges, 2);
    assert.equal((await duel()).scene, "result");
    await click("again");
    assert.equal((await state()).seed, camp.seed);
    assert.deepEqual((await state()).roster.length, 12);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      width +
        " × " +
        height +
        ": two duels, fusion, reload, gate, seed replay passed.",
    );
  }
  const filePage = await browser.newPage();
  await filePage.goto(
    pathToFileURL(fullPath("dist/Battle-Master-II.html")).href,
  );
  await filePage.locator("[data-do=new]").click();
  await filePage.locator(".lanes").waitFor();
  console.log("Standalone HTML opens directly from disk.");
} finally {
  await browser?.close();
  server.kill();
}
