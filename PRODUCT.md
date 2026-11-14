# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: dependency-light static HTML, CSS, Canvas, and ES modules, packaged as an installable offline PWA. This keeps the first prototype fast to inspect on phones and leaves Android wrapping as a later decision.

## Users

The primary user is a mobile idle/incremental-game player checking in during short interruptions as well as leaving longer operations running. They want visible growth, readable optimization choices, and optional moments of active control without making constant attention mandatory.

## Product Purpose

Idle Bomber Command tests whether a visibly persistent bomber force can make an optimization-heavy idle loop satisfying. The first prototype succeeds when launching one pathetic canvas biplane, watching it attack and eventually fail, then improving the next operation feels clear and compelling enough to repeat.

## Positioning

Every aircraft remains owned and strategically relevant: fleet composition, target fit, and type-wide upgrades matter more than replacing yesterday's unit with today's larger number.

## Operating Context

Portrait phone play, often interrupted. The intended core rhythm is prepare from the Main Menu, browse operations and aircraft, deploy, earn and spend war bonds on temporary in-operation upgrades, destroy targets to earn medals, react to priority targets, optionally order an emergency retreat, review the debrief, then return to the Main Menu and spend medals on permanent upgrades. Boss war trophies are a reserved later-game currency. The prototype must pause safely when backgrounded and remain understandable in short sessions.

## Capabilities and Constraints

- First prototype: one illustrated Main Menu with a one-time sound-unlock command gate, polished brass title lettering, tightly grouped currency balances, squadron identity, Campaign/Theaters/Records tabs, an arrow-and-swipe operation selector for eleven missions, two reserved 100-sector Theater Operations, a 2×2 department grid, centered upgrade windows with an aircraft sprite preview and swipeable eleven-aircraft roadmap, Requisitions, Armory, Maintenance, Flight Operations, a settings window with whole-sortie 2× speed and an optional auto-pause for Sortie Upgrades, a six-channel Sound Mix with previews, and a separate 21-choice Sound Workshop whose favorites become production cues, one playable Trench Network battlefield, one canvas biplane type, runway operations, loaded and empty flight circuits, visible delayed grenade drops, smoothed aircraft presentation, flak, health, nine-target waves with first-hit durability teaching, a road-following priority cargo truck, sorties, war bonds, a temporary debrief, a post-first-sortie install offer where supported, aircraft purchases, type-wide upgrades, manual deployment, emergency retreat, local save, pause, and settings.
- The implemented economy uses war bonds as temporary sortie currency earned from grenades dropped and medals as persistent currency earned from targets destroyed. War bonds buy in-operation requisitions and expire at debrief; medals buy aircraft and permanent upgrades from the Main Menu. War trophies are displayed but reserved for future boss opponents. The recovered-aircraft percentage adds the same percentage as a medal bonus.
- Tail-gunner play, Theater Operations, New Campaign Orders, campaign ribbons, monetization, and native packaging are excluded from the first prototype.
- Exact combat and economy values are deliberately exposed as prototype tuning data.

## Brand Commitments

- Working title: **Idle Bomber Command**.
- Tone: recognizable military aviation history gradually becoming dieselpunk and gloriously absurd, without using real-world extremist or nationalist insignia as decoration.
- Product language stays inside the fiction: operations, sorties, war bonds, debriefs, orders, campaigns, and doctrines rather than generic idle-game terminology.

## Evidence on Hand

The game design and decisions are recorded in `DESIGN.md`. The prototype now has authored battlefield, aircraft, and main-menu lineup artwork and one qualitative player-test result: the first loop held the project owner for roughly fifteen minutes despite the original placeholder presentation. There are no performance benchmarks or commercial claims; future work must not fabricate them.

## Product Principles

1. Make fleet growth visible before making it numerically large.
2. Keep the arithmetic legible enough for players to understand why a build performs well.
3. Reward attention without making attention mandatory.
4. Preserve interruption safety and useful progress in short phone sessions.
5. Prove the first-hour loop before constructing endgame systems.

## Accessibility & Inclusion

Use labels, shape, fill, and motion—not color alone—to communicate state. Support keyboard input, reduced motion, screen-reader announcements for major state changes, minimum 44px touch targets, and readable contrast.
