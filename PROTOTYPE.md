# Prototype Contract

## Smallest playable loop

1. Begin at the Main Menu with one canvas biplane and a chronological bomber-lineup hero.
2. Swipe through the eleven-operation and eleven-aircraft roadmap. Only Trench Network and the canvas biplane are currently selectable. The Flak Front and Air-Superiority Front reserve two future 100-sector campaigns. Spend medals in Requisitions, Armory, Maintenance, or Flight Operations, then deploy the operation.
3. Aircraft leave the lower-right apron through the center access at x=236, use the right half of the horizontal runway for takeoff, and launch at 2.05-second intervals so successive departures remain visibly separated. Recoveries roll to x=156 and clear through the separate hangar-side access before crossing the apron to parking.
4. Aircraft move only through the direction their nose is pointing, turn continuously at up to 120° per second, and visibly bank while changing heading. A loaded aircraft physically overflies the first surviving assigned target before the hit is applied. Once empty, it curves southwest and then east onto the runway rather than making 90° waypoint turns, shrinks on final, lands on the left half, and uses a curved exit back to parking.
5. The battlefield holds eight unnamed terrain-matched targets with health bars: three one-hit two-man foxholes in front, three two-hit artillery positions behind them, and two hardened bunkers at the rear. Destroyed targets remain wrecked and the entire position rebuilds only after all eight are destroyed.
6. If the position is down while an aircraft still carries its bomb, it flies the shorter inner holding circuit and attacks again after the full wave rebuilds rather than landing loaded. At rebuild, each loaded en-route aircraft selects the closest live target rather than defaulting to the attack-order leader.
7. A temporary priority cargo truck may be tapped. Its first appearance varies between 12–27 seconds, enters from either side, and follows the upper farm road for a 14–18 second unmarked window. The closest loaded airborne aircraft visibly peels away, releases a bomb ahead of the truck, overflies it, and joins the empty recovery route while the delayed impact resolves.
8. Every bomb dropped earns temporary war bonds that can buy payload, armor, or turnaround requisitions for the current operation only. Destroyed targets award medals for permanent Main Menu purchases; war trophies are reserved for future bosses.
9. **Emergency Retreat** recalls all surviving aircraft and ends the operation after recovery. The recovered-aircraft percentage becomes an equal medal bonus, so recovering 100% of the force adds 100% of the base medals earned. The separate dark control remains the only Pause/Resume control.
10. When the force is combat ineffective—or a retreat completes—show a temporary debrief over the battlefield with destroyed targets, recovered aircraft, survival percentage, bonus medals, and total medals earned.
11. Dismiss the debrief to return to the Main Menu, spend medals in the permanent-upgrade departments, and redeploy. Unspent bonds and all sortie requisitions expire.
12. Integrity loss is attributable on the battlefield: frequent low-damage trench rifle tracers, less frequent heavier anti-air tracers, and rare enemy fighter sweeps each have distinct damage weights. These are restrained source lines, not large aircraft-centered hit markers. The hostile-tinted enemy biplane turns toward its selected target before firing.

## Controls

- Tap or click **Deploy**, department tabs, **Emergency Retreat**, **Pause**, **Resume**, upgrade actions, the debrief close action, and temporary priority targets.
- The top-right settings gear contains persistent 2× sortie speed and **Reset test progress**, which clears medals, boss trophies, aircraft, upgrades, and operation history only after native confirmation.
- Keyboard: `Space` pauses/resumes; `R` deploys from the Main Menu; `1` marks a priority target.

## Interruption and persistence

- Pause on tab visibility loss and window blur.
- Persist medals, reserved boss trophies, owned aircraft, permanent upgrades, operation count, sound, reduced-effects, and 2× speed preferences locally. Version-3 trophy balances migrate once to medals.
- Do not persist an operation in progress in v1.
- Do not draw a decorative flight-path trace; aircraft movement itself must communicate the route.

## Explicit exclusions

No tail-gunner minigame, playable additional aircraft tiers, full payload trees, offline earnings, auto-deploy, Theater Operations, New Campaign Orders, campaign ribbons, ads, purchases, accounts, cloud saves, durable public hosting, or Android wrapper. Later operations and aircraft appear only as locked, swipeable roadmap previews.
