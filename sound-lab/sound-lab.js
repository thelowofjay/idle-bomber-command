const CATEGORIES = [
  ["Biplane engine", "Continuous airborne character", [["Canvas Chug", "uneven low piston rhythm", "engineA"], ["Rotary Rattle", "brighter vintage rotary pulse", "engineB"], ["Distant Formation", "soft layered squadron bed", "engineC"]]],
  ["Grenade drop", "Release, fall, and impact as one preview", [["Pin & Tumble", "metal pin, airy fall, dirt impact", "grenadeA"], ["Canvas Toss", "soft release with chunky blast", "grenadeB"], ["Field Pop", "short fall and restrained report", "grenadeC"]]],
  ["Ground gunfire", "Rifle and anti-air attack cues", [["Dry Rifle", "single sharp trench crack", "gunA"], ["AA Burst", "three heavier mechanical shots", "gunB"], ["Distant Battery", "muffled report with tail", "gunC"]]],
  ["Enemy aircraft", "Hostile fighter arrival and pass", [["Incoming Whine", "rising propeller warning", "enemyA"], ["Fast Flyby", "quick doppler-like sweep", "enemyB"], ["Hunter Drone", "dark sustained pursuit tone", "enemyC"]]],
  ["Aircraft crash", "Loss cue without cartoon excess", [["Canvas Tear", "rip, impact, and debris", "crashA"], ["Engine Failure", "descending motor into thud", "crashB"], ["Hard Landing", "short metallic ground strike", "crashC"]]],
  ["Sortie complete", "Debrief and reward confirmation", [["Brass Dispatch", "brief confident command motif", "completeA"], ["Field Bell", "restrained three-note signal", "completeB"], ["Quiet Victory", "warm low closing cadence", "completeC"]]],
  ["Main menu bed", "Optional subtle loop-style atmosphere", [["Dawn Airfield", "wind, distant engine, light hum", "menuA"], ["Operations Room", "low room tone and radio texture", "menuB"], ["Quiet Hangar", "spacious mechanical ambience", "menuC"]]],
];

const grid = document.querySelector("#soundGrid");
const volume = document.querySelector("#volume");
const volumeValue = document.querySelector("#volumeValue");
const selectionCount = document.querySelector("#selectionCount");
const saved = JSON.parse(localStorage.getItem("ibc-sound-favorites") || "{}");
let audio;
let active = [];

for (const [category, description, variants] of CATEGORIES) {
  const section = document.createElement("section");
  section.className = "category";
  const slug = category.toLowerCase().replaceAll(" ", "-");
  section.innerHTML = `<h2>${category}</h2><p>${description}</p><div class="variants">${variants.map(([name, note, cue]) => `<article class="variant"><button class="play" type="button" data-cue="${cue}" aria-label="Play ${name}">▶</button><span><strong>${name}</strong><small>${note}</small></span><label class="favorite"><input type="radio" name="${slug}" value="${name}" ${saved[slug] === name ? "checked" : ""}>Favorite</label></article>`).join("")}</div>`;
  grid.append(section);
}

function context() {
  audio ||= new AudioContext();
  if (audio.state === "suspended") audio.resume();
  return audio;
}

function tone(start, duration, frequency, endFrequency = frequency, type = "sine", gain = .12) {
  const ac = context();
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ac.currentTime + start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), ac.currentTime + start + duration);
  amp.gain.setValueAtTime(.0001, ac.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(Math.max(.001, gain * Number(volume.value)), ac.currentTime + start + .015);
  amp.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + start + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(ac.currentTime + start); osc.stop(ac.currentTime + start + duration + .02);
  active.push(osc);
}

function noise(start, duration, gain = .08, highpass = 180) {
  const ac = context();
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ac.createBufferSource(); const filter = ac.createBiquadFilter(); const amp = ac.createGain();
  source.buffer = buffer; filter.type = "highpass"; filter.frequency.value = highpass; amp.gain.value = gain * Number(volume.value);
  source.connect(filter).connect(amp).connect(ac.destination); source.start(ac.currentTime + start); active.push(source);
}

function play(cue) {
  stop();
  const letter = cue.at(-1); const base = letter === "A" ? 1 : letter === "B" ? 1.18 : .84;
  if (cue.startsWith("engine")) { for (let i = 0; i < 20; i += 1) tone(i * .075, .09, 72 * base + (i % 2) * 19, 60 * base, i % 3 ? "sawtooth" : "square", .055); tone(0, 1.55, 46 * base, 52 * base, "sine", .09); }
  if (cue.startsWith("grenade")) { tone(0, .09, 1300 * base, 700, "square", .05); noise(.18, .55, .025, 700); tone(.18, .6, 340 * base, 85, "sine", .045); noise(.78, .42, .2, 80); tone(.78, .5, 75 * base, 35, "sine", .2); }
  if (cue.startsWith("gun")) { const count = letter === "A" ? 1 : 3; for (let i = 0; i < count; i += 1) { noise(i * .13, .16, .18 / base, letter === "C" ? 100 : 500); tone(i * .13, .2, 105 * base, 45, "square", .1); } }
  if (cue.startsWith("enemy")) { tone(0, 1.5, 95 * base, 310 * base, "sawtooth", .07); tone(.45, .9, 220 * base, 100 * base, "sine", .065); }
  if (cue.startsWith("crash")) { tone(0, .9, 180 * base, 38, "sawtooth", .1); noise(.35, .8, .17, 70); tone(.62, .48, 72, 30, "square", .15); }
  if (cue.startsWith("complete")) { [1, 1.25, 1.5].forEach((step, i) => tone(i * .18, .42, 220 * base * step, 220 * base * step, letter === "A" ? "square" : "sine", .095)); }
  if (cue.startsWith("menu")) { tone(0, 2.8, 52 * base, 58 * base, "sine", .055); tone(.1, 2.5, 104 * base, 98 * base, "triangle", .025); noise(0, 2.8, .018, 300); }
}

function stop() { for (const node of active) { try { node.stop(); } catch {} } active = []; }
function updateCount() { selectionCount.textContent = `${Object.keys(saved).length} of ${CATEGORIES.length} favorites selected`; }

grid.addEventListener("click", (event) => { const button = event.target.closest("[data-cue]"); if (button) play(button.dataset.cue); });
grid.addEventListener("change", (event) => { if (event.target.type !== "radio") return; saved[event.target.name] = event.target.value; localStorage.setItem("ibc-sound-favorites", JSON.stringify(saved)); updateCount(); });
volume.addEventListener("input", () => { volumeValue.value = `${Math.round(Number(volume.value) * 100)}%`; });
document.querySelector("#stopAll").addEventListener("click", stop);
document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
updateCount();
