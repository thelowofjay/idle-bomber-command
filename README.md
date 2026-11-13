# Idle Bomber Command — Prototype

A dependency-light portrait Canvas PWA proving the first operation loop: prepare from the Main Menu, browse the planned campaign and aircraft ladder, buy permanent improvements with medals, then deploy grenade-carrying canvas biplanes, spend temporary war bonds on sortie requisitions, and decide when to retreat before debrief. Boss war trophies and two 100-sector Theater Operations are visibly reserved for later systems.

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

The game pauses when its tab or window loses focus. Medals, boss trophies, aircraft, permanent upgrades, operation count, and settings persist in local storage. The settings gear includes muteable sound, a whole-sortie 2× speed option, confirmed progress reset, and a link to the separate **Sound Workshop**. That offline workshop offers 21 procedural alternatives across seven categories, including pulse-modeled radial engines, layered grenade mechanics and blast, the traditional Retreat bugle opening, and original 16-second tactical menu loops. Favorites persist locally; the workshop remains an audition space and does not alter the game mix until selections are approved. During every mission, the visible **Sortie Upgrades** control opens the temporary grenade-rack, armor-patch, and priority-servicing purchases. War bonds and sortie upgrades expire at debrief. The installed shell works offline after its first successful load.

Each biplane follows its nose through continuous turns at up to 120° per second, while its displayed position and heading ease between simulation updates. It departs through the visibly worn center apron path, releases one visible tumbling hand grenade before overflying its target, and the grenade falls for roughly one second before impact damage resolves. The force attacks a progression line of four small, south-facing, one-hit two-man foxholes, three two-hit artillery positions, and two hardened bunkers before the full nine-target position rebuilds. Loaded aircraft hold in a shorter inner circuit when the target position is down. A detailed 1940s-style cargo truck enters from either edge and physically follows the upper farm road as the moving priority target. Enemy fighters turn toward their selected aircraft before firing. Grenade drops earn temporary war bonds; destroyed targets earn permanent medals. Emergency Retreat recalls survivors, and the recovered-aircraft percentage adds the same percentage as a medal bonus—100% recovered doubles the medals earned in that operation.

## Verification

```bash
npm test
npm run test:browser
```

The browser test requires Chromium and a running local server. It exercises the revised brass-letter Main Menu, functional Campaign/Theaters/Records tabs, the 2×2 department grid, centered upgrade and settings windows, aircraft sprite preview, three-currency roles, 2× speed, temporary requisitions, smoothed nose-led motion, staggered departures, delayed visible grenade impacts, curved recovery, fighter pursuit turns, nine-target durability ordering, road-following priority diversion, survival medal bonus, debrief, responsive layout, service-worker control, the 21-choice Sound Workshop, and offline reloads for both routes. Pure mechanics tests verify costs, v3 trophy-to-medal migration, permanent engine-speed upgrades, medal math, falling-ordnance interpolation, reserved incoming damage, heading vectors, turn interpolation, and angle wraparound.

## Prototype boundary

This build shows later aircraft and operations as locked previews but intentionally excludes purchasing or deploying them, auto-deploy, the tail-gunner minigame, Theater Operations, New Campaign Orders, campaign ribbons, monetization, and native packaging. See `PRODUCT.md`, `PROTOTYPE.md`, and `DESIGN.md` for the decisions behind that boundary.
