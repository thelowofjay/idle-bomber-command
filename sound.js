const AudioContextClass = window.AudioContext || window.webkitAudioContext;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function createSoundDirector() {
  let context = null;
  let master = null;
  let effects = null;
  let ambience = null;
  let engineLow = null;
  let engineHigh = null;
  let engineFilter = null;
  let engineGain = null;
  let noiseBuffer = null;
  let enabled = true;
  let scene = "base";
  let lastScene = "";
  let lastAirborne = -1;
  let lastSpeed = -1;
  const lastPlayed = new Map();

  function ensureContext() {
    if (!AudioContextClass) return false;
    if (context) return true;
    context = new AudioContextClass();
    master = context.createGain();
    effects = context.createGain();
    ambience = context.createGain();
    master.gain.value = enabled ? 0.72 : 0.0001;
    effects.gain.value = 0.9;
    ambience.gain.value = 1;
    effects.connect(master);
    ambience.connect(master);
    master.connect(context.destination);
    createEngineBed();
    return true;
  }

  function createEngineBed() {
    engineLow = context.createOscillator();
    engineHigh = context.createOscillator();
    engineFilter = context.createBiquadFilter();
    engineGain = context.createGain();
    engineLow.type = "sawtooth";
    engineHigh.type = "square";
    engineLow.frequency.value = 46;
    engineHigh.frequency.value = 92;
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 420;
    engineFilter.Q.value = 0.7;
    engineGain.gain.value = 0.0001;
    engineLow.connect(engineFilter);
    engineHigh.connect(engineFilter);
    engineFilter.connect(engineGain).connect(ambience);
    engineLow.start();
    engineHigh.start();
  }

  function getNoiseBuffer() {
    if (noiseBuffer) return noiseBuffer;
    noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 1.2), context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.84 + white * 0.16;
      samples[index] = previous;
    }
    return noiseBuffer;
  }

  async function unlock() {
    if (!enabled || !ensureContext()) return false;
    if (context.state === "suspended") {
      try { await context.resume(); } catch { return false; }
    }
    return context.state === "running";
  }

  function ramp(parameter, value, duration = 0.04) {
    const now = context.currentTime;
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(Math.max(0.0001, parameter.value), now);
    parameter.exponentialRampToValueAtTime(Math.max(0.0001, value), now + duration);
  }

  function tone({ frequency, endFrequency = frequency, duration = 0.1, gain = 0.03, type = "triangle", delay = 0 }) {
    if (!context || context.state !== "running") return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.012, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope).connect(effects);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function noise({ duration = 0.12, gain = 0.04, frequency = 900, type = "lowpass", delay = 0 }) {
    if (!context || context.state !== "running") return;
    const start = context.currentTime + delay;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = getNoiseBuffer();
    filter.type = type;
    filter.frequency.value = frequency;
    envelope.gain.setValueAtTime(gain, start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(envelope).connect(effects);
    source.start(start, Math.random() * 0.35, duration);
    source.stop(start + duration + 0.02);
  }

  function canPlay(name, minimumGap = 0) {
    if (!enabled || !context || context.state !== "running") return false;
    const now = context.currentTime;
    if (now - (lastPlayed.get(name) ?? -Infinity) < minimumGap) return false;
    lastPlayed.set(name, now);
    return true;
  }

  function play(name) {
    if (!enabled) return;
    void unlock().then((ready) => {
      if (!ready) return;
      if (name === "deploy" && canPlay(name, 0.3)) {
        noise({ duration: 0.24, gain: 0.045, frequency: 520 });
        tone({ frequency: 58, endFrequency: 92, duration: 0.34, gain: 0.045, type: "sawtooth" });
      } else if (name === "pause" && canPlay(name, 0.15)) {
        tone({ frequency: 240, endFrequency: 145, duration: 0.11, gain: 0.026 });
      } else if (name === "resume" && canPlay(name, 0.15)) {
        tone({ frequency: 145, endFrequency: 240, duration: 0.11, gain: 0.026 });
      } else if (name === "priority-alert" && canPlay(name, 1)) {
        tone({ frequency: 760, duration: 0.07, gain: 0.028, type: "square" });
        tone({ frequency: 760, duration: 0.07, gain: 0.028, type: "square", delay: 0.13 });
      } else if (name === "priority-marked" && canPlay(name, 0.2)) {
        noise({ duration: 0.05, gain: 0.02, frequency: 1900, type: "bandpass" });
        tone({ frequency: 410, endFrequency: 590, duration: 0.09, gain: 0.025, type: "square", delay: 0.025 });
      } else if (name === "bomb-release" && canPlay(name, 0.08)) {
        noise({ duration: 0.045, gain: 0.018, frequency: 780, type: "bandpass" });
        tone({ frequency: 210, endFrequency: 128, duration: 0.14, gain: 0.018, type: "triangle" });
      } else if ((name === "bomb" || name === "target-destroyed") && canPlay("bomb", 0.08)) {
        noise({ duration: name === "target-destroyed" ? 0.34 : 0.24, gain: 0.075, frequency: 650 });
        tone({ frequency: 92, endFrequency: 38, duration: 0.28, gain: 0.065, type: "sine" });
        if (name === "target-destroyed") tone({ frequency: 290, endFrequency: 240, duration: 0.08, gain: 0.018, delay: 0.12 });
      } else if (name === "priority-destroyed" && canPlay(name, 0.2)) {
        noise({ duration: 0.42, gain: 0.09, frequency: 720 });
        tone({ frequency: 105, endFrequency: 34, duration: 0.4, gain: 0.075, type: "sine" });
        tone({ frequency: 420, endFrequency: 620, duration: 0.16, gain: 0.022, delay: 0.18 });
      } else if (name === "rifle" && canPlay(name, 0.12)) {
        noise({ duration: 0.035, gain: 0.024, frequency: 2300, type: "highpass" });
      } else if (name === "aa" && canPlay(name, 0.16)) {
        noise({ duration: 0.075, gain: 0.04, frequency: 980, type: "bandpass" });
        tone({ frequency: 120, endFrequency: 70, duration: 0.09, gain: 0.022, type: "square" });
      } else if (name === "fighter" && canPlay(name, 0.2)) {
        noise({ duration: 0.13, gain: 0.048, frequency: 1700, type: "highpass" });
      } else if (name === "aircraft-lost" && canPlay(name, 0.25)) {
        noise({ duration: 0.5, gain: 0.07, frequency: 780 });
        tone({ frequency: 150, endFrequency: 42, duration: 0.48, gain: 0.055, type: "sawtooth" });
      } else if (name === "fighter-alert" && canPlay(name, 2)) {
        tone({ frequency: 330, endFrequency: 270, duration: 0.1, gain: 0.024, type: "square" });
        tone({ frequency: 330, endFrequency: 270, duration: 0.1, gain: 0.024, type: "square", delay: 0.16 });
      } else if (name === "retreat" && canPlay(name, 0.5)) {
        tone({ frequency: 310, endFrequency: 170, duration: 0.38, gain: 0.04, type: "sawtooth" });
        tone({ frequency: 270, endFrequency: 145, duration: 0.38, gain: 0.028, type: "sawtooth", delay: 0.16 });
      } else if (name === "debrief" && canPlay(name, 0.5)) {
        tone({ frequency: 131, duration: 0.42, gain: 0.034, type: "triangle" });
        tone({ frequency: 196, duration: 0.42, gain: 0.026, type: "triangle", delay: 0.08 });
        tone({ frequency: 262, duration: 0.5, gain: 0.022, type: "triangle", delay: 0.16 });
      } else if (name === "purchase" && canPlay(name, 0.08)) {
        noise({ duration: 0.045, gain: 0.025, frequency: 1200, type: "bandpass" });
        tone({ frequency: 470, endFrequency: 610, duration: 0.07, gain: 0.022, delay: 0.02 });
      } else if (name === "enabled" && canPlay(name, 0.1)) {
        tone({ frequency: 360, endFrequency: 540, duration: 0.12, gain: 0.026 });
      }
    });
  }

  function sync(nextScene, operation, speedMultiplier = 1) {
    scene = nextScene;
    if (!context || !engineGain) return;
    const airborne = operation?.aircraft?.filter((plane) => !["ground", "taxiOut", "landingRoll", "taxiIn", "knocked"].includes(plane.phase)).length || 0;
    if (airborne === lastAirborne && speedMultiplier === lastSpeed && nextScene === lastScene) return;
    lastAirborne = airborne;
    lastSpeed = speedMultiplier;
    lastScene = nextScene;
    const active = enabled && nextScene === "playing" && airborne > 0;
    const density = clamp(Math.log2(airborne + 1) / 4, 0, 1);
    ramp(engineGain.gain, active ? 0.018 + density * 0.035 : 0.0001, active ? 0.18 : 0.08);
    const base = 43 + clamp(airborne, 0, 8) * 1.6;
    engineLow.frequency.setTargetAtTime(base * speedMultiplier, context.currentTime, 0.08);
    engineHigh.frequency.setTargetAtTime(base * 2.04 * speedMultiplier, context.currentTime, 0.08);
    engineFilter.frequency.setTargetAtTime(320 + density * 320, context.currentTime, 0.1);
  }

  function setEnabled(nextEnabled, preview = false) {
    enabled = Boolean(nextEnabled);
    if (context && master) ramp(master.gain, enabled ? 0.72 : 0.0001, 0.04);
    if (enabled && preview) play("enabled");
  }

  function getState() {
    return { available: Boolean(AudioContextClass), enabled, contextState: context?.state || "not-created", scene, airborne: Math.max(0, lastAirborne) };
  }

  return { unlock, play, sync, setEnabled, getState };
}
