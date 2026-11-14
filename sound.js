import {
  createAudioLibrary,
  favoriteCount,
  readFavoriteCues,
  readSoundMix,
  writeSoundMix,
} from "./audio-library.js";

const AudioContextClass = window.AudioContext || window.webkitAudioContext;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function createSoundDirector() {
  let context = null;
  let library = null;
  let master = null;
  let musicBus = null;
  let engineBus = null;
  let weaponsBus = null;
  let explosionsBus = null;
  let alertsBus = null;
  let menuSceneGain = null;
  let engineSceneGain = null;
  let menuSource = null;
  let engineSource = null;
  let fighterSource = null;
  let fighterGain = null;
  let fighterPanner = null;
  let noiseBuffer = null;
  let enabled = true;
  let scene = "base";
  let previousScene = "";
  let lastAirborne = -1;
  let lastSpeed = -1;
  let selections = readFavoriteCues();
  let mix = readSoundMix();
  const lastPlayed = new Map();
  const activeSources = new Map(["music", "engines", "weapons", "explosions", "alerts"].map((name) => [name, new Set()]));
  let combatSuppressed = false;
  let lastPreviewBus = "";

  function track(source, group) {
    const sources = activeSources.get(group);
    if (!sources) return source;
    sources.add(source);
    source.addEventListener("ended", () => sources.delete(source), { once: true });
    return source;
  }

  function stopGroup(group) {
    for (const source of activeSources.get(group) || []) {
      try { source.stop(); } catch {}
    }
    activeSources.get(group)?.clear();
  }

  function stopFighter() {
    try { fighterSource?.stop(); } catch {}
    fighterSource = null;
    fighterGain = null;
    fighterPanner = null;
  }

  function ensureContext() {
    if (!AudioContextClass) return false;
    if (context) return true;
    context = new AudioContextClass();
    library = createAudioLibrary(context);
    master = context.createGain();
    musicBus = context.createGain();
    engineBus = context.createGain();
    weaponsBus = context.createGain();
    explosionsBus = context.createGain();
    alertsBus = context.createGain();
    menuSceneGain = context.createGain();
    engineSceneGain = context.createGain();
    menuSceneGain.gain.value = .0001;
    engineSceneGain.gain.value = .0001;
    menuSceneGain.connect(musicBus);
    engineSceneGain.connect(engineBus);
    for (const bus of [musicBus, engineBus, weaponsBus, explosionsBus, alertsBus]) bus.connect(master);
    master.connect(context.destination);
    applyMix(false);
    createLoopSources();
    return true;
  }

  function createLoopSources() {
    if (!context || !library) return;
    try { menuSource?.stop(); } catch {}
    try { engineSource?.stop(); } catch {}
    menuSource = context.createBufferSource();
    menuSource.buffer = library.menuBuffer(selections.menu);
    menuSource.loop = true;
    menuSource.connect(menuSceneGain);
    menuSource.start();
    engineSource = context.createBufferSource();
    engineSource.buffer = library.radialBuffer(selections.engine);
    engineSource.loop = true;
    engineSource.playbackRate.value = 1;
    engineSource.connect(engineSceneGain);
    engineSource.start();
  }

  function ramp(parameter, value, duration = .06) {
    if (!context || !parameter) return;
    const now = context.currentTime;
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(Math.max(.0001, parameter.value), now);
    parameter.exponentialRampToValueAtTime(Math.max(.0001, value), now + duration);
  }

  function applyMix(smooth = true) {
    if (!context) return;
    const set = smooth ? ramp : (parameter, value) => { parameter.value = Math.max(.0001, value); };
    set(master.gain, enabled ? mix.master : .0001);
    set(musicBus.gain, mix.music);
    set(engineBus.gain, mix.engines);
    set(weaponsBus.gain, mix.weapons);
    set(explosionsBus.gain, mix.explosions);
    set(alertsBus.gain, mix.alerts);
  }

  function getNoiseBuffer() {
    if (noiseBuffer) return noiseBuffer;
    noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 1.2), context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * .84 + white * .16;
      samples[index] = previous;
    }
    return noiseBuffer;
  }

  async function unlock() {
    if (!enabled || !ensureContext()) return false;
    if (context.state === "suspended") {
      try { await context.resume(); } catch { return false; }
    }
    sync(scene, null, 1, true);
    return context.state === "running";
  }

  function playBuffer(buffer, bus, gain = 1, group = "alerts") {
    if (!context || context.state !== "running") return;
    const source = context.createBufferSource();
    const envelope = context.createGain();
    source.buffer = buffer;
    envelope.gain.value = gain;
    source.connect(envelope).connect(bus);
    track(source, group);
    source.start();
    return source;
  }

  function tone({ frequency, endFrequency = frequency, duration = .1, gain = .03, type = "triangle", delay = 0, bus = alertsBus, group = "alerts" }) {
    if (!context || context.state !== "running") return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + Math.min(.012, duration * .2));
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(envelope).connect(bus);
    track(oscillator, group);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }

  function noise({ duration = .12, gain = .04, frequency = 900, type = "lowpass", delay = 0, bus = alertsBus, group = "alerts" }) {
    if (!context || context.state !== "running") return;
    const start = context.currentTime + delay;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = getNoiseBuffer();
    filter.type = type;
    filter.frequency.value = frequency;
    envelope.gain.setValueAtTime(gain, start);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter).connect(envelope).connect(bus);
    track(source, group);
    source.start(start, Math.random() * .35, duration);
    source.stop(start + duration + .02);
  }

  function canPlay(name, minimumGap = 0) {
    if (!enabled || !context || context.state !== "running") return false;
    const now = context.currentTime;
    if (now - (lastPlayed.get(name) ?? -Infinity) < minimumGap) return false;
    lastPlayed.set(name, now);
    return true;
  }

  function bugleNote(start, duration, frequency, gain, distant = false) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    oscillator.setPeriodicWave(library.bugleWave());
    oscillator.frequency.setValueAtTime(frequency * .982, context.currentTime + start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency, context.currentTime + start + .045);
    filter.type = "lowpass";
    filter.frequency.value = distant ? 1700 : 3100;
    envelope.gain.setValueAtTime(.0001, context.currentTime + start);
    envelope.gain.exponentialRampToValueAtTime(gain, context.currentTime + start + .035);
    envelope.gain.setValueAtTime(gain, context.currentTime + start + Math.max(.04, duration - .1));
    envelope.gain.exponentialRampToValueAtTime(.0001, context.currentTime + start + duration);
    oscillator.connect(filter).connect(envelope).connect(alertsBus);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + .02);
  }

  function playRetreatCall() {
    const distant = selections.complete === "completeB";
    const speed = selections.complete === "completeC" ? .78 : 1;
    const notes = [
      [0, .43, 587.33], [.47, .13, 587.33], [.64, .56, 587.33],
      [1.28, .43, 493.88], [1.75, .13, 493.88], [1.92, .56, 493.88],
      [2.56, .43, 392], [3.03, .13, 392], [3.2, .62, 392],
    ];
    for (const [start, duration, frequency] of notes) bugleNote(start * speed, duration * speed, frequency, distant ? .065 : .1, distant);
  }

  function play(name) {
    if (!enabled) return;
    void unlock().then((ready) => {
      if (!ready) return;
      if (combatSuppressed && !["debrief", "enabled"].includes(name)) return;
      if (name === "deploy" && canPlay(name, .3)) {
        noise({ duration: .24, gain: .045, frequency: 520 });
        tone({ frequency: 58, endFrequency: 92, duration: .34, gain: .045, type: "sawtooth" });
      } else if (name === "pause" && canPlay(name, .15)) {
        tone({ frequency: 240, endFrequency: 145, duration: .11, gain: .026 });
      } else if (name === "resume" && canPlay(name, .15)) {
        tone({ frequency: 145, endFrequency: 240, duration: .11, gain: .026 });
      } else if (name === "priority-alert" && canPlay(name, 1)) {
        tone({ frequency: 760, duration: .07, gain: .028, type: "square" });
        tone({ frequency: 760, duration: .07, gain: .028, type: "square", delay: .13 });
      } else if (name === "priority-marked" && canPlay(name, .2)) {
        noise({ duration: .05, gain: .02, frequency: 1900, type: "bandpass" });
        tone({ frequency: 410, endFrequency: 590, duration: .09, gain: .025, type: "square", delay: .025 });
      } else if (name === "bomb-release" && canPlay(name, .08)) {
        playBuffer(library.grenadeMechanicalBuffer(selections.grenade), weaponsBus, .9, "weapons");
      } else if ((name === "bomb" || name === "target-destroyed" || name === "priority-destroyed") && canPlay("grenade-impact", .08)) {
        playBuffer(library.grenadeImpactBuffer(selections.grenade), explosionsBus, name === "priority-destroyed" ? 1 : .88, "explosions");
      } else if ((name === "rifle" || name === "aa") && canPlay(name, name === "aa" ? .16 : .12)) {
        playBuffer(library.gunBuffer(selections.gun), weaponsBus, name === "aa" ? .74 : .56, "weapons");
      } else if (name === "fighter" && canPlay(name, .2)) {
        playBuffer(library.gunBuffer(selections.gun), weaponsBus, .62, "weapons");
      } else if (name === "fighter-alert" && canPlay(name, 2)) {
        tone({ frequency: 520, endFrequency: 420, duration: .16, gain: .018, type: "triangle" });
      } else if (name === "aircraft-sputter" && canPlay(name, .25)) {
        playBuffer(library.crashSputterBuffer(selections.crash), engineBus, .82, "engines");
      } else if ((name === "aircraft-impact" || name === "aircraft-lost") && canPlay("aircraft-impact", .25)) {
        playBuffer(library.crashImpactBuffer(selections.crash), explosionsBus, .95, "explosions");
      } else if (name === "retreat" && canPlay(name, .5)) {
        tone({ frequency: 310, endFrequency: 170, duration: .38, gain: .04, type: "sawtooth" });
        tone({ frequency: 270, endFrequency: 145, duration: .38, gain: .028, type: "sawtooth", delay: .16 });
      } else if (name === "debrief" && canPlay(name, .5)) {
        playRetreatCall();
      } else if (name === "purchase" && canPlay(name, .08)) {
        noise({ duration: .045, gain: .025, frequency: 1200, type: "bandpass" });
        tone({ frequency: 470, endFrequency: 610, duration: .07, gain: .022, delay: .02 });
      } else if (name === "enabled" && canPlay(name, .1)) {
        tone({ frequency: 360, endFrequency: 540, duration: .12, gain: .026 });
      }
    });
  }

  function syncFighter(fighter, speedMultiplier = 1) {
    if (!context || combatSuppressed || scene !== "playing" || !fighter) {
      stopFighter();
      return;
    }
    if (!fighterSource) {
      fighterSource = context.createBufferSource();
      fighterGain = context.createGain();
      fighterPanner = context.createStereoPanner ? context.createStereoPanner() : null;
      fighterSource.buffer = library.radialBuffer(selections.enemy);
      fighterSource.loop = true;
      fighterSource.connect(fighterGain);
      if (fighterPanner) fighterGain.connect(fighterPanner).connect(engineBus);
      else fighterGain.connect(engineBus);
      fighterSource.start();
    }
    const pan = clamp((fighter.x / 390) * 2 - 1, -1, 1);
    const edgeDistance = Math.min(fighter.x + 58, 448 - fighter.x);
    const proximity = clamp(edgeDistance / 150, .08, 1);
    fighterGain.gain.setTargetAtTime(.06 + proximity * .2, context.currentTime, .06);
    if (fighterPanner) fighterPanner.pan.setTargetAtTime(pan, context.currentTime, .06);
    fighterSource.playbackRate.setTargetAtTime(speedMultiplier * 1.08, context.currentTime, .06);
  }

  function enterDebrief() {
    combatSuppressed = true;
    stopFighter();
    for (const group of ["engines", "weapons", "explosions", "alerts"]) stopGroup(group);
    if (context) {
      ramp(engineSceneGain?.gain, .0001, .04);
      ramp(menuSceneGain?.gain, .0001, .04);
    }
  }

  function previewBus(name) {
    if (!enabled) return;
    void unlock().then((ready) => {
      if (!ready) return;
      lastPreviewBus = name;
      if (name === "engines") {
        const sample = playBuffer(library.radialBuffer(selections.engine), engineBus, .36, "engines");
        try { sample?.stop(context.currentTime + 1.2); } catch {}
      }
      else if (name === "weapons") playBuffer(library.grenadeMechanicalBuffer(selections.grenade), weaponsBus, .8, "weapons");
      else if (name === "explosions") playBuffer(library.grenadeImpactBuffer(selections.grenade), explosionsBus, .7, "explosions");
      else if (name === "alerts") tone({ frequency: 440, endFrequency: 620, duration: .14, gain: .035 });
      else if (name === "master") tone({ frequency: 360, endFrequency: 520, duration: .14, gain: .03 });
    });
  }

  function sync(nextScene, operation, speedMultiplier = 1, force = false) {
    const sceneChanged = nextScene !== previousScene;
    scene = nextScene;
    if (nextScene !== "debrief") combatSuppressed = false;
    if (!context || !engineSceneGain || !menuSceneGain) return;
    const airborne = operation?.aircraft?.filter((plane) => !["ground", "taxiOut", "landingRoll", "taxiIn", "crashing", "knocked"].includes(plane.phase)).length || 0;
    syncFighter(operation?.fighter || null, speedMultiplier);
    if (!force && !sceneChanged && airborne === lastAirborne && speedMultiplier === lastSpeed) return;
    previousScene = nextScene;
    lastAirborne = airborne;
    lastSpeed = speedMultiplier;
    const density = clamp(Math.log2(airborne + 1) / 4, 0, 1);
    ramp(menuSceneGain.gain, enabled && nextScene === "base" ? .72 : .0001, .18);
    ramp(engineSceneGain.gain, enabled && nextScene === "playing" && airborne > 0 ? .08 + density * .18 : .0001, nextScene === "playing" ? .18 : .08);
    if (engineSource) engineSource.playbackRate.setTargetAtTime(speedMultiplier, context.currentTime, .08);
  }

  function setEnabled(nextEnabled, preview = false) {
    enabled = Boolean(nextEnabled);
    if (context) {
      applyMix();
      sync(scene, null, 1, true);
    }
    if (enabled && preview) play("enabled");
  }

  function setMix(nextMix) {
    mix = writeSoundMix({ ...mix, ...nextMix });
    applyMix();
    return { ...mix };
  }

  function refreshPreferences() {
    const next = readFavoriteCues();
    const changed = Object.keys(next).some((key) => next[key] !== selections[key]);
    selections = next;
    if (changed && context) createLoopSources();
    return { ...selections };
  }

  function getState() {
    return {
      available: Boolean(AudioContextClass),
      enabled,
      contextState: context?.state || "not-created",
      scene,
      airborne: Math.max(0, lastAirborne),
      favorites: favoriteCount(),
      selections: { ...selections },
      mix: { ...mix },
      crashDuration: library?.crashDuration(selections.crash) || ({ crashA: 2.15, crashB: 2.72, crashC: 1.55 }[selections.crash] || 2.15),
      renderedBuffers: library?.renderedBufferCount() || 0,
      combatSuppressed,
      fighterActive: Boolean(fighterSource),
      fighterPan: fighterPanner?.pan.value || 0,
      activeCombatSources: ["engines", "weapons", "explosions"].reduce((total, group) => total + (activeSources.get(group)?.size || 0), 0),
      lastPreviewBus,
    };
  }

  return {
    unlock,
    play,
    sync,
    enterDebrief,
    previewBus,
    setEnabled,
    setMix,
    refreshPreferences,
    getCrashDuration: () => library?.crashDuration(selections.crash) || ({ crashA: 2.15, crashB: 2.72, crashC: 1.55 }[selections.crash] || 2.15),
    getState,
  };
}
