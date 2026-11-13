---
name: Idle Bomber Command
description: A portrait-first air-campaign command instrument built from authored aviation plates and terse field controls.
colors:
  paper: "#efe5c8"
  paper-deep: "#d9c99f"
  paper-action: "#fff8e8"
  paper-muted: "#d5ddcf"
  panel-warm: "#e4d8b8"
  panel-disabled: "#e8dfc7"
  dusty-sky: "#94b7c2"
  dusty-sky-light: "#bcd2d4"
  graphite: "#17221f"
  graphite-soft: "#46534c"
  field-olive: "#66704b"
  field-dark: "#39463b"
  hangar-olive: "#6d7048"
  signal-vermilion: "#a7372b"
  signal-dark: "#7d241c"
  warning-amber: "#cc8a24"
  focus-straw: "#fff4b5"
  rule-graphite: "rgba(23, 34, 31, 0.22)"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(25px, 7vw, 34px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0em"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.045em"
  body:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0em"
  label:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.1em"
rounded:
  status: "3px"
  key: "4px"
  ledger: "8px"
  control: "10px"
  shell: "14px"
  desktop-shell: "18px"
spacing:
  xxs: "4px"
  xs: "8px"
  control-gap: "9px"
  sm: "10px"
  md: "12px"
  shell-gutter: "14px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.signal-vermilion}"
    textColor: "{colors.paper-action}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.signal-dark}"
    textColor: "{colors.paper-action}"
    rounded: "{rounded.control}"
  button-secondary:
    backgroundColor: "{colors.field-dark}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "50px"
    width: "50px"
  priority-action:
    backgroundColor: "{colors.signal-dark}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "50px"
    width: "220px"
  upgrade-card:
    backgroundColor: "{colors.panel-warm}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.control}"
    padding: "8px 9px"
    height: "59px"
  department-dock-action:
    backgroundColor: "transparent"
    textColor: "#b7c0b5"
    padding: "8px 4px 6px"
    height: "72px"
  department-dock-action-active:
    backgroundColor: "rgba(209, 173, 97, 0.1)"
    textColor: "#d1ad61"
  debrief-dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.shell}"
    padding: "22px"
    width: "min(calc(100% - 24px), 420px)"
  reset-action:
    backgroundColor: "transparent"
    textColor: "{colors.signal-dark}"
    typography: "{typography.label}"
    padding: "7px 0"
    height: "48px"
---

# Idle Bomber Command

## Status

- **Prototype development authorized by Jacob on 2026-11-08.**
- Working title: **Idle Bomber Command**.
- Saved: 2026-11-08.
- Goal: a portrait-mode mobile idle/incremental air-campaign game with meaningful min-max build choices, visible fleet growth, and optional active interactions.

## Core Fantasy

The player begins with one canvas biplane whose pilot throws grenades over the side at a trench. That pathetic operation eventually grows into a persistent air armada ranging from primitive swarms to strategic and stealth bombers, potentially ending in alternate-history or science-fiction aircraft.

The game deliberately embraces being a spreadsheet underneath. Its appeal is optimizing multipliers, aircraft mixes, payloads, support systems, and prestige strategies while watching those numbers appear as a larger and increasingly absurd force.

Tone: recognizable historical aircraft eras filtered through dieselpunk design, with escalating absurdity such as highly advanced grenades or “pocket-size nukes” carried by a canvas biplane.

## Presentation

- Portrait orientation.
- Top-down battlefield.
- The player's airfield sits at the bottom of the screen.
- Aircraft take off, fly toward objectives in the middle/top of the screen, attack, loop back, land, and sortie again until combat ineffective for that round.
- Longer-range missions may allow upward scrolling, camera following, zone-to-zone swiping, or dynamic zoom. Do not require the player to scroll through long stretches of empty sky merely to represent distance.

### Large Fleet Representation

Early game should model and display individual aircraft because visible growth from one aircraft matters.

Provisional hybrid approach:

- 1–20 aircraft: display and track individually.
- Above the readable/performance threshold: combine aircraft into flights or squadrons with pooled health/strength.
- Squadron formations should carry explicit `x10`, `x100`, `x1K`, etc. badges.
- Color can supplement quantity but should not be the only indicator because it conflicts with customization, rarity, damage states, and accessibility.
- Pooled formations can preserve the feeling of attrition by visually peeling away aircraft as squadron strength crosses thresholds.
- The final visible-aircraft cap must be determined through phone performance and readability testing.

## Core Loop

1. Choose one active battlefield.
2. Deploy the owned fleet from the airfield.
3. Aircraft repeatedly fly sorties, damage targets, earn war bonds for bombs dropped, and suffer cumulative damage.
4. When all aircraft are combat ineffective, the operation ends. Aircraft are not permanently destroyed.
5. During the operation, spend war bonds on sortie-only upgrades that make the current run stronger.
6. Review the debrief, return to the Main Menu, and spend medals on permanent upgrades before beginning another operation.
7. Farm earlier battlefields when a harder mission is currently inefficient.
8. Eventually unlock automation and prestige systems.

Early operations should be short. With one starting biplane, the first operation should last roughly one minute: it can complete one attack, may return, and will probably be shot down during its next attempt. More aircraft produce more simultaneous/sequential sorties, greater earnings, and somewhat longer endurance.

## Economy

The economy has two deliberately separate progression layers:

- **War bonds** are earned from bombs dropped during the active operation and spent on upgrades for that operation or sortie. These upgrades are temporary and do not survive the debrief.
- **Medals** are earned from targets destroyed. After the debrief, they are spent from the Main Menu on aircraft and permanent upgrades that persist across later operations.
- **War trophies** are a visible reserved currency for future boss opponents and are not currently awarded or spent.
- Current first-battlefield tuning awards 8 bonds per bomb drop, 1 medal per soft emplacement, 3 per hardened bunker, and 2 per priority target.
- The split makes moment-to-moment growth fast and disposable while preserving a slower campaign progression layer.
- Reward values can still be modified through target weakness, aircraft efficiency, formation bonuses, doctrines, and priority targets, but the two currencies must not collapse into interchangeable stores.
- Permanent aircraft-type upgrades apply to every owned aircraft of that type, not to individual copies.
- Unspent war bonds and all sortie requisitions expire at debrief. Additional aircraft and permanent upgrades are purchased with medals from the Main Menu.
- The recovered-aircraft percentage adds an equal percentage to the operation's base medal award. Recovering 100% of the deployed force adds a 100% bonus and doubles the medals earned, making a timely tactical retreat economically meaningful.

## Aircraft Ownership, Health, and Rounds

- Purchased aircraft remain permanently owned unless voluntarily traded through a future system.
- Aircraft can be knocked out for the remainder of an operation but return at full complement for the next operation.
- No permanent random aircraft losses.
- Early game tracks individual health; large formations may use pooled squadron strength.
- The exact incoming-damage, health, repair, and defense formulas are tuning questions for a prototype.

### Restart and Automation

- Early operations require manual restart so the player naturally reaches the upgrade/purchase screen between runs.
- Jacob currently prefers automatic restart to be an unlock for players who have progressed and ground sufficiently.
- Design caution: if basic automation arrives too late, the product may violate the player's expectation of an idle game and cause early churn.
- Proposed compromise to test: manual deployment for the tutorial/first several operations, then basic auto-deploy relatively early; later progression improves turnaround, offline efficiency, auto-upgrading, and automatic target handling.

## Airfield

- Initial capacity may be five aircraft.
- Capacity is upgradeable without a presently defined final limit.
- Consider separating:
  - **Hangar capacity:** maximum aircraft owned/deployed.
  - **Runway operations:** launch, landing, repair, and turnaround rate.
- A huge fleet should not realize its full value through one primitive runway without supporting upgrades.

## Active Player Interactions

### Priority Targets

- Normal target slots continuously respawn so aircraft always have something to attack.
- Chance-based special targets occasionally appear for a limited time: ammunition convoy, fuel depot, command vehicle, radar installation, exposed bunker entrance, enemy ace, etc.
- The player can tap/mark the special target.
- The nearest compatible aircraft redirects to attack it.
- Ignoring a special target must not stop ordinary idle income.

### Tail-Gunner Minigame

- When enemy aircraft attack, an optional alert can let the player enter a turret/tail-gunner position and shoot down interceptors.
- The original reward idea was double earnings for a perfect 10/10 result.
- Balance caution: doubling an entire long operation may overwhelm all other systems and make active play mandatory.
- Alternatives to test: double one sortie, double earnings for a limited time, grant a large bond bonus, suppress enemy fighters temporarily, or build an ace-streak multiplier.
- This minigame may be deferred until after the core idle loop is proven.

## Aircraft Progression

Initial progression outline, using fictionalized designs inspired by recognizable eras:

1. Canvas biplane — primitive grenade bomber and cheapest swarm platform.
2. P-26-style early monoplane — faster light attacker.
3. Dive bomber — early precision/hardened-target specialist.
4. B-25-style medium bomber — versatile payload and sortie rate.
5. B-17-style heavy bomber — durable mass bombing.
6. B-29-style superfortress — greater range and payload.
7. B-36-style intercontinental bomber — extreme range and conventional payload.
8. F-111-style strike aircraft — fast, low-level penetration.
9. B-52-style jet bomber — exceptional payload and longevity.
10. F-117-style stealth attacker — precision and defense penetration.
11. B-2-style stealth bomber — endgame stealth, range, and heavy payload.

Possible later additions include a B-21-inspired aircraft, experimental/alternate-history aircraft, and eventual science-fiction designs. More aircraft extend the ladder but do not by themselves solve endgame retention.

## Payloads and Upgrades

- Each aircraft type will ultimately have its own payload/upgrade tree.
- Upgrade dimensions may include quantity, health, speed, turnaround, accuracy, payload, defensive guns, formation strength, weapon type, and target specialization.
- The prototype should keep these trees deliberately small.
- Suggested starting structure per aircraft: one basic payload path, one specialized path, and eventually one signature/absurd upgrade.

## Build Archetypes

- **Swarm doctrine:** hundreds of cheap aircraft gain strength-in-numbers/air-wing bonuses and excel against broad soft targets.
- **Precision doctrine:** dive bombers and strike aircraft focus damage on hardened points.
- Precision aircraft automatically acquire exposed priority targets. This is their signature utility: lower broad-area ordnance throughput than heavy or swarm aircraft, but no player tap is required to divert them onto high-value targets.
- **Heavy doctrine:** fewer expensive bombers deliver enormous payloads.
- **Stealth doctrine:** penetrate defenses and destroy critical nodes.
- **Support doctrine:** invest in systems that improve the campaign instead of raw bomber output.
- **Mad-scientist doctrine:** retain primitive aircraft and push their payload tree into absurd endgame technology.

Target matching matters. Two hundred distributed grenades may outperform one 500-pound bomb against a trench network, while performing terribly against a hardened underground entrance without extreme specialization.

## Support Investments

Potential non-bomber progression paths:

- Fighter escorts reduce interception losses.
- Reconnaissance improves accuracy and exposes target weaknesses.
- Logistics shortens sortie turnaround.
- Suppression reduces anti-air effectiveness.
- Ground forces exploit bombing damage or increase passive income.
- Resistance/sabotage weakens selected defenses.

## Main Mission Progression

1. **Trench Network** — broad, soft target favoring grenades and swarm coverage.
2. **Supply Convoy** — moving targets favoring speed and repeated accurate attacks.
3. **Artillery Battery** — dispersed targets and the first meaningful anti-air resistance.
4. **Forward Operating Base** — tents, vehicles, ammunition dumps, and command huts.
5. **Rail Yard and Supply Depot** — large mixed target with tougher structures and flak.
6. **Military Airfield** — runways, hangars, aircraft, radar, and fighter resistance.
7. **Naval Base / Island Fortress** — armored targets, bunkers, and long range.
8. **Hardened Industrial Complex** — large defended factory network.
9. **Integrated Air-Defense Network** — radar, SAMs, command nodes, and target-order decisions.
10. **Deep Mountain Missile Complex** — distant, concealed, and heavily hardened.
11. **Strategic Command Fortress** — final layered target combining fighters, SAMs, decoys, bunkers, underground command, and possibly a fictional superweapon.

Mission target attributes include coverage, armor, precision requirement, distance, fighter resistance, ground-based anti-air strength, and concealment.

- Only one battlefield is active at a time.
- Switching battlefields intentionally abandons/ends the current operation.
- Ending or switching battlefields ends the current temporary war-bond upgrade run; unspent bonds and sortie upgrades expire.
- On a multi-target battlefield, destroyed normal targets stay destroyed until the entire target set is cleared; the set then rebuilds after a short delay. Following sorties advance to the next surviving target instead of attacking rubble.

## Theater Operations

Two separate 100-sector extreme-difficulty side campaigns permanently affect normal missions:

### Flak Front

- Each cleared sector reduces ground-based anti-air effectiveness across the campaign.
- Favors precision, stealth, suppression, and durability.

### Air-Superiority Front

- Each cleared sector reduces enemy fighter strength, interception frequency, or both.
- Favors speed, escorts, defensive guns, decoys, and formation strength.

### Scaling

- Exponential difficulty.
- Sectors 1–30 should be achievable by lower-level players and provide meaningful relief.
- Sectors 31–60 serve established midgame fleets.
- Sectors 61–85 require specialized late-game builds.
- Sectors 86–99 require prestige-heavy optimization.
- Sector 100 is a genuine endgame test, likely requiring maximized aircraft or payload progression.
- Difficulty coefficients must be tuned by playtesting.
- Direct defense reduction should probably not reach a literal 100%, because completely removing defenses erases mastered systems. Consider a 75–85% cap plus milestone rewards at 25/50/75/100.

## New Campaign Orders

- The player-facing name for the prestige reset is **New Campaign Orders**; avoid exposing the generic idle-game term in the interface.
- Accepting new campaign orders resets the current campaign in exchange for permanent bonuses.
- Each completed campaign can award a campaign ribbon, giving the player a visible service record across resets. The ribbon system may use distinct ribbons for major accomplishments or tiered devices for repeated campaigns so the display does not become meaningless clutter.
- It should support different run strategies rather than only repeat the same game faster.
- Possible permanent doctrines: mass production, precision strike, heavy bomber, stealth, logistics, and air superiority/support.
- Exact reward magnitude is deliberately unknown until the progression is playable; it could be 1.01x, 1.25x, 2x, or another curve.
- Still to define: what resets, what persists, how prestige reward is calculated, and how Theater Operations interact with prestige.

## Monetization Direction

Potential least-obnoxious options:

- Optional rewarded ads.
- Permanent no-ads purchase.
- Starter/commander packs.
- Cosmetic paint schemes, formations, contrails, or aircraft skins.

Purchases may accelerate progress but should not be the only escape from deliberately engineered deadlocks. Commercial viability and player spending remain hypotheses until retention and conversion are measured.

## Prototype Scope (When Authorized)

- Portrait top-down view.
- One airfield.
- Trench Network and possibly Forward Operating Base.
- Three, possibly four aircraft: canvas biplane, early monoplane/dive bomber, and one medium bomber.
- Three explicit currency roles: temporary in-operation war bonds, persistent base medals, and reserved boss war trophies.
- Basic aircraft purchasing, type-wide upgrades, health, sorties, debrief, and manual restart.
- One small payload choice per aircraft.
- Priority-target interaction.
- Hybrid individual/group display only if fleet size requires it.
- Tail-gunner minigame is optional for the first prototype and should not delay proving the core loop.
- No full prestige or 100-sector Theater system until the basic loop is satisfying.

## Unresolved Questions

These are mostly prototype/tuning decisions rather than missing concept pillars:

1. Exact health, damage, armor, interception, and anti-air formulas.
2. Long-term tuning of war-bond requisition costs and war-trophy target values beyond the first battlefield.
3. How quickly enemy defenses escalate within one operation.
4. Repair/turnaround time between operations.
5. Exact timing and features of the auto-deploy unlock.
6. The first three aircraft's concrete statistics and upgrade branches.
7. Priority-target RNG, duration, compatibility, and rewards.
8. Whether the tail-gunner minigame enters the first prototype or the next iteration.
9. Exact visible-aircraft threshold before aggregation.
10. Final camera behavior for longer-range missions.
11. Prestige reset/persistence rules.
12. Endgame structure beyond adding aircraft: endless difficulty, new theaters, challenge runs, advanced prestige, or recurring operations.

## Current Assessment

The concept now has a recognizable hook and meaningful strategic depth: a visibly persistent air armada, viable old-aircraft builds, target-specific fleet optimization, active opportunities, support investments, prestige doctrines, and two long-term Theater Operations.

The principal risks are scope, balance, mobile readability/performance, unlocking automation late enough to feel earned but early enough to honor the idle premise, and proving that the first hour is fun before building content for the thousandth hour.

# Built Visual System

## Overview

**Creative North Star: "The Air-Campaign Operations Board"**

The shipped prototype is an operable Main Menu rather than an abstract idle dashboard. A realistic authored apron lineup establishes the full historical progression before numbers appear; one arrow-and-swipe operation selector makes the campaign roadmap tangible without expanding every system at once. Two compact Theater Operations placeholders reserve the future Flak and Air-Superiority 100-sector campaigns. A 2×2 department grid opens focused, centered Requisitions, Armory, Maintenance, and Flight Operations windows. Deployment exchanges the warm airfield for the authored `battlefield-airfield-v3` terrain plate, disciplined runway operations, two compact airborne circuits, and KITE-series aircraft recognition tags.

The material system combines khaki dispatch paper, field-painted green, graphite plotting ink, brass title lettering, and sparing signal vermilion with standard web controls. The visual fiction never obscures state: the two currency balances are always first, the current operation is the only expanded decision, locked operations remain browsable but cannot deploy, department detail appears in a labeled modal window, unavailable purchases are disabled and outlined, five terrain-matched targets communicate only through their physical sprites and health bars, Emergency Retreat is visually dominant, Pause / Resume remains separate, and both retreat recovery and combat debrief are temporary states on the route back to the Main Menu.

**Key Characteristics:**
- A recognizable Main Menu with mission selection, Requisitions, Armory, Maintenance, and Flight Operations.
- Realistic authored airfield, battlefield, aircraft, soft-emplacement, and hardened-bunker raster assets as the main atmosphere.
- A 390×560 battlefield world with visibly worn center-departure and hangar-side arrival paths, loaded and empty airborne circuits, nose-led 120°/second aircraft turns, target-seeking fighter turns, attributable threats, and compact KITE call-sign tags.
- Self-hosted Barlow Condensed across display, body, labels, and tabular operation numerals.
- Khaki paper, dark field green, graphite, dusty sky, and sparing signal vermilion.
- Standard controls, 44px-or-larger targets, explicit states, and interruption-safe behavior.

## Colors

The palette reads like sun-faded dispatch stock and field-painted equipment. Graphite carries information; dark green anchors the shell; dusty sky belongs to the battlefield; vermilion is reserved for command and danger.

### Primary
- **Signal Vermilion:** Primary deployment actions, priority markers, damaged/lost states, and the mission-bar rule. Its scarcity gives it command authority.

### Secondary
- **Field Olive:** Readiness and ground references; Dark Field Green anchors the surround, mission bar, active department tab, and secondary controls. Hangar Olive is the fallback beneath the airfield plate.
- **Dusty Sky Blue:** The dominant battlefield atmosphere; the lighter sky value supports canvas variation without becoming decorative chrome.

### Neutral
- **Bleached Paper:** Main shell, light-on-dark labels, aircraft markings, and recognition-tag stock.
- **Deep Paper:** Ledgers and subdued inset surfaces.
- **Warm Panel Paper:** Upgrade rows; its deeper hover and pale disabled treatment keep purchase state visible without introducing another accent.
- **Graphite:** Primary text, silhouettes, plotted geometry, and high-contrast battlefield structure; Graphite Soft carries secondary copy.
- **Rule Graphite:** Low-contrast structural dividers, record rows, and settings boundaries.
- **Focus Straw:** A light, unmistakable focus and marked-target signal that remains visible across dark, olive, blue, and vermilion surfaces.

**The Signal Discipline Rule.** Vermilion marks an action, alert, priority, or failure; it is not a general-purpose decoration.

**The Meaning Beyond Color Rule.** Every color state is paired with a label, fill change, shape, disabled state, or announcement.

## Typography

**Display Font:** Barlow Condensed (self-hosted, with Arial Narrow and sans-serif fallbacks)  
**Body Font:** Barlow Condensed (self-hosted, with Arial Narrow and sans-serif fallbacks)  
**Label Font:** Barlow Condensed (self-hosted, with Arial Narrow and sans-serif fallbacks)

**Character:** One condensed workhorse family makes the game feel like a field order and maintenance ledger rather than a generic dashboard. Weight, size, uppercase, tracking, and tabular numerals create hierarchy without ornamental type.

### Hierarchy
- **Display:** Bold uppercase state titles on the battlefield plate (`clamp(25px, 7vw, 34px)`, 0.95 line-height).
- **Headline:** Bold uppercase airfield and debrief headings (24px, 1 line-height).
- **Title:** Bold compact identity text in the mission bar (15px, 0.045em tracking).
- **Body:** Regular mixed-case explanations and summaries (principally 12px; 13px on the state plate).
- **Label:** Semibold or bold uppercase microcopy (principally 11px, up to 0.15em tracking) for departments, ledgers, field codes, and controls.

**The One Workhorse Rule.** Use the shipped self-hosted Barlow Condensed weights (400, 600, 700, 800); hierarchy comes from role and weight, not extra font families.

**The Numeral Rule.** Operation, timing, bond, and sortie figures use tabular numerals wherever changing widths could disturb scanning.

## Layout

At the 390px mobile target, the shell remains a single portrait column capped at 460px. A 96px header puts medals, reserved boss trophies, and a 44px settings gear on the first row and centers the brass game title beneath them. The aircraft-lineup hero contains the paper operation selector, two compact locked Theater Operations cards, and the full-width deploy action above a 2×2 department grid. Arrows, horizontal swipes, and keyboard arrows browse all eleven operations. Department buttons open centered upgrade windows, keeping aircraft and upgrade detail off the home screen until requested; Requisitions gives the selected aircraft sprite and field-description copy visual priority. During battle, the canvas retains its 390:560 world ratio and the command deck follows beneath it with three compact sortie requisitions. A visible 2× badge appears while whole-sortie speed is active. Aircraft leave the lower-right parking apron through the center x=236 access and make an eastbound takeoff on the runway’s right half. Arrivals curve around the west side, align eastbound before touchdown, roll to x=156, then clear through the separate worn hangar-side access before crossing the apron to parking. Loaded aircraft without an available target use the inner holding circuit. Only the temporary priority action, 2× badge, and paused-state plate overlay the battlefield.

At 820px and above, the shell becomes an 880px instrument with an 18px outer radius. The Main Menu uses the full-width lineup hero with the operation selector centered over its lower portion and the department dock spanning beneath it. Department windows center within the shell. The battle view retains the 430px left canvas and right operation-control split; the mission bar and keyboard guide span both. Safe-area insets protect the mission bar, department dock, and lower mobile controls.

**The Place-Before-Ledger Rule.** On the Main Menu, show the aircraft-lineup airfield and current operation before exposing purchasing controls; in battle, preserve the 390×560 top-trench/bottom-airfield world before adding overlays.

## Elevation & Depth

Depth is restrained and structural. The application shell and modal debrief use broad ambient shadows; the airfield status plate, priority action, and primary command use smaller lifts. Paper/olive tonal steps, one-pixel rules, raster lighting, and translucent overlays do most of the separation work.

### Shadow Vocabulary
- **Shell ambient** (`0 20px 70px rgba(0, 0, 0, 0.38)`): Desktop and bounded-shell separation only.
- **Debrief ambient** (`0 24px 70px rgba(0, 0, 0, 0.42)`): Separates the temporary paper record from its dark modal backdrop.
- **Airfield status lift** (`0 8px 20px rgba(23, 34, 31, 0.22)`): Keeps the serviceability label legible over the authored hangar plate.
- **Priority lift** (`0 8px 20px rgba(23, 34, 31, 0.28)`): The temporary mark-target action over the battlefield.
- **Command lift** (`0 6px 14px rgba(125, 36, 28, 0.22)`): Primary vermilion controls.

**The Restrained Lift Rule.** Shadows clarify containment or urgency; routine cards and ledgers stay flat and separate through tone.

## Shapes

The shell, status plates, and debrief paper use a gently rounded 14px corner language; standard controls, tabs, close action, and upgrade rows use 10px radii. Smaller 8px ledgers, 4px keycaps, and 3px status swatches keep nested geometry crisp. The desktop shell widens to 18px, while canvas marks, recognition-tag leaders, bars, and aircraft tags remain rectilinear.

**The Recognition Geometry Rule.** Curves belong to operable containers, target markers, and physical aircraft motion; aircraft silhouettes, field labels, health bars, and recognition-tag leaders stay clipped and technical.

## Components

### Buttons
- **Primary / emergency:** Vermilion, bold uppercase, 10px radius, subtle tinted lift, and a minimum 50px height. In battle, the large full-width command is explicitly **Emergency Retreat**; hover deepens to Signal Dark and its disabled copy becomes **Retreat in progress**.
- **Pause / Resume:** A separate compact Field Dark control with paper icon and text, a recognizable pause/resume symbol, 10px radius, and at least a 50×50px target. It never shares the retreat action's vermilion emphasis.
- **Priority action:** Signal Dark with a paper border, stacked alert/action labels, a minimum 220×50px footprint, and a temporary position centered over the battlefield.
- **Focus:** Every button uses a 3px Focus Straw outline with 3px offset under `:focus-visible`.

### Main Menu
- **Scene:** `bomber-lineup-main-menu.webp` is a wide cover plate showing the planned aircraft eras in chronological apron formation, with a lower graphite gradient preserving status contrast.
- **Currency strip:** Medals and reserved boss trophies occupy the first row with small authored SVG symbols and tabular balances; a 44px settings gear completes the row. The centered brass title occupies the second row. War bonds appear only inside an active sortie.
- **Operation selector:** One opaque paper panel reports operation number, name, target character, availability, serviceable force, payload, and integrity. Arrow buttons, horizontal swipe, and keyboard arrows browse the full eleven-operation ladder; only Trench Network enables deployment.
- **Order:** The operation selector precedes the full-width deploy action; purchasing remains subordinate behind the bottom dock.

### Department Dock & Windows
- **Dock:** Four equal, 72px-minimum actions span the bottom edge. Each pairs a consistent authored SVG with its label: Requisitions, Armory, Maintenance, and Flight Ops.
- **Window:** Selecting a department opens one centered native `dialog` on mobile and desktop. The backdrop protects focus; the title and one-line purpose identify the active department; a 44px close action and Escape dismissal are preserved.
- **Progressive disclosure:** Requisitions owns aircraft commissioning, an actual selected-aircraft sprite, humorous field copy, and the swipeable eleven-aircraft roadmap; Armory owns payload upgrades; Maintenance owns aircraft-specific integrity and engine-speed work; Flight Operations owns airfield-wide doctrine such as ground-crew launch drill. Settings and reset live behind the independent header gear.

### Cards / Containers
- **Shell:** Bleached Paper with a 14px mobile radius token and restrained ambient shadow when presented as a bounded desktop object.
- **Upgrade cards:** Warm paper inset, 10px radius, 59px minimum height, explicit title/effect/cost grouping, and a deeper-paper hover.
- **Ledgers:** Deep Paper or Field Dark, tight tabular numerals, and short uppercase captions.

### Battlefield & Aircraft
- **Backdrop:** `battlefield-airfield-v3.webp` is drawn into the full 390×560 canvas. It retains the trench network and farmland, broad lower-right packed-earth apron, lower-left hangar, and left-streaming windsock while adding two subtle worn routes: the center departure access and the separate hangar-side arrival path.
- **Ground discipline:** Aircraft park on the lower-right apron. Departures use the center access at x=236 and roll east on the runway’s right half. Arrivals roll east along the left half to x=156, then clear through the separate hangar-side access via `(163,445)`, `(160,461)`, `(165,480)`, `(184,496)`, and `(210,504)` before crossing the lower apron to parking. Ground, taxi, takeoff-roll, landing-roll, and taxi-in phases always render with zero bank and no airborne wobble.
- **Airborne circuits:** No dashed aircraft route trace is drawn. Loaded aircraft climb on the right and either make a physical attack approach or fly the inner holding loop while the five-target position is rebuilding. Empty aircraft use a broad western recovery with staged curve points that align them eastbound before touchdown; the moving sprites themselves communicate each route.
- **Launch spacing:** Initial ground cooldowns offset each aircraft by 2.05 seconds from the previous aircraft, preserving visible separation through taxi-out and the eastbound takeoff roll.
- **Aircraft scale, heading, and bank:** `canvas-biplane-topdown.webp` is drawn at a 40px cruise size. Altitude interpolates its footprint from 18px on the ground to 40px aloft; the aircraft grows through takeoff and climb, then visibly shrinks on empty return and final before touching down. Heading uses `turnToward` at 2π/3 radians per second (120°/s), and world translation follows the aircraft's forward vector rather than sliding directly toward a waypoint. The sprite compresses and shears briefly toward the inside of each turn, then eases level.
- **Hostile fighter:** Enemy sweeps reuse the recognizable top-down biplane planform at 34px, darkened to graphite with a signal-vermilion tail mark. A fighter selects an airborne target, turns its nose toward that aircraft, closes, fires only inside its engagement cone, and then turns toward egress. Do not replace it with an abstract triangle or improvised fighter glyph.
- **Recognition tag:** A compact 43×14px bleached-paper KITE-series call-sign tag with a 3px vermilion edge connects to each aircraft by a graphite plotting line and flips away from the right boundary. The runtime abbreviates `KITE-01` to `K-01`; tags and integrity bars appear only above 0.65 altitude so the runway remains uncluttered.
- **Normal target position:** Five unnamed, terrain-matched sprites occupy two rows and carry health bars only: three 16-HP soft emplacements across the lower row and two 64-HP hardened bunkers across the upper row. No target name, card, or `DESTROYED` label competes with the terrain; a downed sprite dims and receives a plotted X.
- **Target sequence and overflight:** Loaded aircraft select the next surviving normal target by attack order, physically fly to it, strike once, continue past it on a short overflight, and only then begin the empty return. A marked priority target is also approached and physically overflown rather than resolved remotely.
- **Priority diversion:** Marking an exposed priority target diverts the closest loaded airborne aircraft. If none is eligible, the next loaded aircraft takes the assignment; ordinary income and target work continue around the diversion.
- **Rebuild discipline:** Individual targets stay down. Only after all five are destroyed does a centered `POSITION REBUILDING` countdown hold new ground launches for 4.5 seconds; the full five-target position then returns together while already-loaded aircraft use the inner holding circuit. At rebuild, loaded en-route aircraft select the nearest restored target from their current position rather than falling back to the right-to-left attack order.
- **Attributed threats:** Integrity loss must have a visible author without covering the aircraft in hit markers. Trench rifle fire uses brief 1px warning-amber source tracers for frequent 1–2 point hits; heavier anti-air fire uses brief 1.25px graphite source tracers for 4–7 point hits; rare graphite enemy-fighter sweeps fire a 1.5px focus-straw tracer for 8–12 point hits. Only knockouts retain the larger loss effect. Reduced Effects may suppress transient tracers, but the fighter silhouette itself remains visible because it is game state.
- **Priority variation:** Natural priority exposure uses a bounded random schedule: 12–27 seconds after deployment, one of four battlefield coordinates, and a 9–14 second unmarked lifetime. Test hooks may still force a deterministic target.
- **Artillery orientation:** The three soft-emplacement sprites rotate 180° from their source plate so their gun barrels face the approaching aircraft at the bottom of the battlefield.

### Settings / Fields
- **Disclosure:** Native `details`/`summary` behavior with a 44px minimum summary row and visible plus/minus affordance.
- **Checkboxes:** Native, recognizable 19px checks using Signal Vermilion as the accent.
- **Settings window:** The top-right gear opens sound, reduced-effects, and persistent 2× sortie-speed controls. The 2× setting doubles the active simulation—aircraft, threats, timers, and income—and displays a battlefield badge.
- **Sound direction:** Audio should make the command fantasy and battlefield state legible without becoming a constant arcade reward loop. A low procedural piston-engine bed scales gently with airborne force density; short field-radio, ordnance, rifle, anti-air, fighter, loss, retreat, requisition, and debrief cues distinguish consequential events. All sound is synthesized locally through Web Audio, begins only after user interaction, stops under mute/background pause, and remains supplementary to visible labels and screen-reader announcements.
- **Sortie upgrades:** A dedicated 44px **Upgrades** control occupies the first visible command row beside the war-bond balance and opens a centered three-choice war-bond window. Payload, armor, and turnaround purchases remain clearly reachable without scrolling below the battlefield fold.
- **Test reset action:** A 48px transparent row lives in Settings, using a reset-arrow SVG, explicit `RESET TEST PROGRESS` copy, and a one-line scope description. It retains a native confirmation step before clearing medals, boss trophies, aircraft, upgrades, and operation history.

### State Plates & Debrief
- **Ready / Paused:** A graphite overlay with field code, large state title, and concise explanation. The plate fades with a 220ms ease-out transition.
- **Playing:** The plate becomes non-interactive and transparent; force status, spendable war bonds, three temporary sortie requisitions, aircraft integrity, call-sign tags, and the canvas HUD remain visible.
- **Emergency retreat:** The large vermilion order clears the priority target, sends every surviving airborne aircraft into the empty recovery circuit, and disables itself as **Retreat in progress**. The recovered-force percentage becomes an equal medal bonus.
- **Debrief:** Combat completion and emergency retreat both end in the same temporary native modal `dialog`, at most 420px wide with 12px viewport margins. It presents total medals, targets destroyed, recovered aircraft, and the survival bonus; unspent war bonds and sortie requisitions expire. Its 44×44px close action, Escape cancellation, and full-width Return to Main Menu action dismiss the record and restore the hub.
- **Interruption:** Losing focus or backgrounding pauses the operation and announces the reason.

### Raster Plates & Provenance
- **Shipping set:** `bomber-lineup-main-menu.webp`, `battlefield-airfield-v3.webp`, `canvas-biplane-topdown.webp`, `soft-emplacement-topdown.webp`, and `hardened-bunker-topdown.webp` are the canonical runtime assets. Their retained PNG sources support future recrops or conversions. The older base and battlefield plates remain archived but are not the shipping views.
- **Provenance convention:** Every shipping raster keeps a sibling `<filename>.webp.json` containing the exact generation prompt and `createdAt`, plus a human-readable prompt source in `assets/prompts/<asset-name>.txt`. New or replaced raster plates must follow the same three-part trail; do not ship an orphaned bitmap.
- **Content boundary:** Plates stay fictional and unmarked: no flags, national roundels, extremist symbols, logos, text, or watermarks.

## Do's and Don'ts

### Do:
- **Do** keep every interactive target at least 44px in one dimension; primary, pause, and priority controls ship at 50px or more.
- **Do** pair color with words, icons, fill, shape, or live-region announcements for readiness, damage, loss, priority, and disabled states.
- **Do** retain standard button, checkbox, disclosure, focus, keyboard, and confirmation behaviors.
- **Do** honor `prefers-reduced-motion` and the in-game Reduce Effects setting; the latter removes transient canvas effects without removing state information.
- **Do** preserve keyboard controls and polite screen-reader announcements for major operation changes.
- **Do** keep Requisitions, Armory, Maintenance, and Flight Operations visibly distinct in the fixed bottom dock and reveal only the selected department's window.
- **Do** preserve the center x=236 departure access, eastbound right-half departures, left-half arrival roll to x=156, separate hangar-side curved exit, matching worn ground paths, 2.05-second launch staggering, nose-led 2π/3-radian-per-second aircraft turns with visible airborne bank, level ground movement, the loaded inner holding circuit, broad western landing curve, physical target overflight, and one-strike return behavior.
- **Do** keep integrity loss attributable through rifle tracers, anti-air bursts, or fighter sweeps, and keep the confirmed test reset accessible within Flight Operations.
- **Do** keep the target position to three 16-HP soft emplacements below two 64-HP bunkers, unnamed and identified through terrain-matched silhouettes plus health bars only.
- **Do** rebuild only after all five targets are down and divert the closest loaded airborne aircraft to a marked priority target.
- **Do** preserve sibling JSON provenance, the prompt source, and the retained PNG whenever a runtime WebP is replaced.

### Don't:
- **Don't** turn the shell into a generic dark command-center dashboard, decorative gauge cluster, or neon sci-fi HUD.
- **Don't** use real-world nationalist, extremist, or militarist insignia as atmosphere or ornament.
- **Don't** spend vermilion on passive decoration or rely on it as the only state cue.
- **Don't** replace recognizable controls with ambiguous custom gestures or icon-only interactions.
- **Don't** merge Emergency Retreat with Pause / Resume or give the pause control equal vermilion command weight.
- **Don't** turn the debrief into a persistent third screen; it is a temporary modal record between battle and the Main Menu.
- **Don't** reintroduce dashed aircraft route traces; movement is communicated by the aircraft and its continuous heading changes.
- **Don't** restore tents, reverse the left-streaming windsock, or replace the lower-right packed-earth apron in the authored battlefield plate.
- **Don't** substitute generic gradients or CSS scenery for the authored airfield, battlefield, aircraft, emplacement, and bunker assets.
