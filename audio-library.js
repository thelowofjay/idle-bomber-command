export const DEFAULT_CUES = Object.freeze({
  engine: "engineB",
  grenade: "grenadeA",
  gun: "gunB",
  enemy: "enemyA",
  crash: "crashA",
  complete: "completeA",
  menu: "menuA",
});

export const DEFAULT_MIX = Object.freeze({ master: .72, music: .45, engines: .72, weapons: .76, explosions: .82, alerts: .72 });

const FAVORITE_NAMES = Object.freeze({
  engine: { "Warm Radial": "engineA", "Airborne Cruise": "engineB", "Distant Formation": "engineC" },
  grenade: { "Pin, Spoon & Dirt": "grenadeA", "Hard Ground": "grenadeB", "Distant Field": "grenadeC" },
  gun: { "Dry Rifle": "gunA", "AA Burst": "gunB", "Distant Battery": "gunC" },
  enemy: { "Interceptor Approach": "enemyA", "Diving Fighter": "enemyB", "Distant Hunter": "enemyC" },
  crash: { "Sputter & Ground Strike": "crashA", "Burning Descent": "crashB", "Close Collision": "crashC", "Canvas & Timber": "crashA", "Engine Failure": "crashB", "Hard Landing": "crashC" },
  complete: { "Field Bugler": "completeA", "Distant Bugler": "completeB", "Short Retreat": "completeC" },
  menu: { "Tactical Dusk": "menuA", "Map Room": "menuB", "Airfield Watch": "menuC" },
});

const FAVORITE_KEYS = Object.freeze({
  engine: "biplane-radial-engine",
  grenade: "grenade",
  gun: "ground-gunfire",
  enemy: "enemy-radial-fighter",
  crash: "aircraft-shot-down",
  complete: "sortie-complete-retreat",
  menu: "main-menu-loop",
});

function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, Number(value)));
}

export function readFavoriteCues(storage = localStorage) {
  let saved = {};
  try { saved = JSON.parse(storage.getItem("ibc-sound-favorites") || "{}"); } catch {}
  return Object.fromEntries(Object.entries(FAVORITE_KEYS).map(([category, key]) => {
    const selected = saved[key] ?? (category === "crash" ? saved["aircraft-crash"] : undefined);
    const cue = Object.values(FAVORITE_NAMES[category]).includes(selected) ? selected : FAVORITE_NAMES[category][selected];
    return [category, cue || DEFAULT_CUES[category]];
  }));
}

export function readSoundMix(storage = localStorage) {
  let saved = {};
  try { saved = JSON.parse(storage.getItem("ibc-sound-mix") || "{}"); } catch {}
  return Object.fromEntries(Object.entries(DEFAULT_MIX).map(([key, fallback]) => [key, clamp(saved[key] ?? fallback)]));
}

export function writeSoundMix(mix, storage = localStorage) {
  const safe = Object.fromEntries(Object.entries(DEFAULT_MIX).map(([key, fallback]) => [key, clamp(mix?.[key] ?? fallback)]));
  storage.setItem("ibc-sound-mix", JSON.stringify(safe));
  return safe;
}

export function favoriteCount(storage = localStorage) {
  let saved = {};
  try { saved = JSON.parse(storage.getItem("ibc-sound-favorites") || "{}"); } catch { return 0; }
  return Object.entries(FAVORITE_KEYS).filter(([category, key]) => {
    const selected = saved[key] ?? (category === "crash" ? saved["aircraft-crash"] : undefined);
    return Object.values(FAVORITE_NAMES[category]).includes(selected) || Boolean(FAVORITE_NAMES[category][selected]);
  }).length;
}

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function normalize(data, ceiling = .92) {
  let peak = .001;
  for (const sample of data) peak = Math.max(peak, Math.abs(sample));
  const gain = ceiling / peak;
  for (let index = 0; index < data.length; index += 1) data[index] *= gain;
}

export function createAudioLibrary(context) {
  const cache = new Map();

  function makeBuffer(key, duration, render) {
    const cacheKey = `${key}-${context.sampleRate}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    render(buffer.getChannelData(0), context.sampleRate);
    cache.set(cacheKey, buffer);
    return buffer;
  }

  function radialBuffer(cue) {
    const profiles = {
      engineA: { rpm: 980, noise: .62, prop: .16, seed: 11, distance: 1 },
      engineB: { rpm: 1280, noise: .48, prop: .2, seed: 12, distance: .92 },
      engineC: { rpm: 900, noise: .72, prop: .11, seed: 13, distance: .58, chorus: true },
      enemyA: { rpm: 1550, noise: .5, prop: .24, seed: 21, distance: .9, rise: .22 },
      enemyB: { rpm: 1840, noise: .46, prop: .28, seed: 22, distance: 1, rise: .12 },
      enemyC: { rpm: 1400, noise: .7, prop: .15, seed: 23, distance: .54, chorus: true },
    };
    const profile = profiles[cue] || profiles.engineB;
    return makeBuffer(`radial-${cue}`, 6, (data, rate) => {
      const rand = random(profile.seed);
      let phase = 0;
      let secondPhase = .38;
      let exhaust = 0;
      let exhaust2 = 0;
      let lowNoise = 0;
      let highPass = 0;
      let previous = 0;
      for (let index = 0; index < data.length; index += 1) {
        const time = index / rate;
        const entrance = Math.min(1, time / .12);
        const exit = Math.min(1, (6 - time) / .18);
        const rpm = profile.rpm * (1 + Math.sin(time * .73) * .018 + Math.sin(time * 2.17) * .008 + (profile.rise || 0) * (time / 6));
        const fireRate = rpm / 60 * 7 / 2;
        phase += fireRate / rate;
        if (phase >= 1) { phase -= 1; exhaust += .78 + rand() * .28; }
        if (profile.chorus) {
          secondPhase += fireRate * 1.035 / rate;
          if (secondPhase >= 1) { secondPhase -= 1; exhaust2 += .38 + rand() * .18; }
        }
        exhaust *= Math.exp(-1 / (rate * .019));
        exhaust2 *= Math.exp(-1 / (rate * .024));
        lowNoise += ((rand() * 2 - 1) - lowNoise) * .09;
        const cylinder = (exhaust + exhaust2) * (lowNoise * profile.noise + Math.sin(time * Math.PI * 2 * (72 + rpm * .012)) * .24);
        const bladeRate = rpm / 60 * 2;
        const propeller = Math.sin(time * Math.PI * 2 * bladeRate + Math.sin(time * 3.1) * .12) * profile.prop;
        const raw = (cylinder + propeller + (rand() * 2 - 1) * .055 * (exhaust + .25)) * profile.distance;
        highPass = raw - previous + .996 * highPass;
        previous = raw;
        data[index] = Math.tanh(highPass * 1.65) * entrance * exit;
      }
      normalize(data, .78);
    });
  }

  function grenadeMechanicalBuffer(cue) {
    const sharper = cue === "grenadeB";
    const distant = cue === "grenadeC";
    return makeBuffer(`grenade-mechanical-${cue}`, .32, (data, rate) => {
      for (let index = 0; index < data.length; index += 1) {
        const time = index / rate;
        const pin = Math.exp(-time * (sharper ? 118 : 102)) * (Math.sin(time * Math.PI * 2 * 2180) + .32 * Math.sin(time * Math.PI * 2 * 3520));
        const spoonTime = time - .11;
        const spoon = spoonTime > 0 ? Math.exp(-spoonTime * 54) * (.62 * Math.sin(spoonTime * Math.PI * 2 * 860) + .2 * Math.sin(spoonTime * Math.PI * 2 * 1740)) : 0;
        data[index] = (pin * .11 + spoon * .18) * (distant ? .58 : 1);
      }
      normalize(data, distant ? .55 : .72);
    });
  }

  function explosionBuffer(cue, kind = "grenade") {
    const profiles = kind === "crash" ? {
      crashA: { duration: 1.65, blast: 1.12, dirt: .8, metal: .48, seed: 141 },
      crashB: { duration: 1.82, blast: 1.04, dirt: .9, metal: .34, seed: 142 },
      crashC: { duration: 1.42, blast: 1.18, dirt: .55, metal: .76, seed: 143 },
    } : {
      grenadeA: { duration: 1.65, blast: .92, dirt: .72, metal: .08, seed: 31 },
      grenadeB: { duration: 1.42, blast: 1, dirt: .45, metal: .12, seed: 32 },
      grenadeC: { duration: 1.82, blast: .64, dirt: .26, metal: .05, seed: 33 },
    };
    const profile = profiles[cue] || Object.values(profiles)[0];
    return makeBuffer(`${kind}-impact-${cue}`, profile.duration, (data, rate) => {
      const rand = random(profile.seed);
      let body = 0;
      let pressure = 0;
      const debris = Array.from({ length: kind === "crash" ? 18 : 12 }, () => .08 + rand() * 1.05);
      for (let index = 0; index < data.length; index += 1) {
        const time = index / rate;
        const white = rand() * 2 - 1;
        body += (white - body) * .035;
        pressure += (white - pressure) * .008;
        let sample = Math.exp(-time * 68) * white * profile.blast * 1.12
          + Math.exp(-time * 5.2) * body * profile.dirt
          + Math.exp(-time * 7.4) * pressure * profile.blast * 1.15
          + Math.exp(-time * 12) * Math.sin(time * Math.PI * 2 * 690) * profile.metal;
        if (kind === "crash" && time >= .11) {
          const local = time - .11;
          sample += Math.exp(-local * 8.8) * ((rand() * 2 - 1) * .56 + Math.sin(local * Math.PI * 2 * 39) * .62);
        }
        for (const debrisTime of debris) {
          const local = time - debrisTime;
          if (local >= 0 && local < .045) sample += Math.exp(-local * 110) * (rand() * 2 - 1) * .18;
        }
        data[index] = Math.tanh(sample * 1.38) * Math.min(1, (profile.duration - time) / .12);
      }
      normalize(data, kind === "crash" ? .92 : .88);
    });
  }

  function gunBuffer(cue) {
    const shots = cue === "gunA" ? [0] : cue === "gunB" ? [0, .14, .29] : [0, .52];
    const distant = cue === "gunC";
    return makeBuffer(`gun-${cue}`, distant ? 1.8 : 1.1, (data, rate) => {
      const rand = random(cue === "gunA" ? 51 : cue === "gunB" ? 52 : 53);
      let low = 0;
      for (let index = 0; index < data.length; index += 1) {
        const time = index / rate;
        let sample = 0;
        for (const shot of shots) {
          const local = time - shot;
          if (local < 0) continue;
          const white = rand() * 2 - 1;
          low += (white - low) * (distant ? .025 : .14);
          sample += Math.exp(-local * (distant ? 8 : 22)) * (white * (distant ? .28 : .66) + low * .5);
          sample += Math.exp(-local * 16) * Math.sin(local * Math.PI * 2 * (distant ? 58 : 82)) * .42;
        }
        data[index] = Math.tanh(sample * 1.35);
      }
      normalize(data, .78);
    });
  }

  function crashSputterBuffer(cue) {
    const profiles = {
      crashA: { duration: 2.15, seed: 801, misses: .38 },
      crashB: { duration: 2.72, seed: 802, misses: .52 },
      crashC: { duration: 1.55, seed: 803, misses: .26 },
    };
    const profile = profiles[cue] || profiles.crashA;
    return makeBuffer(`crash-sputter-${cue}`, profile.duration, (data, rate) => {
      const rand = random(profile.seed);
      let phase = 0;
      let envelope = 0;
      let body = 0;
      for (let index = 0; index < data.length; index += 1) {
        const time = index / rate;
        const progress = time / profile.duration;
        const rpm = 1540 - progress * 1040;
        phase += (rpm / 60 * 7 / 2) / rate;
        if (phase >= 1) {
          phase -= 1;
          if (Math.sin(time * 10.9) + Math.sin(time * 4.1) > -profile.misses) envelope += .48 + rand() * .5;
        }
        envelope *= Math.exp(-1 / (rate * .019));
        body += ((rand() * 2 - 1) - body) * .1;
        const radial = envelope * (body * .72 + Math.sin(time * Math.PI * 2 * 76) * .19);
        const wind = (rand() * 2 - 1) * (.025 + progress * .13);
        data[index] = Math.tanh((radial * (1 - progress * .24) + wind) * 1.45) * Math.min(1, time / .025, (profile.duration - time) / .12);
      }
      normalize(data, .78);
    });
  }

  function menuBuffer(cue) {
    const profiles = {
      menuA: { roots: [73.42, 58.27, 65.41, 55], pulse: .2, lead: [293.66, 261.63, 220, 196], warmth: .8 },
      menuB: { roots: [65.41, 55, 58.27, 49], pulse: .1, lead: [261.63, 220, 233.08, 196], warmth: .55 },
      menuC: { roots: [73.42, 65.41, 58.27, 65.41], pulse: .16, lead: [220, 246.94, 261.63, 220], warmth: 1 },
    };
    const profile = profiles[cue] || profiles.menuA;
    return makeBuffer(`menu-${cue}`, 16, (data, rate) => {
      for (let index = 0; index < data.length; index += 1) {
        const time = index / rate;
        const section = Math.min(3, Math.floor(time / 4));
        const local = time % 4;
        const root = profile.roots[section];
        const envelope = Math.min(1, local / .42, (4 - local) / .48);
        const strings = (Math.sin(time * Math.PI * 2 * root) * .14
          + Math.sin(time * Math.PI * 2 * root * 1.003) * .055
          + Math.sin(time * Math.PI * 2 * root * 1.189207) * .07
          + Math.sin(time * Math.PI * 2 * root * 1.498307) * .064
          + Math.sin(time * Math.PI * 2 * root * 2) * .018) * envelope;
        const beat = time % 2;
        const drum = beat < .18 ? Math.exp(-beat * 25) * Math.sin(beat * Math.PI * 2 * 48) * profile.pulse : 0;
        const phraseBeat = local % 1;
        const phraseEnvelope = Math.min(1, phraseBeat / .08, (1 - phraseBeat) / .26);
        const lead = profile.lead[(section + Math.min(3, Math.floor(local))) % profile.lead.length];
        const horn = (Math.sin(time * Math.PI * 2 * lead) * .032 + Math.sin(time * Math.PI * 4 * lead) * .011 + Math.sin(time * Math.PI * 6 * lead) * .004) * phraseEnvelope * profile.warmth;
        data[index] = (strings + drum + horn) * Math.min(1, time / .35, (16 - time) / .35);
      }
      normalize(data, .54);
    });
  }

  function bugleWave() {
    return context.createPeriodicWave(new Float32Array([0, 1, .82, .46, .25, .13, .07]), new Float32Array(7), { disableNormalization: false });
  }

  return {
    radialBuffer,
    grenadeMechanicalBuffer,
    grenadeImpactBuffer: (cue) => explosionBuffer(cue, "grenade"),
    gunBuffer,
    crashSputterBuffer,
    crashImpactBuffer: (cue) => explosionBuffer(cue, "crash"),
    crashDuration: (cue) => ({ crashA: 2.15, crashB: 2.72, crashC: 1.55 }[cue] || 2.15),
    menuBuffer,
    bugleWave,
    renderedBufferCount: () => cache.size,
  };
}
