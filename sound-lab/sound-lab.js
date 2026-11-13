const CATEGORIES = [
  ["Biplane radial engine", "Seven-cylinder mechanical pulse, modeled after the 1:40–2:00 reference", [["Warm Radial", "heavy uneven exhaust at moderate power", "engineA"], ["Airborne Cruise", "cleaner prop wash and higher flight RPM", "engineB"], ["Distant Formation", "several softened radials across the field", "engineC"]]],
  ["Grenade", "Separate pin, spoon, pressure wave, dirt, and debris layers", [["Pin, Spoon & Dirt", "close mechanical release and outdoor impact", "grenadeA"], ["Hard Ground", "sharper report with a shorter debris tail", "grenadeB"], ["Distant Field", "more air and distance, less close debris", "grenadeC"]]],
  ["Ground gunfire", "Rifle and anti-air attack cues", [["Dry Rifle", "single sharp trench crack", "gunA"], ["AA Burst", "the retained three-shot heavy burst", "gunB"], ["Distant Battery", "muffled report with a field echo", "gunC"]]],
  ["Enemy radial fighter", "The same engine family at a faster, more threatening pitch", [["Interceptor Approach", "fast radial building toward the listener", "enemyA"], ["Diving Fighter", "higher RPM with a close propeller bite", "enemyB"], ["Distant Hunter", "muted radial circling beyond the field", "enemyC"]]],
  ["Aircraft shot down", "Failing radial engine, uncontrolled descent, breakup, and ground explosion", [["Sputter & Ground Strike", "the reference-matched full engine-failure sequence", "crashA"], ["Burning Descent", "longer intermittent radial cough before impact", "crashB"], ["Close Collision", "shorter descent with a harder airframe breakup", "crashC"]]],
  ["Sortie complete · Retreat", "The traditional descending Retreat bugle opening", [["Field Bugler", "clear close brass, about three seconds", "completeA"], ["Distant Bugler", "softer call with open-field reflection", "completeB"], ["Short Retreat", "the same call compressed for repeated sorties", "completeC"]]],
  ["Main menu loop", "Original subdued tactical music with melody and harmony—no radio hiss or noise bed", [["Tactical Dusk", "low strings, measured field drum, and muted brass", "menuA"], ["Map Room", "quiet minor strings with sparse piano-like notes", "menuB"], ["Airfield Watch", "warmer horn harmony and a patient marching pulse", "menuC"]]],
];

const grid = document.querySelector("#soundGrid");
const volume = document.querySelector("#volume");
const volumeValue = document.querySelector("#volumeValue");
const selectionCount = document.querySelector("#selectionCount");
const saved = JSON.parse(localStorage.getItem("ibc-sound-favorites") || "{}");
const bufferCache = new Map();
let audio;
let active = [];

for (const [category, description, variants] of CATEGORIES) {
  const section = document.createElement("section");
  section.className = "category";
  const slug = category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");
  section.innerHTML = `<h2>${category}</h2><p>${description}</p><div class="variants">${variants.map(([name, note, cue]) => `<article class="variant"><button class="play" type="button" data-cue="${cue}" aria-label="Play ${name}">▶</button><span><strong>${name}</strong><small>${note}</small></span><label class="favorite"><input type="radio" name="${slug}" value="${name}" ${saved[slug] === name ? "checked" : ""}>Favorite</label></article>`).join("")}</div>`;
  grid.append(section);
}

function context() {
  audio ||= new AudioContext();
  if (audio.state === "suspended") audio.resume();
  return audio;
}

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeBuffer(key, duration, render) {
  const ac = context();
  const cacheKey = `${key}-${ac.sampleRate}`;
  if (bufferCache.has(cacheKey)) return bufferCache.get(cacheKey);
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
  render(buffer.getChannelData(0), ac.sampleRate);
  bufferCache.set(cacheKey, buffer);
  return buffer;
}

function normalize(data, ceiling = .92) {
  let peak = .001;
  for (const sample of data) peak = Math.max(peak, Math.abs(sample));
  const gain = ceiling / peak;
  for (let i = 0; i < data.length; i += 1) data[i] *= gain;
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
  const profile = profiles[cue];
  return makeBuffer(cue, 6, (data, rate) => {
    const rand = random(profile.seed);
    let phase = 0;
    let secondPhase = .38;
    let exhaust = 0;
    let exhaust2 = 0;
    let lowNoise = 0;
    let highPass = 0;
    let previous = 0;
    for (let i = 0; i < data.length; i += 1) {
      const time = i / rate;
      const entrance = Math.min(1, time / .12);
      const exit = Math.min(1, (6 - time) / .18);
      const rpmWander = profile.rpm * (1 + Math.sin(time * .73) * .018 + Math.sin(time * 2.17) * .008 + (profile.rise || 0) * (time / 6));
      const fireRate = rpmWander / 60 * 7 / 2;
      phase += fireRate / rate;
      if (phase >= 1) { phase -= 1; exhaust += .78 + rand() * .28; }
      if (profile.chorus) {
        secondPhase += fireRate * 1.035 / rate;
        if (secondPhase >= 1) { secondPhase -= 1; exhaust2 += .38 + rand() * .18; }
      }
      exhaust *= Math.exp(-1 / (rate * .019));
      exhaust2 *= Math.exp(-1 / (rate * .024));
      lowNoise += ((rand() * 2 - 1) - lowNoise) * .09;
      const cylinder = (exhaust + exhaust2) * (lowNoise * profile.noise + Math.sin(time * 2 * Math.PI * (72 + rpmWander * .012)) * .24);
      const bladeRate = rpmWander / 60 * 2;
      const propeller = Math.sin(time * 2 * Math.PI * bladeRate + Math.sin(time * 3.1) * .12) * profile.prop;
      const mechanical = (rand() * 2 - 1) * .055 * (exhaust + .25);
      const raw = (cylinder + propeller + mechanical) * profile.distance;
      highPass = raw - previous + .996 * highPass;
      previous = raw;
      data[i] = Math.tanh(highPass * 1.65) * entrance * exit;
    }
    normalize(data, .78);
  });
}

function grenadeBuffer(cue) {
  const profiles = {
    grenadeA: { blast: .92, dirt: .72, distance: 1, delay: .82, seed: 31 },
    grenadeB: { blast: 1, dirt: .45, distance: .94, delay: .7, seed: 32 },
    grenadeC: { blast: .64, dirt: .26, distance: .58, delay: 1.02, seed: 33 },
  };
  const profile = profiles[cue];
  return makeBuffer(cue, 2.8, (data, rate) => {
    const rand = random(profile.seed);
    let blastNoise = 0;
    let dirtNoise = 0;
    const debris = Array.from({ length: 12 }, () => profile.delay + .12 + rand() * .72);
    for (let i = 0; i < data.length; i += 1) {
      const time = i / rate;
      let sample = 0;
      const pin = Math.exp(-time * 90) * (Math.sin(time * 2 * Math.PI * 2850) + .55 * Math.sin(time * 2 * Math.PI * 4380));
      const spoonTime = time - .11;
      const spoon = spoonTime > 0 ? Math.exp(-spoonTime * 42) * (.7 * Math.sin(spoonTime * 2 * Math.PI * 1180) + .38 * Math.sin(spoonTime * 2 * Math.PI * 2070)) : 0;
      sample += pin * .16 + spoon * .22;
      const impactTime = time - profile.delay;
      if (impactTime >= 0) {
        const white = rand() * 2 - 1;
        blastNoise += (white - blastNoise) * .34;
        dirtNoise += (white - dirtNoise) * .045;
        const crack = Math.exp(-impactTime * 34) * white * profile.blast;
        const body = Math.exp(-impactTime * 6.2) * blastNoise * .72;
        const pressure = Math.exp(-impactTime * 8.5) * Math.sin(impactTime * 2 * Math.PI * 54) * .85;
        const dirt = Math.exp(-impactTime * 3.6) * dirtNoise * profile.dirt;
        sample += (crack + body + pressure + dirt) * profile.distance;
      }
      for (let index = 0; index < debris.length; index += 1) {
        const debrisTime = time - debris[index];
        if (debrisTime >= 0 && debrisTime < .035) sample += Math.exp(-debrisTime * 120) * (rand() * 2 - 1) * .16 * profile.dirt;
      }
      data[i] = Math.tanh(sample * 1.25);
    }
    normalize(data, .9);
  });
}

function impactBuffer(cue) {
  const profile = cue === "crashA" ? { duration: 3.5, hitAt: 2.15, seed: 41, metal: .48, misses: .38 }
    : cue === "crashB" ? { duration: 4.1, hitAt: 2.72, seed: 42, metal: .34, misses: .52 }
      : { duration: 2.8, hitAt: 1.55, seed: 43, metal: .76, misses: .26 };
  return makeBuffer(cue, profile.duration, (data, rate) => {
    const rand = random(profile.seed);
    let pulsePhase = 0;
    let pulseEnvelope = 0;
    let engineNoise = 0;
    let impactBody = 0;
    const debris = Array.from({ length: 18 }, () => profile.hitAt + .08 + rand() * 1.05);
    for (let i = 0; i < data.length; i += 1) {
      const time = i / rate;
      let sample = 0;
      if (time < profile.hitAt) {
        const descent = time / profile.hitAt;
        const rpm = 1540 - descent * 1040;
        pulsePhase += (rpm / 60 * 7 / 2) / rate;
        if (pulsePhase >= 1) {
          pulsePhase -= 1;
          const firingWindow = Math.sin(time * 10.9) + Math.sin(time * 4.1);
          if (firingWindow > -profile.misses) pulseEnvelope += .48 + rand() * .5;
        }
        pulseEnvelope *= Math.exp(-1 / (rate * .019));
        engineNoise += ((rand() * 2 - 1) - engineNoise) * .1;
        const radial = pulseEnvelope * (engineNoise * .72 + Math.sin(time * 2 * Math.PI * 76) * .19);
        const wind = (rand() * 2 - 1) * (.025 + descent * .13);
        sample += radial * (1 - descent * .24) + wind;
      }
      const hit = time - profile.hitAt;
      if (hit >= 0) {
        const white = rand() * 2 - 1;
        impactBody += (white - impactBody) * .055;
        const initialCrack = Math.exp(-hit * 46) * white * 1.16;
        const earth = Math.exp(-hit * 5.2) * impactBody * .94;
        const pressure = Math.exp(-hit * 7.4) * Math.sin(hit * 2 * Math.PI * 46) * .96;
        const timber = Math.exp(-hit * 13) * Math.sin(hit * 2 * Math.PI * 690) * profile.metal;
        const secondaryTime = hit - .11;
        const fuelBurst = secondaryTime >= 0
          ? Math.exp(-secondaryTime * 8.8) * ((rand() * 2 - 1) * .56 + Math.sin(secondaryTime * 2 * Math.PI * 39) * .62)
          : 0;
        sample += initialCrack + earth + pressure + timber + fuelBurst;
      }
      for (const debrisTime of debris) {
        const local = time - debrisTime;
        if (local >= 0 && local < .045) sample += Math.exp(-local * 110) * (rand() * 2 - 1) * .18;
      }
      const fade = Math.min(1, time / .025, (profile.duration - time) / .12);
      data[i] = Math.tanh(sample * 1.42) * fade;
    }
    normalize(data, .91);
  });
}

function gunBuffer(cue) {
  const shots = cue === "gunA" ? [0] : cue === "gunB" ? [0, .14, .29] : [0, .52];
  const distant = cue === "gunC";
  return makeBuffer(cue, distant ? 1.8 : 1.1, (data, rate) => {
    const rand = random(cue === "gunA" ? 51 : cue === "gunB" ? 52 : 53);
    let low = 0;
    for (let i = 0; i < data.length; i += 1) {
      const time = i / rate;
      let sample = 0;
      for (const shot of shots) {
        const local = time - shot;
        if (local < 0) continue;
        const white = rand() * 2 - 1;
        low += (white - low) * (distant ? .025 : .14);
        sample += Math.exp(-local * (distant ? 8 : 22)) * (white * (distant ? .28 : .66) + low * .5);
        sample += Math.exp(-local * 16) * Math.sin(local * 2 * Math.PI * (distant ? 58 : 82)) * .42;
      }
      data[i] = Math.tanh(sample * 1.35);
    }
    normalize(data, .78);
  });
}

function bugleWave(ac) {
  return ac.createPeriodicWave(new Float32Array([0, 1, .82, .46, .25, .13, .07]), new Float32Array(7), { disableNormalization: false });
}

function bugleNote(start, duration, frequency, gain, distant = false) {
  const ac = context();
  const oscillator = ac.createOscillator();
  const filter = ac.createBiquadFilter();
  const amp = ac.createGain();
  oscillator.setPeriodicWave(bugleWave(ac));
  oscillator.frequency.setValueAtTime(frequency * .982, ac.currentTime + start);
  oscillator.frequency.exponentialRampToValueAtTime(frequency, ac.currentTime + start + .045);
  filter.type = "lowpass";
  filter.frequency.value = distant ? 1700 : 3100;
  amp.gain.setValueAtTime(.0001, ac.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(gain * Number(volume.value), ac.currentTime + start + .035);
  amp.gain.setValueAtTime(gain * Number(volume.value), ac.currentTime + start + Math.max(.04, duration - .1));
  amp.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + start + duration);
  oscillator.connect(filter).connect(amp).connect(ac.destination);
  oscillator.start(ac.currentTime + start);
  oscillator.stop(ac.currentTime + start + duration + .02);
  active.push(oscillator);
}

function playRetreat(cue) {
  const distant = cue === "completeB";
  const speed = cue === "completeC" ? .78 : 1;
  const notes = [
    [0, .43, 587.33], [.47, .13, 587.33], [.64, .56, 587.33],
    [1.28, .43, 493.88], [1.75, .13, 493.88], [1.92, .56, 493.88],
    [2.56, .43, 392], [3.03, .13, 392], [3.2, .62, 392],
  ];
  for (const [start, duration, frequency] of notes) bugleNote(start * speed, duration * speed, frequency, distant ? .07 : .105, distant);
}

function menuBuffer(cue) {
  const profiles = {
    menuA: { roots: [73.42, 58.27, 65.41, 55], pulse: .2, lead: [293.66, 261.63, 220, 196], warmth: .8 },
    menuB: { roots: [65.41, 55, 58.27, 49], pulse: .1, lead: [261.63, 220, 233.08, 196], warmth: .55 },
    menuC: { roots: [73.42, 65.41, 58.27, 65.41], pulse: .16, lead: [220, 246.94, 261.63, 220], warmth: 1 },
  };
  const profile = profiles[cue];
  const duration = 16;
  return makeBuffer(cue, duration, (data, rate) => {
    for (let i = 0; i < data.length; i += 1) {
      const time = i / rate;
      const section = Math.min(3, Math.floor(time / 4));
      const local = time % 4;
      const root = profile.roots[section];
      const envelope = Math.min(1, local / .42, (4 - local) / .48);
      const minorThird = root * 1.189207;
      const fifth = root * 1.498307;
      const strings = (
        Math.sin(time * 2 * Math.PI * root) * .14
        + Math.sin(time * 2 * Math.PI * root * 1.003) * .055
        + Math.sin(time * 2 * Math.PI * minorThird) * .07
        + Math.sin(time * 2 * Math.PI * fifth) * .064
        + Math.sin(time * 2 * Math.PI * root * 2) * .018
      ) * envelope;
      const beat = time % 2;
      const drum = beat < .18 ? Math.exp(-beat * 25) * Math.sin(beat * 2 * Math.PI * 48) * profile.pulse : 0;
      const phraseBeat = local % 1;
      const phraseEnvelope = Math.min(1, phraseBeat / .08, (1 - phraseBeat) / .26);
      const phraseStep = Math.min(3, Math.floor(local));
      const leadFrequency = profile.lead[(section + phraseStep) % profile.lead.length];
      const horn = (
        Math.sin(time * 2 * Math.PI * leadFrequency) * .032
        + Math.sin(time * 2 * Math.PI * leadFrequency * 2) * .011
        + Math.sin(time * 2 * Math.PI * leadFrequency * 3) * .004
      ) * phraseEnvelope * profile.warmth;
      const masterFade = Math.min(1, time / .35, (duration - time) / .35);
      data[i] = (strings + drum + horn) * masterFade;
    }
    normalize(data, .54);
  });
}

function playBuffer(buffer, { loop = false } = {}) {
  const ac = context();
  const source = ac.createBufferSource();
  const amp = ac.createGain();
  source.buffer = buffer;
  source.loop = loop;
  amp.gain.value = Number(volume.value);
  source.connect(amp).connect(ac.destination);
  source.start();
  active.push(source);
}

function play(cue) {
  stop();
  if (cue.startsWith("engine") || cue.startsWith("enemy")) playBuffer(radialBuffer(cue));
  else if (cue.startsWith("grenade")) playBuffer(grenadeBuffer(cue));
  else if (cue.startsWith("gun")) playBuffer(gunBuffer(cue));
  else if (cue.startsWith("crash")) playBuffer(impactBuffer(cue));
  else if (cue.startsWith("complete")) playRetreat(cue);
  else if (cue.startsWith("menu")) playBuffer(menuBuffer(cue), { loop: true });
}

function stop() {
  for (const node of active) { try { node.stop(); } catch {} }
  active = [];
}

function updateCount() {
  selectionCount.textContent = `${Object.keys(saved).length} of ${CATEGORIES.length} favorites selected`;
}

grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cue]");
  if (button) play(button.dataset.cue);
});
grid.addEventListener("change", (event) => {
  if (event.target.type !== "radio") return;
  saved[event.target.name] = event.target.value;
  localStorage.setItem("ibc-sound-favorites", JSON.stringify(saved));
  updateCount();
});
volume.addEventListener("input", () => { volumeValue.value = `${Math.round(Number(volume.value) * 100)}%`; });
document.querySelector("#stopAll").addEventListener("click", stop);
document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
window.__IBC_SOUND_LAB__ = {
  getState: () => ({
    available: Boolean(window.AudioContext),
    contextState: audio?.state || "uncreated",
    activeNodes: active.length,
    renderedBuffers: bufferCache.size,
  }),
};
updateCount();
