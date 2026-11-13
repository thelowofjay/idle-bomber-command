# Idle Bomber Command Backlog

## Implemented production revision

Status: implemented and queued for deployment in the November 13 production revision.

1. **Foxhole formation**
   - Rotate the foxhole artwork so both soldiers face toward the bottom of the screen.
   - Increase the front row from three foxholes to four.
   - Reduce their visual footprint so they read as smaller, softer targets while remaining tappable/readable on a phone.

2. **Canvas biplane ordnance**
   - The starter Canvas biplane drops a **hand grenade**, not a conventional aerial bomb.
   - Preserve the delayed, visible fall and impact timing, but replace the projectile artwork/animation and related wording with a grenade.

3. **Aircraft motion**
   - Smooth the visibly jumpy biplane movement and turning.
   - Preserve nose-led flight, route behavior, targeting, and gameplay timing while improving frame-to-frame interpolation.

4. **Sound audition web app**
   - Build a separate audition app before changing the game mix.
   - Provide several clearly labeled variants for:
     - biplane engine/flight
     - grenade release, fall, and impact
     - ground gunfire
     - enemy aircraft
     - aircraft crash/loss
     - sortie complete
     - optional main-menu ambience/music
   - Include per-sound play/stop, rapid A/B comparison, volume controls, and a simple way to mark favorites or record the chosen variant.
   - The workshop may be deployed for phone testing, but do not integrate selected sounds into the game mix until Jacob approves the set.

All four items above are implemented. The remaining audio task begins only after the Sound Workshop favorites are reviewed.
