# Idle Bomber Command — Prototype

A dependency-light portrait Canvas PWA proving the first operation loop: prepare from the Main Menu, browse the planned campaign and aircraft ladder, buy permanent improvements with medals, then deploy one-bomb canvas biplanes, spend temporary war bonds on sortie requisitions, and decide when to retreat before debrief. Boss war trophies and two 100-sector Theater Operations are visibly reserved for later systems.

## Run locally

```bash
npm start
```

Open `http://127.0.0.1:4174`.

## Play the current build

- Durable URL: `https://thelowofjay.github.io/idle-bomber-command/`
- Hosting: GitHub Pages, deployed automatically from `main` by `.github/workflows/pages.yml`
- The site is independent of the development machine and remains available when the local service is stopped.

## Controls

- Swipe or use the arrows to browse operations, tap **Deploy to Trench Network**, open a department from the bottom dock, or use **Emergency Retreat**, **Pause**, **Resume**, upgrade actions, and exposed priority targets.
- `Space`: pause or resume an active operation.
- `1`: mark an exposed priority target.
- `R`: deploy from the Main Menu.

The game pauses when its tab or window loses focus. Medals, boss trophies, aircraft, permanent upgrades, operation count, and settings persist in local storage. The settings gear includes a whole-sortie 2× speed option and confirmed progress reset. During every mission, the visible **Sortie Upgrades** control opens the temporary grenade-rack, armor-patch, and priority-servicing purchases. War bonds and sortie upgrades expire at debrief. The installed shell works offline after its first successful load.

Each biplane follows its nose through continuous turns at up to 120° per second rather than sliding toward a new waypoint. It departs through the visibly worn center apron path, physically overflies its target, then makes a broad curving western approach to the runway’s left half before using the separate worn hangar-side exit. Loaded aircraft hold in a shorter inner circuit when the target position is down. Enemy fighters turn toward their selected aircraft before firing. Bomb drops earn temporary war bonds; destroyed targets earn permanent medals. Emergency Retreat recalls survivors, and the recovered-aircraft percentage adds the same percentage as a medal bonus—100% recovered doubles the medals earned in that operation.

## Verification

```bash
npm test
npm run test:browser
```

The browser test requires Chromium and a running local server. It exercises the Main Menu, operation and theater reservations, the 2×2 department grid, centered upgrade and settings windows, aircraft sprite preview, three-currency roles, 2× speed, temporary requisitions, nose-led motion, staggered departures, curved recovery, fighter pursuit turns, target ordering, priority diversion, survival medal bonus, debrief, responsive layout, service-worker control, and offline reload. Pure mechanics tests verify costs, v3 trophy-to-medal migration, permanent engine-speed upgrades, medal math, heading vectors, turn interpolation, and angle wraparound.

## Prototype boundary

This build shows later aircraft and operations as locked previews but intentionally excludes purchasing or deploying them, auto-deploy, the tail-gunner minigame, Theater Operations, New Campaign Orders, campaign ribbons, monetization, and native packaging. See `PRODUCT.md`, `PROTOTYPE.md`, and `DESIGN.md` for the decisions behind that boundary.
