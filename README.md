# Battle Master II · The Fusion Forge

A landscape-first, single-player card campaign set on the Ironwake frontier. Muster on Road and Ridge, lock a secret order, and carry your surviving citadel to the forge. The first playable milestone covers Foundry Road, one camp, and Copper Crossing.

## Play and develop

Use Node 22.18 or later. Run `npm ci`, then `npm run dev` and open the URL Vite prints. For a release build, run `npm run build`. Serve `dist/` over HTTP. GitHub Actions also builds a downloadable, standalone **Battle-Master-II.html** that opens directly in a browser.

The first expedition uses a fixed teaching seed. Finish a run to replay the same seed or draw a fresh expedition. The game saves each committed action on this device. If storage is blocked, the game displays a session-only notice.

## Project files

- [Phased roadmap](ROADMAP.md) and [current tasks](TASKS.md)
- [Game rules and prototype boundaries](DESIGN.md)
- [First art commission and crop requirements](art/ART_BRIEF.md)
- [Machine-readable art manifest](art/ASSET_MANIFEST.json)

## Checks

Run `npm test`, `npm run check:art`, `npm run typecheck`, and `npm run build`. The browser smoke test walks through a duel, camp fusion, reload, second duel and replay.

Original code and interim heraldic illustrations. Dedicated painted assets arrive through the art project.
