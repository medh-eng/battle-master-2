# Production roadmap

Source of design decisions: *Battle Master 2 – The Fusion Forge*, GitHub Edition revision 03, 26 November 2026. Pages 4–13 define the combat and campaign economy. Pages 14–21 define presentation, asset handoff, production and acceptance. Each phase produces something the owner can play or inspect.

| Phase | Player experience and deliverables | Exit check |
| --- | --- | --- |
| 0 · Foundation | Landscape title, original heraldic cards, deterministic TypeScript model, Pixi scenery, GSAP fusion reveal, build and CI. | Clean checkout builds. Title and battlefield render at 844 × 390 and 1280 × 720. Verify hosted URL after Pages setup. |
| 1 · Foundry Road | Play an entire duel against a public-board rival. Four basic units, six fixed tactics, formation moves, secret orders, reactive walls and gate. | Complete eight rounds or break a fort. Review strike arithmetic, draw ordering, initiative, simultaneous damage and charge use. |
| 2 · The forge | Win six Marks, choose one reward, combine named card instances into a Horse Archer, Lancer or Knight. Pick armour or spikes when offered. Carry one build into Copper Crossing. | Win, fuse, upgrade, close and reopen. Check the parents have gone, the correct gate is installed, the next fight starts with full charges, and the seed can be replayed. |
| 3 · Full campaign | Add Twin Standards, Anvil Court, Amber Pass, Crown Approach and Foundry Crown. Complete 15 units, 13 forts, three components, reserves, route previews, single retry, full Codex, run chronicle and Veteran AI. | Verify all recipes, both Bastion routes and the sample economy ledger. Simulate 200 seeds per representative pair from both starting sides. Investigate dominant builds. |
| 4 · Art and playtesting | Replace plates batch by batch, high-priority portraits first. Integrate rival portraits, map, music and SFX. Add an expanded combat preview and a guided first encounter. | Check each portrait inside the real phone frame. With ten first-time players, target eight who can explain a fusion and a fort trigger and six who voluntarily replay. Record actual results. |
| 5 · Release | Offline web cache, save migrations, recovery/export, Android landscape wrapper and debug package, credits and release materials. | Test interrupted rounds and upgrades, real low-end Android, offline installation and local saves. Target first load ≤8 MB and sustained ≥30 fps on selected devices. Signing and publication need the owner’s store setup. |

## Replay design

Show the trade before the purchase. A Horse Archer replaces two cheap bodies and can support from the rear. A Lancer punishes a mounted opponent. A Knight costs more Supply and can anchor a lane defensively. An armour reward can strengthen a gate now or become an army investment once equipment recipes ship.

Use the same-seed replay to test a different decision against the same draw. Use a fresh seed for a new opening hand and reward. Add the daily challenge and cosmetic banners after human playtests show that the base campaign earns repeat play.

## Next playable gate

Complete the third encounter with two disclosed routes, persistent route choices and an armour-versus-elite recipe decision. Keep the current two-duel expedition available as a regression fixture. The art team can deliver batch 1 immediately.
