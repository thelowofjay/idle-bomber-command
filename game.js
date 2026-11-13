import {
  TUNING,
  applyPurchase,
  aircraftVisualSize,
  bombVisualState,
  calculateStats,
  calculateMedalAward,
  createPriorityEventSchedule,
  createDefaultSave,
  formatBonds,
  headingVector,
  pointInCircle,
  sanitizeSave,
  selectClosestTarget,
  selectClosestLoadedAircraft,
  selectNextTarget,
  sortiePurchaseCost,
  turnToward,
} from "./core.js";
import { createSoundDirector } from "./sound.js";

const WORLD = { width: 390, height: 560 };
const SAVE_KEY = "idle-bomber-command.prototype.v1";
const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const assets = {
  battlefield: loadImage("assets/game/battlefield-airfield-v3.webp"),
  biplane: loadImage("assets/game/canvas-biplane-topdown.webp"),
  bunker: loadImage("assets/game/hardened-bunker-topdown.webp"),
  emplacement: loadImage("assets/game/soft-emplacement-topdown.webp"),
  foxhole: loadImage("assets/game/two-man-foxhole-topdown.webp"),
  priorityTruck: loadImage("assets/game/priority-cargo-truck-topdown.webp"),
};
const BOMB_RELEASE_DISTANCE = 34;
const BOMB_FALL_DURATION = 0.95;
const TAXI_OUT_ROUTE = [
  { x: 236, y: 505 },
  { x: 236, y: 482 },
  { x: 236, y: 458 },
  { x: 236, y: 438 },
];
const TAKEOFF_ROUTE = [
  { x: 350, y: 438 },
];
const CLIMB_ROUTE = [
  { x: 350, y: 330 },
  { x: 338, y: 164 },
];
const EMPTY_RETURN_ROUTE = [
  { x: 72, y: 292 },
  { x: 38, y: 330 },
  { x: 20, y: 374 },
];
const FINAL_APPROACH_ROUTE = [
  { x: 18, y: 402 },
  { x: 23, y: 422 },
  { x: 40, y: 434 },
  { x: 68, y: 438 },
];
const LANDING_ROLL_ROUTE = [
  { x: 96, y: 438 },
  { x: 156, y: 438 },
];
const TAXI_IN_ROUTE = [
  { x: 163, y: 445 },
  { x: 160, y: 461 },
  { x: 165, y: 480 },
  { x: 184, y: 496 },
  { x: 210, y: 504 },
];
const HOLDING_ROUTE = [
  { x: 70, y: 300 },
  { x: 300, y: 300 },
  { x: 338, y: 164 },
];
const PRIORITY_ROAD_EAST = [
  { x: -38, y: 222 }, { x: 34, y: 224 }, { x: 98, y: 221 }, { x: 160, y: 226 },
  { x: 222, y: 223 }, { x: 286, y: 215 }, { x: 352, y: 216 }, { x: 428, y: 218 },
];
const TRENCH_RIFLE_POSITIONS = [
  { x: 42, y: 54 }, { x: 105, y: 91 }, { x: 170, y: 58 },
  { x: 236, y: 88 }, { x: 304, y: 58 }, { x: 356, y: 96 },
];
const AA_POSITIONS = [{ x: 112, y: 118 }, { x: 278, y: 112 }];
const OPERATIONS = [
  ["Trench Network", "Broad soft targets · favors swarm coverage"],
  ["Supply Convoy", "Moving targets · favors speed and repeated attacks"],
  ["Artillery Battery", "Dispersed guns · first serious anti-air resistance"],
  ["Forward Operating Base", "Mixed vehicles, stores, and command targets"],
  ["Rail Yard & Supply Depot", "Large mixed target · tougher structures and flak"],
  ["Military Airfield", "Runways, hangars, radar, and fighter resistance"],
  ["Naval Base & Island Fortress", "Armored targets, bunkers, and long range"],
  ["Hardened Industrial Complex", "Large defended factory network"],
  ["Integrated Air-Defense Network", "Radar, defenses, and target-order decisions"],
  ["Deep Mountain Missile Complex", "Distant, concealed, and heavily hardened"],
  ["Strategic Command Fortress", "Final layered strategic target"],
];

const ui = Object.fromEntries([
  "operationLabel", "bankedMedals", "bankedTrophies", "pendingBonds", "statusLabel", "forceReadout",
  "statusSwatch", "primaryAction", "pauseAction", "activeControls", "debriefDialog",
  "debriefEarned", "debriefSummary", "debriefSorties", "debriefTargets", "debriefLost",
  "debriefRecovered", "debriefSurvival", "closeDebrief", "closeDebriefIcon", "priorityButton", "statePlate",
  "stateCode", "stateTitle", "stateMessage", "announcer", "soundToggle", "effectsToggle", "speedToggle", "speedIndicator",
  "resetSave", "upgradeList", "baseView", "battleView", "deployAction", "baseAircraftReadout",
  "baseSummary", "baseOperationNumber", "baseForceStats", "operationName", "operationLock",
  "recordOperations", "recordMedals", "recordAircraft",
  "previousOperation", "nextOperation", "operationSelector", "aircraftOwnedReadout", "requisitionsTab", "armoryTab",
  "requisitionsPanel", "armoryPanel", "maintenanceTab", "flightOperationsTab", "maintenancePanel",
  "flightOperationsPanel", "departmentDialog", "departmentDialogTitle", "departmentDialogSummary",
  "closeDepartment", "sortieUpgradeList", "sortieUpgradesAction", "sortieDialog", "closeSortieUpgrades", "settingsAction", "settingsDialog", "closeSettings",
  "settingsGeneralTab", "settingsSoundTab", "settingsGeneralPanel", "settingsSoundPanel", "favoriteSoundCount",
].map((id) => [id, document.querySelector(`#${id}`)]));

let save = loadSave();
let state = "base";
let operation = null;
let selectedOperationIndex = 0;
let operationGestureStart = null;
let lastFrame = performance.now();
const sound = createSoundDirector();
sound.setEnabled(save.settings.sound);

function createOperation() {
  const stats = calculateStats(save);
  const prioritySchedule = createPriorityEventSchedule();
  return {
    elapsed: 0,
    pendingBonds: 0,
    baseMedals: 0,
    destroyedTargets: 0,
    sortieUpgrades: { payload: 0, armor: 0, turnaround: 0 },
    sorties: 0,
    hits: 0,
    priorityHits: 0,
    targetWaves: 0,
    waveRespawn: 0,
    retreating: false,
    endReason: "completed",
    prioritySchedule,
    fighterClock: 15 + Math.random() * 6,
    fighter: null,
    threatEvents: { rifle: 0, aa: 0, fighter: 0 },
    aircraft: Array.from({ length: save.aircraft }, (_, index) => {
      const row = Math.floor(index / 4);
      const column = index % 4;
      const parkingX = 246 + column * 30;
      const parkingY = 508 + row * 17;
      return {
      id: index + 1,
      x: parkingX,
      y: parkingY,
      parkingX,
      parkingY,
      phase: "ground",
      routeIndex: 0,
      altitude: 0,
      heading: 0,
      renderX: parkingX,
      renderY: parkingY,
      renderHeading: 0,
      integrity: stats.maxIntegrity,
      cooldown: index * 2.05,
      threatClock: 0.8 + index * 0.32,
      visualBank: 0,
      hasBomb: true,
      assignedTargetId: null,
      priorityAssigned: false,
      callSign: `KITE-${String(index + 1).padStart(2, "0")}`,
    }; }),
    targets: createTargets(),
    priority: null,
    prioritySpawned: false,
    bombs: [],
    effects: [],
    stats,
  };
}

function createTargets() {
  return [
    { id: "bunker-left", type: "bunker", x: 125, y: 70, hp: 64, maxHp: 64, incomingDamage: 0, attackOrder: 8 },
    { id: "bunker-right", type: "bunker", x: 265, y: 70, hp: 64, maxHp: 64, incomingDamage: 0, attackOrder: 7 },
    { id: "gun-left", type: "emplacement", x: 78, y: 125, hp: 16, maxHp: 16, incomingDamage: 0, attackOrder: 6 },
    { id: "gun-center", type: "emplacement", x: 195, y: 130, hp: 16, maxHp: 16, incomingDamage: 0, attackOrder: 5 },
    { id: "gun-right", type: "emplacement", x: 312, y: 125, hp: 16, maxHp: 16, incomingDamage: 0, attackOrder: 4 },
    { id: "fox-left", type: "foxhole", x: 54, y: 177, hp: 8, maxHp: 8, incomingDamage: 0, attackOrder: 3 },
    { id: "fox-mid-left", type: "foxhole", x: 147, y: 183, hp: 8, maxHp: 8, incomingDamage: 0, attackOrder: 2 },
    { id: "fox-mid-right", type: "foxhole", x: 243, y: 183, hp: 8, maxHp: 8, incomingDamage: 0, attackOrder: 1 },
    { id: "fox-right", type: "foxhole", x: 336, y: 177, hp: 8, maxHp: 8, incomingDamage: 0, attackOrder: 0 },
  ];
}

function setState(next, reason = "") {
  if (state === next) return;
  state = next;
  if (next === "playing") {
    ui.baseView.hidden = true;
    ui.battleView.hidden = false;
    ui.statePlate.setAttribute("aria-hidden", "true");
    ui.pauseAction.disabled = false;
  } else if (next === "paused") {
    showPlate("OPERATION HELD", "Paused", reason || "The force is holding until you return.");
    ui.pauseAction.disabled = false;
  } else if (next === "base") {
    ui.baseView.hidden = false;
    ui.battleView.hidden = true;
    ui.statePlate.setAttribute("aria-hidden", "true");
    ui.pauseAction.disabled = true;
  }
  sound.sync(state, operation, save.settings.doubleSpeed ? 2 : 1);
  updateUI();
}

function deploy() {
  if (selectedOperationIndex !== 0) {
    announce(`${OPERATIONS[selectedOperationIndex][0]} is locked in this prototype.`);
    return;
  }
  operation = createOperation();
  if (ui.departmentDialog.open) ui.departmentDialog.close();
  if (ui.debriefDialog.open) ui.debriefDialog.close();
  setState("playing");
  requestAnimationFrame(resizeCanvas);
  announce(`Operation ${save.operations + 1} deployed with ${save.aircraft} biplane${save.aircraft === 1 ? "" : "s"}.`);
  sound.play("deploy");
}

function pause(reason = "Operation paused.") {
  if (state !== "playing") return;
  setState("paused", reason);
  announce(reason);
  if (reason === "Operation paused.") sound.play("pause");
}

function resume() {
  if (state !== "paused") return;
  setState("playing");
  announce("Operation resumed.");
  sound.play("resume");
}

function finishOperation(retreated = false) {
  if (state === "debrief") return;
  if (ui.sortieDialog.open) ui.sortieDialog.close();
  operation.endReason = retreated ? "retreated" : "completed";
  const recovered = operation.aircraft.filter((plane) => plane.phase === "ground").length;
  const medalAward = calculateMedalAward(operation.baseMedals, recovered, operation.aircraft.length);
  operation.medalAward = medalAward;
  save.medals += medalAward.total;
  save.operations += 1;
  operation.effects = [];
  operation.priority = null;
  persist();
  state = "debrief";
  sound.sync(state, operation, save.settings.doubleSpeed ? 2 : 1);
  ui.statePlate.setAttribute("aria-hidden", "true");
  ui.priorityButton.hidden = true;
  ui.debriefEarned.textContent = `+${formatBonds(medalAward.total)}`;
  const outcome = retreated ? "Emergency retreat completed" : "Operation completed";
  ui.debriefSummary.textContent = `${outcome}: ${operation.sorties} attack run${operation.sorties === 1 ? "" : "s"}, ${operation.destroyedTargets} target${operation.destroyedTargets === 1 ? "" : "s"} destroyed${operation.priorityHits ? `, ${operation.priorityHits} priority strike${operation.priorityHits === 1 ? "" : "s"}` : ""}. Temporary war bonds and sortie upgrades have expired.`;
  ui.debriefSorties.textContent = String(operation.sorties);
  ui.debriefTargets.textContent = String(operation.destroyedTargets);
  ui.debriefLost.textContent = String(operation.aircraft.filter((plane) => plane.phase === "knocked").length);
  ui.debriefRecovered.textContent = String(recovered);
  ui.debriefSurvival.textContent = `+${formatBonds(medalAward.survivalBonus)} (${Math.round(medalAward.survivalRate * 100)}%)`;
  ui.debriefDialog.showModal();
  announce(`Operation complete. ${medalAward.total} medals secured, including ${medalAward.survivalBonus} from aircraft survival.`);
  sound.play("debrief");
  updateUI();
}

function emergencyRetreat() {
  if (!operation || !["playing", "paused"].includes(state) || operation.retreating) return;
  operation.retreating = true;
  operation.priority = null;
  ui.priorityButton.hidden = true;
  if (state === "paused") setState("playing");
  for (const plane of operation.aircraft) {
    if (["ground", "crashing", "knocked"].includes(plane.phase)) continue;
    plane.hasBomb = false;
    plane.priorityAssigned = false;
    beginReturn(plane);
  }
  announce("Emergency retreat ordered. Surviving aircraft are recovering to protect the medal survival bonus.");
  sound.play("retreat");
  updateUI();
}

function returnToBase() {
  if (ui.debriefDialog.open) ui.debriefDialog.close();
  operation = null;
  setState("base");
  announce("Returned to Forward Airfield. Maintenance and engineering are available.");
}

function update(dt) {
  if (state !== "playing" || !operation) return;
  operation.elapsed += dt;
  updateTargets(dt);
  updatePriority(dt);
  updateFighter(dt);

  for (const plane of operation.aircraft) {
    if (plane.phase === "knocked") continue;
    if (plane.phase === "crashing") {
      updateCrashingPlane(plane, dt);
      updateAircraftVisual(plane, dt);
      continue;
    }
    if (plane.phase === "ground") {
      plane.cooldown -= dt;
      if (!operation.retreating && plane.cooldown <= 0 && operation.waveRespawn <= 0) {
        plane.phase = "taxiOut";
        plane.routeIndex = 0;
        plane.hasBomb = true;
        plane.assignedTargetId = null;
      }
      updateAircraftVisual(plane, dt);
      continue;
    }

    updateAircraftRoute(plane, dt);

    if (plane.y < 280) updateGroundThreats(plane, dt);
    updateAircraftVisual(plane, dt);

  }

  updateBombs(dt);

  operation.effects = operation.effects.filter((effect) => (effect.life -= dt) > 0);
  if (operation.retreating && operation.bombs.length === 0 && operation.aircraft.every((plane) => ["ground", "knocked"].includes(plane.phase))) finishOperation(true);
  else if (operation.bombs.length === 0 && operation.aircraft.every((plane) => plane.phase === "knocked")) finishOperation();
}

function beginAircraftCrash(plane) {
  const forward = headingVector(plane.heading);
  const lateral = { x: -forward.y, y: forward.x };
  const spinDirection = plane.id % 2 ? 1 : -1;
  plane.phase = "crashing";
  plane.crashElapsed = 0;
  plane.crashDuration = sound.getCrashDuration();
  plane.crashSpin = spinDirection * (2.4 + (plane.id % 3) * .35);
  plane.crashStartX = plane.x;
  plane.crashStartY = plane.y;
  plane.crashImpactX = Math.max(24, Math.min(WORLD.width - 24, plane.x + forward.x * 62 + lateral.x * spinDirection * 24));
  plane.crashImpactY = Math.max(40, Math.min(WORLD.height - 34, plane.y + forward.y * 62 + lateral.y * spinDirection * 24));
  plane.crashStartAltitude = Math.max(.7, plane.altitude || 1);
  plane.crashSmokeClock = 0;
  plane.hasBomb = false;
  plane.priorityAssigned = false;
  plane.assignedTargetId = null;
  if (operation.priority?.assigneeId === plane.id) operation.priority.assigneeId = null;
  sound.play("aircraft-sputter");
  announce(`${plane.callSign} engine hit. The aircraft is going down.`);
}

function updateCrashingPlane(plane, dt) {
  plane.crashElapsed += dt;
  plane.crashSmokeClock -= dt;
  const progress = Math.min(1, plane.crashElapsed / plane.crashDuration);
  const eased = 1 - (1 - progress) ** 2;
  plane.x = plane.crashStartX + (plane.crashImpactX - plane.crashStartX) * eased;
  plane.y = plane.crashStartY + (plane.crashImpactY - plane.crashStartY) * eased;
  plane.altitude = Math.max(0, plane.crashStartAltitude * (1 - progress));
  plane.heading += plane.crashSpin * dt * (.42 + progress * .9);
  plane.visualBank = Math.sin(progress * Math.PI * 3) * (1 - progress * .45);
  if (plane.crashSmokeClock <= 0 && progress < .93) {
    addEffect(plane.x, plane.y, "crash-smoke");
    plane.crashSmokeClock = save.settings.reducedEffects ? .26 : .11;
  }
  if (progress < 1) return;
  plane.phase = "knocked";
  plane.altitude = 0;
  plane.visualBank = 0;
  addEffect(plane.x, plane.y, "crash-explosion");
  sound.play("aircraft-impact");
  announce(`${plane.callSign} crashed. The crew will be recovered after the operation.`);
}

function updateTargets(dt) {
  if (operation.waveRespawn <= 0) return;
  operation.waveRespawn -= dt;
  if (operation.waveRespawn <= 0) {
    operation.targets.forEach((target) => { target.hp = target.maxHp; target.incomingDamage = 0; });
    operation.waveRespawn = 0;
    operation.targetWaves += 1;
    for (const plane of operation.aircraft) {
      if (!plane.hasBomb || !["holding", "attackApproach"].includes(plane.phase)) continue;
      const target = selectClosestTarget(operation.targets, plane);
      if (!target) continue;
      plane.assignedTargetId = target.id;
      changePhase(plane, "attackApproach");
    }
    announce("The full nine-target position has rebuilt. Loaded aircraft are beginning another pass.");
  }
}

function updateAircraftRoute(plane, dt) {
  if (plane.phase === "taxiOut") {
    plane.altitude = 0;
    if (followRoute(plane, TAXI_OUT_ROUTE, dt)) changePhase(plane, "takeoffRoll");
    return;
  }
  if (plane.phase === "takeoffRoll") {
    plane.altitude = Math.min(.18, plane.altitude + dt * .11);
    if (followRoute(plane, TAKEOFF_ROUTE, dt)) changePhase(plane, "climb");
    return;
  }
  if (plane.phase === "climb") {
    plane.altitude = Math.min(1, plane.altitude + dt * .16);
    if (followRoute(plane, CLIMB_ROUTE, dt)) beginAttackOrHold(plane);
    return;
  }
  if (plane.phase === "attackApproach") {
    const target = operation.targets.find((candidate) => candidate.id === plane.assignedTargetId && candidate.hp - (candidate.incomingDamage || 0) > 0) || selectNextTarget(operation.targets);
    if (!target) { beginHolding(plane); return; }
    plane.assignedTargetId = target.id;
    if (Math.hypot(target.x - plane.x, target.y - plane.y) <= BOMB_RELEASE_DISTANCE) releaseBomb(plane, target);
    else moveToward(plane, target, dt);
    return;
  }
  if (plane.phase === "targetOverfly" || plane.phase === "priorityOverfly") {
    if (followRoute(plane, plane.route, dt)) beginReturn(plane);
    return;
  }
  if (plane.phase === "priorityApproach") {
    if (!operation.priority) { beginAttackOrHold(plane); return; }
    if (operation.priority.bombPending) { beginReturn(plane); return; }
    if (Math.hypot(operation.priority.x - plane.x, operation.priority.y - plane.y) <= BOMB_RELEASE_DISTANCE) releaseBomb(plane, operation.priority);
    else moveToward(plane, operation.priority, dt);
    return;
  }
  if (plane.phase === "holding") {
    plane.altitude = 1;
    if (selectNextTarget(operation.targets)) { beginAttackOrHold(plane); return; }
    if (followRoute(plane, HOLDING_ROUTE, dt)) plane.routeIndex = 0;
    return;
  }
  if (plane.phase === "emptyReturn") {
    plane.altitude = Math.max(.42, plane.altitude - dt * .10);
    if (followRoute(plane, EMPTY_RETURN_ROUTE, dt)) changePhase(plane, "final");
    return;
  }
  if (plane.phase === "final") {
    plane.altitude = Math.max(0, plane.altitude - dt * .22);
    if (followRoute(plane, FINAL_APPROACH_ROUTE, dt)) {
      plane.altitude = 0;
      changePhase(plane, "landingRoll");
    }
    return;
  }
  if (plane.phase === "landingRoll") {
    plane.altitude = 0;
    if (followRoute(plane, LANDING_ROLL_ROUTE, dt)) changePhase(plane, "taxiIn");
    return;
  }
  if (plane.phase === "taxiIn") {
    plane.altitude = 0;
    const route = [...TAXI_IN_ROUTE, { x: plane.parkingX, y: plane.parkingY }];
    if (followRoute(plane, route, dt)) {
      plane.x = plane.parkingX;
      plane.y = plane.parkingY;
      plane.phase = "ground";
      plane.routeIndex = 0;
      plane.cooldown = operation.stats.turnaround;
      plane.hasBomb = true;
    }
  }
}

function changePhase(plane, phase) {
  plane.phase = phase;
  plane.routeIndex = 0;
  if (["ground", "taxiOut", "takeoffRoll", "landingRoll", "taxiIn"].includes(phase)) plane.visualBank = 0;
}

function beginAttackOrHold(plane) {
  if (operation.priority?.marked && operation.priority.assigneeId === plane.id) {
    changePhase(plane, "priorityApproach");
    return;
  }
  const target = selectNextTarget(operation.targets);
  if (!target) { beginHolding(plane); return; }
  plane.assignedTargetId = target.id;
  changePhase(plane, "attackApproach");
}

function beginHolding(plane) {
  plane.assignedTargetId = null;
  changePhase(plane, "holding");
}

function followRoute(plane, route, dt) {
  const waypoint = route[plane.routeIndex];
  if (!waypoint) return true;
  if (moveToward(plane, waypoint, dt)) {
    plane.x = waypoint.x;
    plane.y = waypoint.y;
    plane.routeIndex += 1;
  }
  return plane.routeIndex >= route.length;
}

function moveToward(plane, waypoint, dt) {
  const dx = waypoint.x - plane.x;
  const dy = waypoint.y - plane.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 3) return true;
  const desiredHeading = Math.atan2(dy, dx) + Math.PI / 2;
  const previousHeading = plane.heading;
  plane.heading = turnToward(previousHeading, desiredHeading, TUNING.aircraftTurnRate * dt);
  const headingChange = Math.atan2(Math.sin(plane.heading - previousHeading), Math.cos(plane.heading - previousHeading));
  const bankAllowed = !["ground", "taxiOut", "takeoffRoll", "landingRoll", "taxiIn"].includes(plane.phase);
  const targetBank = bankAllowed
    ? Math.max(-1, Math.min(1, headingChange / Math.max(TUNING.aircraftTurnRate * dt, 0.0001)))
    : 0;
  plane.visualBank = bankAllowed
    ? (plane.visualBank || 0) + (targetBank - (plane.visualBank || 0)) * Math.min(1, dt * 8)
    : 0;
  const angularError = Math.atan2(Math.sin(desiredHeading - plane.heading), Math.cos(desiredHeading - plane.heading));
  const alignment = bankAllowed ? Math.max(0.18, Math.cos(angularError)) : Math.max(0, Math.cos(angularError));
  const travel = Math.min(operation.stats.speed * dt * alignment, Math.max(0, distance - 1.5));
  const forward = headingVector(plane.heading);
  plane.x += forward.x * travel;
  plane.y += forward.y * travel;
  return Math.hypot(waypoint.x - plane.x, waypoint.y - plane.y) <= 3.2;
}

function updateAircraftVisual(plane, dt) {
  const positionBlend = 1 - Math.exp(-dt * 11);
  const headingBlend = 1 - Math.exp(-dt * 9);
  plane.renderX = Number.isFinite(plane.renderX) ? plane.renderX + (plane.x - plane.renderX) * positionBlend : plane.x;
  plane.renderY = Number.isFinite(plane.renderY) ? plane.renderY + (plane.y - plane.renderY) * positionBlend : plane.y;
  const rendered = Number.isFinite(plane.renderHeading) ? plane.renderHeading : plane.heading;
  const delta = Math.atan2(Math.sin(plane.heading - rendered), Math.cos(plane.heading - rendered));
  plane.renderHeading = rendered + delta * headingBlend;
}

function beginReturn(plane) {
  plane.assignedTargetId = null;
  plane.priorityAssigned = false;
  changePhase(plane, "emptyReturn");
}

function updatePriority(dt) {
  if (!operation.prioritySpawned && operation.elapsed >= operation.prioritySchedule.spawnAt) {
    operation.prioritySpawned = true;
    const direction = operation.prioritySchedule.direction;
    const route = direction > 0 ? PRIORITY_ROAD_EAST : [...PRIORITY_ROAD_EAST].reverse();
    operation.priority = {
      ...operation.prioritySchedule.position,
      radius: 30,
      life: operation.prioritySchedule.life,
      marked: false,
      direction,
      route,
      routeIndex: 1,
      speed: 22,
      hp: 8,
      maxHp: 8,
      incomingDamage: 0,
      bombPending: false,
    };
    ui.priorityButton.hidden = false;
    announce(`Priority cargo truck entering from the ${direction > 0 ? "west" : "east"}. Tap Mark target or press 1.`);
    sound.play("priority-alert");
  }
  if (!operation.priority) return;
  if (!operation.priority.bombPending && movePriorityVehicle(operation.priority, dt)) {
    operation.priority = null;
    ui.priorityButton.hidden = true;
    announce("Priority cargo truck escaped along the road.");
    return;
  }
  if (operation.priority.marked && !operation.priority.assigneeId) assignPriorityAircraft();
  if (!operation.priority.marked) operation.priority.life -= dt;
  if (operation.priority.life <= 0) {
    operation.priority = null;
    ui.priorityButton.hidden = true;
    announce("Priority target withdrew.");
  }
}

function movePriorityVehicle(target, dt) {
  const waypoint = target.route[target.routeIndex];
  if (!waypoint) return true;
  const dx = waypoint.x - target.x;
  const dy = waypoint.y - target.y;
  const distance = Math.hypot(dx, dy);
  const speed = target.marked ? target.speed * 0.62 : target.speed;
  const travel = Math.min(distance, speed * dt);
  if (distance > 0) {
    target.x += dx / distance * travel;
    target.y += dy / distance * travel;
  }
  if (distance <= speed * dt + 0.01) {
    target.x = waypoint.x;
    target.y = waypoint.y;
    target.routeIndex += 1;
  }
  return target.routeIndex >= target.route.length;
}

function markPriority() {
  if (!operation?.priority) return;
  operation.priority.marked = true;
  ui.priorityButton.hidden = true;
  assignPriorityAircraft();
  announce(operation.priority.assigneeId
    ? `Priority target marked. ${operation.aircraft.find((plane) => plane.id === operation.priority.assigneeId)?.callSign} is peeling off.`
    : "Priority target marked. The next loaded aircraft will divert.");
  sound.play("priority-marked");
}

function assignPriorityAircraft() {
  if (!operation?.priority?.marked) return;
  const plane = selectClosestLoadedAircraft(operation.aircraft, operation.priority);
  if (!plane) return;
  operation.priority.assigneeId = plane.id;
  plane.priorityAssigned = true;
  plane.assignedTargetId = null;
  changePhase(plane, "priorityApproach");
}

function releaseBomb(plane, target) {
  plane.hasBomb = false;
  operation.sorties += 1;
  operation.pendingBonds += TUNING.warBondsPerDrop;
  const priority = target === operation.priority;
  const damage = priority ? Math.max(8, operation.stats.payload) : operation.stats.payload;
  target.incomingDamage = (target.incomingDamage || 0) + damage;
  if (priority) {
    target.bombPending = true;
    ui.priorityButton.hidden = true;
  }
  operation.bombs.push({
    id: `${plane.id}-${operation.sorties}`,
    targetId: priority ? "priority" : target.id,
    priority,
    startX: plane.x,
    startY: plane.y,
    targetX: target.x,
    targetY: target.y,
    heading: plane.heading,
    elapsed: 0,
    duration: BOMB_FALL_DURATION,
    damage,
  });
  const forward = headingVector(plane.heading);
  plane.route = [{ x: target.x + forward.x * 42, y: target.y + forward.y * 42 }];
  changePhase(plane, priority ? "priorityOverfly" : "targetOverfly");
  announce(`${plane.callSign} grenade away. Impact in one second.`);
  sound.play("bomb-release");
}

function updateBombs(dt) {
  for (const bomb of operation.bombs) {
    bomb.elapsed += dt;
    if (bomb.elapsed < bomb.duration) continue;
    resolveBombImpact(bomb);
  }
  operation.bombs = operation.bombs.filter((bomb) => bomb.elapsed < bomb.duration);
}

function resolveBombImpact(bomb) {
  const target = bomb.priority ? operation.priority : operation.targets.find((candidate) => candidate.id === bomb.targetId);
  if (!target) return;
  target.incomingDamage = Math.max(0, (target.incomingDamage || 0) - bomb.damage);
  const wasActive = target.hp > 0;
  const dealt = Math.min(target.hp, bomb.damage);
  target.hp -= dealt;
  operation.hits += dealt > 0 ? 1 : 0;
  addEffect(bomb.targetX, bomb.targetY, bomb.priority ? "priority" : "impact");

  if (bomb.priority) {
    if (target.hp <= 0) {
      const medals = TUNING.medalRewards.priority;
      operation.baseMedals += medals;
      operation.destroyedTargets += 1;
      operation.priorityHits += 1;
      operation.priority = null;
      announce(`Priority cargo truck destroyed. ${medals} medals secured.`);
      sound.play("priority-destroyed");
    }
    return;
  }

  if (wasActive && target.hp <= 0) {
    const medals = TUNING.medalRewards[target.type] || 1;
    const targetName = target.type === "bunker" ? "Hardened bunker" : target.type === "foxhole" ? "Two-man foxhole" : "Artillery position";
    operation.baseMedals += medals;
    operation.destroyedTargets += 1;
    announce(`${targetName} destroyed. ${medals} ${medals === 1 ? "medal" : "medals"} secured.`);
  }
  if (target.hp <= 0 && operation.targets.every((candidate) => candidate.hp <= 0) && operation.waveRespawn <= 0) {
    operation.waveRespawn = TUNING.targetWaveDelay;
    announce(`All nine targets destroyed. Rebuilding in ${Math.ceil(TUNING.targetWaveDelay)} seconds.`);
  }
  sound.play(target.hp <= 0 ? "target-destroyed" : "bomb");
}

function updateGroundThreats(plane, dt) {
  plane.threatClock -= dt;
  if (plane.threatClock > 0) return;
  const rifleFire = Math.random() < 0.68;
  const positions = rifleFire ? TRENCH_RIFLE_POSITIONS : AA_POSITIONS;
  const source = positions.reduce((closest, candidate) => {
    if (!closest) return candidate;
    return Math.hypot(candidate.x - plane.x, candidate.y - plane.y) < Math.hypot(closest.x - plane.x, closest.y - plane.y)
      ? candidate : closest;
  }, null);
  const minimum = rifleFire ? TUNING.rifleDamageMin : TUNING.aaDamageMin;
  const maximum = rifleFire ? TUNING.rifleDamageMax : TUNING.aaDamageMax;
  damagePlane(plane, randomInteger(minimum, maximum), rifleFire ? "rifle" : "aa", source);
  plane.threatClock = TUNING.threatIntervalMin + Math.random() * (TUNING.threatIntervalMax - TUNING.threatIntervalMin);
}

function updateFighter(dt) {
  if (!operation || operation.retreating) return;
  if (!operation.fighter) {
    operation.fighterClock -= dt;
    if (operation.fighterClock > 0) return;
    const direction = Math.random() < 0.5 ? 1 : -1;
    operation.fighter = {
      x: direction > 0 ? -36 : WORLD.width + 36,
      y: 145 + Math.random() * 105,
      direction,
      speed: 112,
      heading: direction > 0 ? Math.PI / 2 : -Math.PI / 2,
      phase: "sweep",
      targetId: null,
      fired: false,
    };
    announce("Enemy fighter sweeping across the operation area.");
    sound.play("fighter-alert");
    return;
  }

  const fighter = operation.fighter;
  const airborne = operation.aircraft.filter((plane) => !["ground", "taxiOut", "takeoffRoll", "landingRoll", "taxiIn", "crashing", "knocked"].includes(plane.phase));
  let target = airborne.find((plane) => plane.id === fighter.targetId);
  if (!fighter.fired && !target && airborne.length) {
    target = airborne
      .map((plane) => ({ plane, distance: Math.hypot(plane.x - fighter.x, plane.y - fighter.y) }))
      .sort((left, right) => left.distance - right.distance)[0]?.plane;
    if (target) {
      fighter.targetId = target.id;
      fighter.phase = "attack";
    }
  }

  if (!fighter.fired && target) {
    const distance = Math.hypot(target.x - fighter.x, target.y - fighter.y);
    const desiredHeading = Math.atan2(target.y - fighter.y, target.x - fighter.x) + Math.PI / 2;
    const headingError = Math.abs(Math.atan2(Math.sin(desiredHeading - fighter.heading), Math.cos(desiredHeading - fighter.heading)));
    steerEntityToward(fighter, target, dt, TUNING.fighterTurnRate);
    if (distance < 46 && headingError < .42) {
      fighter.fired = true;
      fighter.phase = "egress";
      damagePlane(target, randomInteger(TUNING.fighterDamageMin, TUNING.fighterDamageMax), "fighter", fighter);
      announce(`${target.callSign} took fire from an enemy fighter.`);
    }
  } else {
    const egress = { x: fighter.direction > 0 ? WORLD.width + 58 : -58, y: Math.max(70, Math.min(320, fighter.y - 34)) };
    steerEntityToward(fighter, egress, dt, TUNING.fighterTurnRate);
  }
  if ((fighter.fired || !airborne.length) && (fighter.x < -48 || fighter.x > WORLD.width + 48 || fighter.y < -48 || fighter.y > WORLD.height + 48)) {
    operation.fighter = null;
    operation.fighterClock = TUNING.fighterIntervalMin + Math.random() * (TUNING.fighterIntervalMax - TUNING.fighterIntervalMin);
  }
}

function steerEntityToward(entity, waypoint, dt, turnRate) {
  const desiredHeading = Math.atan2(waypoint.y - entity.y, waypoint.x - entity.x) + Math.PI / 2;
  entity.heading = turnToward(entity.heading, desiredHeading, turnRate * dt);
  const forward = headingVector(entity.heading);
  entity.x += forward.x * entity.speed * dt;
  entity.y += forward.y * entity.speed * dt;
}

function damagePlane(plane, amount, type, source) {
  if (["crashing", "knocked"].includes(plane.phase)) return;
  if (operation.threatEvents[type] !== undefined) operation.threatEvents[type] += 1;
  plane.integrity = Math.max(0, plane.integrity - amount);
  addEffect(plane.x, plane.y, type, source ? { fromX: source.x, fromY: source.y } : {});
  sound.play(type);
  if (plane.integrity <= 0) {
    beginAircraftCrash(plane);
  }
}

function randomInteger(minimum, maximum) {
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}

function addEffect(x, y, type, extra = {}) {
  const duration = type === "crash-explosion" ? 1.4
    : type === "crash-smoke" ? .9
      : type === "lost" ? 1.3
    : type === "rifle" ? 0.26
      : type === "aa" ? 0.32
        : type === "fighter" ? 0.36
          : 0.65;
  operation.effects.push({ x, y, type, ...extra, life: duration, maxLife: duration });
}

function render() {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  drawGround();
  drawTargets();
  if (operation) {
    drawFighter();
    for (const plane of operation.aircraft) drawAircraft(plane);
    drawBombs();
    drawEffects();
    drawPriority();
  } else {
    drawAircraft({ x: 195, y: 510, phase: "ground", integrity: calculateStats(save).maxIntegrity, id: 1, bank: 1 });
  }
  drawCanvasHUD();
}

function drawGround() {
  if (assets.battlefield.complete && assets.battlefield.naturalWidth) {
    ctx.drawImage(assets.battlefield, 0, 0, WORLD.width, WORLD.height);
    return;
  }
  ctx.fillStyle = "#6d7447";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = "#765b3d";
  ctx.fillRect(0, 0, WORLD.width, 115);
  ctx.fillStyle = "#b69a66";
  ctx.fillRect(0, 470, WORLD.width, 90);
}

function drawTargets() {
  const targets = operation?.targets || createTargets();
  targets.forEach((target) => {
    const active = target.hp > 0;
    ctx.save();
    ctx.globalAlpha = active ? 1 : .24;
    const image = target.type === "bunker" ? assets.bunker : target.type === "foxhole" ? assets.foxhole : assets.emplacement;
    const width = target.type === "bunker" ? 54 : target.type === "foxhole" ? 34 : 43;
    const height = target.type === "foxhole" ? 23 : width;
    if (image.complete && image.naturalWidth) {
      if (target.type === "emplacement" || target.type === "foxhole") {
        ctx.translate(target.x, target.y);
        ctx.rotate(Math.PI);
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
      } else {
        ctx.drawImage(image, target.x - width / 2, target.y - height / 2, width, height);
      }
    } else {
      ctx.fillStyle = target.type === "bunker" ? "#554838" : "#6b583d";
      ctx.beginPath(); ctx.ellipse(target.x, target.y, width * .34, height * .34, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    if (operation) {
      const barWidth = target.type === "bunker" ? 46 : target.type === "foxhole" ? 28 : 36;
      const y = target.y + (target.type === "bunker" ? 30 : target.type === "foxhole" ? 15 : 24);
      ctx.fillStyle = "rgba(23,34,31,.62)";
      ctx.fillRect(target.x - barWidth / 2, y, barWidth, 4);
      if (active) {
        ctx.fillStyle = target.type === "bunker" ? "#d38e32" : target.type === "foxhole" ? "#efe5c8" : "#c94432";
        ctx.fillRect(target.x - barWidth / 2, y, barWidth * (target.hp / target.maxHp), 4);
      } else {
        ctx.strokeStyle = "rgba(23,34,31,.62)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(target.x - 10, target.y - 10); ctx.lineTo(target.x + 10, target.y + 10);
        ctx.moveTo(target.x + 10, target.y - 10); ctx.lineTo(target.x - 10, target.y + 10);
        ctx.stroke();
      }
    }
  });

  if (operation?.waveRespawn > 0) {
    ctx.fillStyle = "rgba(23,34,31,.84)";
    ctx.fillRect(133, 145, 124, 22);
    ctx.fillStyle = "#efe5c8";
    ctx.font = "700 10px 'Barlow Condensed', Arial";
    ctx.textAlign = "center";
    ctx.fillText(`POSITION REBUILDING · ${Math.ceil(operation.waveRespawn)}`, 195, 160);
    ctx.textAlign = "start";
  }
}

function drawAircraft(plane) {
  if (plane.phase === "knocked") return;
  const size = aircraftVisualSize(plane.altitude ?? (plane.phase === "ground" ? 0 : 1));
  const half = size / 2;
  const x = Number.isFinite(plane.renderX) ? plane.renderX : plane.x;
  const y = Number.isFinite(plane.renderY) ? plane.renderY : plane.y;
  const angle = Number.isFinite(plane.renderHeading) ? plane.renderHeading : (plane.heading || 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const bank = plane.visualBank || 0;
  const bankAmount = save.settings.reducedEffects ? bank * 0.45 : bank;
  ctx.transform(1 - Math.abs(bankAmount) * 0.18, bankAmount * 0.08, bankAmount * 0.09, 1, bankAmount * 1.5, 0);
  if (assets.biplane.complete && assets.biplane.naturalWidth) {
    if (plane.phase === "crashing") ctx.filter = `brightness(${Math.max(.46, 1 - (plane.crashElapsed || 0) * .2)}) sepia(.28)`;
    ctx.drawImage(assets.biplane, -half, -half, size, size);
    ctx.filter = "none";
  } else {
    ctx.scale(size / 42, size / 42);
    ctx.fillStyle = "#d8c69b";
    ctx.fillRect(-31, -4, 62, 8);
    ctx.fillRect(-25, 7, 50, 7);
    ctx.fillStyle = "#4b3426";
    ctx.fillRect(-4, -18, 8, 44);
  }
  if (plane.phase === "crashing") {
    const flame = .55 + Math.sin((plane.crashElapsed || 0) * 24) * .18;
    ctx.fillStyle = `rgba(207,77,31,${flame})`;
    ctx.beginPath(); ctx.arc(0, 0, Math.max(2.5, size * .11), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,190,72,.8)";
    ctx.beginPath(); ctx.arc(0, 0, Math.max(1.4, size * .055), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  if (operation && plane.phase !== "ground" && plane.altitude > .65) {
    const max = operation.stats.maxIntegrity;
    ctx.fillStyle = "rgba(23,34,31,.35)";
    ctx.fillRect(x - 10, y + half + 2, 20, 2);
    ctx.fillStyle = plane.integrity / max < .35 ? "#a7372b" : "#efe5c8";
    ctx.fillRect(x - 10, y + half + 2, 20 * (plane.integrity / max), 2);
    drawFlightTag(plane);
  }
}

function drawFighter() {
  const fighter = operation?.fighter;
  if (!fighter) return;
  ctx.save();
  ctx.translate(fighter.x, fighter.y);
  ctx.rotate(fighter.heading);
  const size = 34;
  if (assets.biplane.complete && assets.biplane.naturalWidth) {
    ctx.filter = "grayscale(1) brightness(.36) contrast(1.35)";
    ctx.drawImage(assets.biplane, -size / 2, -size / 2, size, size);
    ctx.filter = "none";
    ctx.fillStyle = "#a7372b";
    ctx.fillRect(-3, 8, 6, 5);
  } else {
    ctx.fillStyle = "#17221f";
    ctx.fillRect(-16, -5, 32, 7);
    ctx.fillRect(-13, 5, 26, 6);
    ctx.fillRect(-3, -16, 6, 34);
    ctx.fillStyle = "#a7372b";
    ctx.fillRect(-3, 8, 6, 5);
  }
  ctx.restore();
}

function drawFlightTag(plane) {
  const width = 43;
  const height = 14;
  const offset = 11 + (plane.id % 3) * 2;
  const planeX = Number.isFinite(plane.renderX) ? plane.renderX : plane.x;
  const planeY = Number.isFinite(plane.renderY) ? plane.renderY : plane.y;
  const x = planeX > 300 ? planeX - width - offset : planeX + offset;
  const y = Math.max(42, Math.min(planeY - 8 + (plane.id % 2) * 10, 528));
  ctx.save();
  ctx.strokeStyle = "rgba(23,34,31,.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(planeX + (x < planeX ? -6 : 6), planeY);
  ctx.lineTo(x < planeX ? x + width : x, y + height / 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(239,229,200,.94)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#a7372b";
  ctx.fillRect(x, y, 3, height);
  ctx.fillStyle = "#17221f";
  ctx.font = "700 8px 'Barlow Condensed', Arial";
  ctx.fillText((plane.callSign || "KITE-01").replace("KITE-", "K-"), x + 7, y + 10);
  ctx.restore();
}

function drawPriority() {
  const target = operation?.priority;
  if (!target) return;
  ctx.save();
  ctx.strokeStyle = target.marked ? "#fff4b5" : "#a7372b";
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.ellipse(target.x, target.y, target.radius, 18, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  const width = 64;
  const height = 26;
  if (assets.priorityTruck.complete && assets.priorityTruck.naturalWidth) {
    ctx.translate(target.x, target.y);
    ctx.scale(target.direction < 0 ? -1 : 1, 1);
    ctx.drawImage(assets.priorityTruck, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillStyle = "#4e5e3c";
    ctx.fillRect(target.x - width / 2, target.y - height / 2, width, height);
  }
  ctx.restore();
}

function drawBombs() {
  if (!operation?.bombs.length) return;
  for (const bomb of operation.bombs) {
    const visual = bombVisualState(bomb);
    ctx.save();
    ctx.globalAlpha = 0.18 + visual.progress * 0.18;
    ctx.fillStyle = "#17221f";
    ctx.beginPath();
    ctx.ellipse(bomb.targetX, bomb.targetY, 7 * visual.shadowScale, 3.5 * visual.shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.translate(visual.x, visual.y);
    ctx.rotate((bomb.heading || 0) + visual.progress * Math.PI * 2.5);
    ctx.scale(visual.scale, visual.scale);
    ctx.fillStyle = "#596143";
    ctx.beginPath(); ctx.roundRect(-4.5, -6, 9, 12, 3); ctx.fill();
    ctx.strokeStyle = "#252e25";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = "#2b342b";
    ctx.fillRect(-2.2, -9, 4.4, 3.8);
    ctx.strokeStyle = "#202820";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(4.2, -8, 2.6, 0, Math.PI * 1.75); ctx.stroke();
    ctx.fillStyle = "#808264";
    ctx.fillRect(-3.4, -7.6, 6.8, 1.4);
    ctx.restore();
  }
}

function drawEffects() {
  if (!operation) return;
  for (const effect of operation.effects) {
    if (save.settings.reducedEffects && effect.type !== "crash-explosion") continue;
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.max(0, 1 - progress);
    if (effect.type === "crash-smoke") {
      ctx.globalAlpha = alpha * .42;
      ctx.fillStyle = "#1d2521";
      ctx.beginPath(); ctx.arc(effect.x, effect.y, 3 + progress * 8, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    if (effect.type === "crash-explosion") {
      ctx.globalAlpha = alpha;
      const radius = 10 + progress * 30;
      const blast = ctx.createRadialGradient(effect.x, effect.y, 1, effect.x, effect.y, radius);
      blast.addColorStop(0, progress < .42 ? "#fff9cf" : "#cf6b32");
      blast.addColorStop(.34, progress < .55 ? "#ffbd48" : "#6b4130");
      blast.addColorStop(.72, "rgba(182,61,31,.72)");
      blast.addColorStop(1, "rgba(35,31,27,0)");
      ctx.fillStyle = blast;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.fill();
      if (progress < .62) {
        ctx.strokeStyle = `rgba(255,205,91,${(1 - progress / .62) * .9})`;
        ctx.lineWidth = 2;
        for (let spark = 0; spark < 9; spark += 1) {
          const angle = spark * Math.PI * 2 / 9 + .31;
          const inner = 5 + progress * 13;
          const outer = 15 + progress * 38 + (spark % 3) * 4;
          ctx.beginPath();
          ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
          ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = `rgba(30,30,25,${alpha * .68})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, 13 + progress * 39, 0, Math.PI * 2); ctx.stroke();
      continue;
    }
    if (["rifle", "aa", "fighter"].includes(effect.type) && Number.isFinite(effect.fromX)) {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = effect.type === "fighter" ? "#fff4b5" : effect.type === "aa" ? "#17221f" : "#cc8a24";
      ctx.lineWidth = effect.type === "fighter" ? 1.5 : effect.type === "aa" ? 1.25 : 1;
      ctx.beginPath();
      ctx.moveTo(effect.fromX, effect.fromY);
      ctx.lineTo(effect.x, effect.y);
      ctx.stroke();
      ctx.fillStyle = effect.type === "fighter" ? "#fff4b5" : effect.type === "aa" ? "#17221f" : "#cc8a24";
      ctx.beginPath(); ctx.arc(effect.fromX, effect.fromY, effect.type === "fighter" ? 1.8 : 1.3, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    const radius = effect.type === "lost" ? 12 + progress * 30 : 5 + progress * 17;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = effect.type === "aa" ? "#26342d" : effect.type === "priority" ? "#fff4b5" : "#a7372b";
    ctx.lineWidth = effect.type === "lost" ? 5 : 3;
    ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawCanvasHUD() {
  const label = state === "playing" ? "SORTIE ACTIVE" : state === "paused" ? "OPERATION HELD" : state === "debrief" ? "FORCE RECOVERED" : "FIELD READY";
  ctx.fillStyle = "rgba(23,34,31,.76)";
  ctx.fillRect(12, 12, 112, 23);
  ctx.fillStyle = "#efe5c8";
  ctx.font = "700 10px 'Barlow Condensed', Arial";
  ctx.fillText(label, 22, 27);
  if (operation) {
    const seconds = Math.floor(operation.elapsed);
    ctx.fillStyle = "rgba(23,34,31,.76)";
    ctx.fillRect(319, 12, 59, 23);
    ctx.fillStyle = "#efe5c8";
    ctx.font = "700 11px 'Barlow Condensed', Arial";
    ctx.fillText(`${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`, 331, 27);
  }
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(canvas.width / WORLD.width, 0, 0, canvas.height / WORLD.height, 0, 0);
  render();
}

function pointerToWorld(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * WORLD.width,
    y: ((event.clientY - rect.top) / rect.height) * WORLD.height,
  };
}

function handleCanvasPointer(event) {
  if (state !== "playing" || !operation?.priority) return;
  if (pointInCircle(pointerToWorld(event), operation.priority)) markPriority();
}

function updateUI() {
  const stats = calculateStats(save);
  ui.operationLabel.textContent = `Operation ${String(save.operations + 1).padStart(2, "0")} · Trench Network`;
  ui.bankedMedals.textContent = formatBonds(save.medals);
  ui.bankedTrophies.textContent = formatBonds(save.trophies);
  ui.pendingBonds.textContent = formatBonds(operation?.pendingBonds || 0);
  ui.baseAircraftReadout.textContent = `${save.aircraft} × ${save.aircraft === 1 ? "KITE-01" : "KITE FLIGHT"}`;
  ui.aircraftOwnedReadout.textContent = `${save.aircraft} in service`;
  ui.baseForceStats.textContent = `Payload ${stats.payload} · Integrity ${stats.maxIntegrity}`;
  ui.recordOperations.textContent = String(save.operations);
  ui.recordMedals.textContent = formatBonds(save.medals);
  ui.recordAircraft.textContent = String(save.aircraft);
  updateOperationSelector();
  ui.soundToggle.checked = save.settings.sound;
  ui.effectsToggle.checked = save.settings.reducedEffects;
  ui.speedToggle.checked = save.settings.doubleSpeed;
  ui.speedIndicator.hidden = !save.settings.doubleSpeed || !["playing", "paused"].includes(state);
  if (ui.settingsDialog.open) updateSoundMixUI();

  const active = operation?.aircraft.filter((plane) => !["crashing", "knocked"].includes(plane.phase)) || [];
  const totalIntegrity = Math.round(active.reduce((sum, plane) => sum + plane.integrity, 0));
  const totalMax = operation ? operation.stats.maxIntegrity * save.aircraft : stats.maxIntegrity * save.aircraft;
  const ratio = totalMax ? totalIntegrity / totalMax : 0;
  ui.statusLabel.textContent = state === "base" ? "Force ready" : state === "debrief" ? "Force recovered" : operation?.retreating ? "Emergency recovery" : active.length ? "Force airborne" : "Force combat ineffective";
  ui.forceReadout.textContent = state === "base" || state === "debrief"
    ? `${save.aircraft} biplane${save.aircraft === 1 ? "" : "s"} · ${stats.maxIntegrity} integrity each`
    : `${active.length}/${save.aircraft} flying · ${totalIntegrity} integrity`;
  ui.statusSwatch.className = `status-swatch${ratio <= 0 ? " lost" : ratio < .45 ? " damaged" : ""}`;

  ui.primaryAction.textContent = operation?.retreating ? "Retreat in progress" : "Emergency retreat";
  ui.primaryAction.disabled = !operation || !["playing", "paused"].includes(state) || operation.retreating;
  ui.pauseAction.disabled = state !== "playing" && state !== "paused";
  ui.pauseAction.querySelector("span").textContent = state === "paused" ? "Resume" : "Pause";
  ui.pauseAction.setAttribute("aria-label", state === "paused" ? "Resume operation" : "Pause operation");
  updatePurchases();
  updateSortiePurchases();
}

function selectSettingsPanel(name) {
  const soundPanel = name === "sound";
  ui.settingsGeneralTab.classList.toggle("is-active", !soundPanel);
  ui.settingsSoundTab.classList.toggle("is-active", soundPanel);
  ui.settingsGeneralTab.setAttribute("aria-selected", String(!soundPanel));
  ui.settingsSoundTab.setAttribute("aria-selected", String(soundPanel));
  ui.settingsGeneralPanel.hidden = soundPanel;
  ui.settingsSoundPanel.hidden = !soundPanel;
  if (soundPanel) {
    sound.refreshPreferences();
    updateSoundMixUI();
  }
}

function updateSoundMixUI() {
  const audio = sound.getState();
  ui.favoriteSoundCount.textContent = `${audio.favorites} of 7 workshop favorites active`;
  for (const input of document.querySelectorAll("[data-sound-mix]")) {
    const value = audio.mix[input.dataset.soundMix];
    if (document.activeElement !== input) input.value = String(value);
    input.nextElementSibling.value = `${Math.round(Number(input.value) * 100)}%`;
  }
}

function updatePurchases() {
  for (const button of ui.upgradeList.querySelectorAll("[data-purchase]")) {
    const kind = button.dataset.purchase;
    let cost;
    try { cost = kind === "aircraft" ? Math.round(TUNING.aircraftBaseCost * TUNING.aircraftCostGrowth ** (save.aircraft - 1)) : Math.round(TUNING.upgradeBaseCosts[kind] * TUNING.upgradeCostGrowth[kind] ** save.upgrades[kind]); }
    catch { continue; }
    button.querySelector(`[data-cost="${kind}"]`).textContent = `${cost} medals`;
    button.disabled = state !== "base" || save.medals < cost;
  }
  const stats = calculateStats(save);
  document.querySelector('[data-effect="payload"]').textContent = `All biplanes · payload ${stats.payload} → ${stats.payload + TUNING.payloadPerLevel}`;
  document.querySelector('[data-effect="armor"]').textContent = `All biplanes · integrity ${stats.maxIntegrity} → ${stats.maxIntegrity + TUNING.armorPerLevel}`;
  document.querySelector('[data-effect="speed"]').textContent = `All biplanes · speed ${stats.speed} → ${stats.speed + TUNING.speedPerLevel}`;
  const nextTurn = Math.max(TUNING.minimumTurnaround, stats.turnaround - TUNING.turnaroundPerLevel);
  document.querySelector('[data-effect="turnaround"]').textContent = `All biplanes · turnaround ${stats.turnaround.toFixed(1)}s → ${nextTurn.toFixed(1)}s`;
}

function updateSortiePurchases() {
  const upgrades = operation?.sortieUpgrades || { payload: 0, armor: 0, turnaround: 0 };
  const currentStats = operation?.stats || calculateStats(save, upgrades);
  for (const button of ui.sortieUpgradeList.querySelectorAll("[data-sortie-purchase]")) {
    const kind = button.dataset.sortiePurchase;
    const cost = sortiePurchaseCost(upgrades, kind);
    button.querySelector(`[data-sortie-cost="${kind}"]`).textContent = `${cost} bonds`;
    button.disabled = !operation || !["playing", "paused"].includes(state) || operation.retreating || operation.pendingBonds < cost;
  }
  document.querySelector('[data-sortie-effect="payload"]').textContent = `Payload ${currentStats.payload} → ${currentStats.payload + TUNING.sortiePayloadPerLevel}`;
  document.querySelector('[data-sortie-effect="armor"]').textContent = `Integrity ${currentStats.maxIntegrity} → ${currentStats.maxIntegrity + TUNING.sortieArmorPerLevel}`;
  const nextTurnaround = Math.max(TUNING.minimumTurnaround, currentStats.turnaround - TUNING.sortieTurnaroundPerLevel);
  document.querySelector('[data-sortie-effect="turnaround"]').textContent = `Turnaround ${currentStats.turnaround.toFixed(1)}s → ${nextTurnaround.toFixed(1)}s`;
}

function buy(kind) {
  const result = applyPurchase(save, kind);
  if (!result.purchased) return;
  save = result.save;
  persist();
  sound.play("purchase");
  announce(`${kind === "aircraft" ? "Biplane added" : `${kind} upgraded`}. ${result.cost} medals spent.`);
  updateUI();
}

function buySortieUpgrade(kind) {
  if (!operation || !["playing", "paused"].includes(state) || operation.retreating) return;
  const cost = sortiePurchaseCost(operation.sortieUpgrades, kind);
  if (operation.pendingBonds < cost) return;
  const previousStats = operation.stats;
  operation.pendingBonds -= cost;
  operation.sortieUpgrades[kind] += 1;
  operation.stats = calculateStats(save, operation.sortieUpgrades);
  if (kind === "armor") {
    const integrityGain = operation.stats.maxIntegrity - previousStats.maxIntegrity;
    for (const plane of operation.aircraft) {
      if (!["crashing", "knocked"].includes(plane.phase)) plane.integrity = Math.min(operation.stats.maxIntegrity, plane.integrity + integrityGain);
    }
  }
  sound.play("purchase");
  announce(`${kind} sortie requisition issued. ${cost} war bonds spent; it expires after this operation.`);
  updateUI();
}

function showPlate(code, title, message) {
  ui.stateCode.textContent = code;
  ui.stateTitle.textContent = title;
  ui.stateMessage.textContent = message;
  ui.statePlate.setAttribute("aria-hidden", "false");
}

function announce(message) { ui.announcer.textContent = message; }

function persist() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
function loadSave() {
  try { return sanitizeSave(JSON.parse(localStorage.getItem(SAVE_KEY))); }
  catch { return createDefaultSave(); }
}

function resetPrototype() {
  if (!window.confirm("Reset medals, boss trophies, aircraft, upgrades, and operation history? This cannot be undone.")) return;
  save = createDefaultSave();
  operation = null;
  persist();
  if (ui.debriefDialog.open) ui.debriefDialog.close();
  state = "playing";
  setState("base");
  announce("Prototype progress reset.");
}

function updateOperationSelector() {
  const [name, summary] = OPERATIONS[selectedOperationIndex];
  const available = selectedOperationIndex === 0;
  ui.operationName.textContent = name;
  ui.baseSummary.textContent = summary;
  ui.baseOperationNumber.textContent = String(selectedOperationIndex + 1).padStart(2, "0");
  ui.operationLock.textContent = available ? "Available" : "Locked for testing";
  ui.operationLock.classList.toggle("is-locked", !available);
  ui.previousOperation.disabled = selectedOperationIndex === 0;
  ui.nextOperation.disabled = selectedOperationIndex === OPERATIONS.length - 1;
  ui.deployAction.disabled = state !== "base" || !available;
  ui.deployAction.textContent = available ? "Deploy squadron" : "Operation locked in prototype";
  ui.operationLabel.textContent = `Operation ${String(selectedOperationIndex + 1).padStart(2, "0")} · ${name}`;
}

function selectOperation(index) {
  selectedOperationIndex = Math.max(0, Math.min(OPERATIONS.length - 1, index));
  updateOperationSelector();
  const [name] = OPERATIONS[selectedOperationIndex];
  announce(selectedOperationIndex === 0 ? `${name} selected and available.` : `${name}, locked in this prototype.`);
}

function selectBaseTab(name) {
  for (const button of document.querySelectorAll("[data-base-tab]")) {
    const active = button.dataset.baseTab === name;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  }
  for (const panel of document.querySelectorAll("[data-base-panel]")) panel.hidden = panel.dataset.basePanel !== name;
  announce(name === "campaign" ? "Campaign field orders shown." : name === "theaters" ? "Theater operations shown. Both fronts are reserved for a later build." : "Command record shown.");
}

function openDepartment(name) {
  const departments = {
    requisitions: ["Requisitions", "Commission aircraft with permanent medals."],
    armory: ["Armory", "Select an aircraft and improve its permanent armament."],
    maintenance: ["Maintenance", "Select an aircraft and improve its structure or engine."],
    flightOperations: ["Flight Operations", "Train crews and improve airfield-wide procedures."],
  };
  const panels = [
    [ui.requisitionsTab, ui.requisitionsPanel, "requisitions"],
    [ui.armoryTab, ui.armoryPanel, "armory"],
    [ui.maintenanceTab, ui.maintenancePanel, "maintenance"],
    [ui.flightOperationsTab, ui.flightOperationsPanel, "flightOperations"],
  ];
  for (const [tab, panel, panelName] of panels) {
    const active = panelName === name;
    panel.hidden = !active;
    tab.classList.toggle("is-active", active);
  }
  ui.departmentDialogTitle.textContent = departments[name][0];
  ui.departmentDialogSummary.textContent = departments[name][1];
  if (!ui.departmentDialog.open) ui.departmentDialog.showModal();
}

function closeDepartment() {
  if (ui.departmentDialog.open) ui.departmentDialog.close();
  for (const button of [ui.requisitionsTab, ui.armoryTab, ui.maintenanceTab, ui.flightOperationsTab]) button.classList.remove("is-active");
}

function loadImage(source) {
  const image = new Image();
  image.decoding = "async";
  image.src = source;
  image.addEventListener("load", render);
  return image;
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  update(dt * (save.settings.doubleSpeed ? 2 : 1));
  sound.sync(state, operation, save.settings.doubleSpeed ? 2 : 1);
  render();
  updateUI();
  requestAnimationFrame(frame);
}

ui.deployAction.addEventListener("click", deploy);
for (const button of document.querySelectorAll("[data-base-tab]")) button.addEventListener("click", () => selectBaseTab(button.dataset.baseTab));
ui.primaryAction.addEventListener("click", emergencyRetreat);
ui.pauseAction.addEventListener("click", () => state === "paused" ? resume() : pause());
ui.priorityButton.addEventListener("click", markPriority);
ui.closeDebrief.addEventListener("click", returnToBase);
ui.closeDebriefIcon.addEventListener("click", returnToBase);
ui.debriefDialog.addEventListener("cancel", (event) => { event.preventDefault(); returnToBase(); });
ui.requisitionsTab.addEventListener("click", () => openDepartment("requisitions"));
ui.armoryTab.addEventListener("click", () => openDepartment("armory"));
ui.maintenanceTab.addEventListener("click", () => openDepartment("maintenance"));
ui.flightOperationsTab.addEventListener("click", () => openDepartment("flightOperations"));
ui.closeDepartment.addEventListener("click", closeDepartment);
ui.departmentDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDepartment(); });
ui.departmentDialog.addEventListener("close", () => {
  for (const button of [ui.requisitionsTab, ui.armoryTab, ui.maintenanceTab, ui.flightOperationsTab]) button.classList.remove("is-active");
});
ui.settingsAction.addEventListener("click", () => {
  sound.refreshPreferences();
  updateSoundMixUI();
  if (!ui.settingsDialog.open) ui.settingsDialog.showModal();
});
ui.closeSettings.addEventListener("click", () => ui.settingsDialog.close());
ui.settingsDialog.addEventListener("cancel", (event) => { event.preventDefault(); ui.settingsDialog.close(); });
ui.settingsGeneralTab.addEventListener("click", () => selectSettingsPanel("general"));
ui.settingsSoundTab.addEventListener("click", () => selectSettingsPanel("sound"));
for (const input of document.querySelectorAll("[data-sound-mix]")) input.addEventListener("input", () => {
  sound.setMix({ [input.dataset.soundMix]: Number(input.value) });
  input.nextElementSibling.value = `${Math.round(Number(input.value) * 100)}%`;
});
ui.sortieUpgradesAction.addEventListener("click", () => { if (!ui.sortieDialog.open) ui.sortieDialog.showModal(); });
ui.closeSortieUpgrades.addEventListener("click", () => ui.sortieDialog.close());
ui.sortieDialog.addEventListener("cancel", (event) => { event.preventDefault(); ui.sortieDialog.close(); });
document.querySelectorAll("[data-theater]").forEach((button) => button.addEventListener("click", () => announce(`${button.dataset.theater} is reserved for a future 100-sector campaign.`)));
ui.previousOperation.addEventListener("click", () => selectOperation(selectedOperationIndex - 1));
ui.nextOperation.addEventListener("click", () => selectOperation(selectedOperationIndex + 1));
ui.operationSelector.addEventListener("pointerdown", (event) => { operationGestureStart = event.clientX; });
ui.operationSelector.addEventListener("pointerup", (event) => {
  if (operationGestureStart === null) return;
  const delta = event.clientX - operationGestureStart;
  operationGestureStart = null;
  if (Math.abs(delta) < 45) return;
  selectOperation(selectedOperationIndex + (delta < 0 ? 1 : -1));
});
ui.operationSelector.addEventListener("pointercancel", () => { operationGestureStart = null; });
ui.upgradeList.addEventListener("click", (event) => {
  const locked = event.target.closest("[data-locked]");
  if (locked) announce(`${locked.dataset.locked} is visible for planning but locked in this prototype.`);
});
ui.upgradeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-purchase]");
  if (button) buy(button.dataset.purchase);
});
ui.sortieUpgradeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sortie-purchase]");
  if (button) buySortieUpgrade(button.dataset.sortiePurchase);
});
ui.soundToggle.addEventListener("change", () => {
  save.settings.sound = ui.soundToggle.checked;
  persist();
  sound.setEnabled(save.settings.sound, save.settings.sound);
});
ui.effectsToggle.addEventListener("change", () => { save.settings.reducedEffects = ui.effectsToggle.checked; persist(); });
ui.speedToggle.addEventListener("change", () => { save.settings.doubleSpeed = ui.speedToggle.checked; persist(); updateUI(); });
ui.resetSave.addEventListener("click", resetPrototype);
canvas.addEventListener("pointerdown", handleCanvasPointer);
document.addEventListener("pointerdown", () => { void sound.unlock(); }, { capture: true, once: true });
window.addEventListener("resize", resizeCanvas);
new ResizeObserver(resizeCanvas).observe(canvas);
document.fonts?.ready.then(resizeCanvas);
window.addEventListener("blur", () => pause("Paused when the window lost focus."));
document.addEventListener("visibilitychange", () => { if (document.hidden) pause("Paused while the game was in the background."); });
window.addEventListener("pageshow", () => { sound.refreshPreferences(); updateSoundMixUI(); });
document.addEventListener("keydown", (event) => {
  void sound.unlock();
  if (event.code === "Space") {
    event.preventDefault();
    if (state === "playing") pause();
    else if (state === "paused") resume();
  }
  if (event.key === "1") markPriority();
  if (state === "base" && !ui.departmentDialog.open && event.key === "ArrowLeft") selectOperation(selectedOperationIndex - 1);
  if (state === "base" && !ui.departmentDialog.open && event.key === "ArrowRight") selectOperation(selectedOperationIndex + 1);
  if ((event.key === "r" || event.key === "R") && state === "base") deploy();
});

if ("serviceWorker" in navigator) window.addEventListener("load", async () => {
  let refreshing = false;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing || !hadController) return;
    refreshing = true;
    window.location.reload();
  });
  await navigator.serviceWorker.register("./sw.js");
});

window.__IBC__ = {
  getState: () => ({
    state,
    save: structuredClone(save),
    operation: operation ? {
      elapsed: operation.elapsed,
      pendingBonds: operation.pendingBonds,
      baseMedals: operation.baseMedals,
      destroyedTargets: operation.destroyedTargets,
      sortieUpgrades: structuredClone(operation.sortieUpgrades),
      medalAward: operation.medalAward ? structuredClone(operation.medalAward) : null,
      stats: structuredClone(operation.stats),
      sorties: operation.sorties,
      hits: operation.hits,
      priorityHits: operation.priorityHits,
      waveRespawn: operation.waveRespawn,
      targetWaves: operation.targetWaves,
      retreating: operation.retreating,
      endReason: operation.endReason,
      fighter: operation.fighter ? structuredClone(operation.fighter) : null,
      prioritySchedule: structuredClone(operation.prioritySchedule),
      threatEvents: structuredClone(operation.threatEvents),
      bombs: operation.bombs.map((bomb) => ({ ...structuredClone(bomb), visual: bombVisualState(bomb) })),
      effects: operation.effects.map(({ type, x, y, fromX, fromY, life }) => ({ type, x, y, fromX, fromY, life })),
      priority: operation.priority ? structuredClone(operation.priority) : null,
      targets: operation.targets.map(({ id, type, x, y, hp, maxHp, incomingDamage, attackOrder }) => ({ id, type, x, y, hp, maxHp, incomingDamage, attackOrder })),
      aircraft: operation.aircraft.map(({ id, x, y, phase, altitude, heading, visualBank, integrity, hasBomb, assignedTargetId, priorityAssigned, crashElapsed, crashDuration, crashImpactX, crashImpactY }) => ({ id, x, y, phase, altitude, heading, visualBank, integrity, hasBomb, assignedTargetId, priorityAssigned, crashElapsed, crashDuration, crashImpactX, crashImpactY, visualSize: aircraftVisualSize(altitude) })),
    } : null,
  }),
  getAudioState: () => sound.getState(),
  setAircraftForTest: (count) => {
    save.aircraft = Math.max(1, Math.floor(Number(count) || 1));
    persist();
    updateUI();
  },
  deploy,
  returnToBase,
  pause,
  resume,
  emergencyRetreat,
  markPriority,
  spawnPriorityForTest: () => {
    if (!operation) return;
    operation.prioritySpawned = true;
    operation.priority = {
      x: 282, y: 216, radius: 30, life: 30, marked: false, direction: -1, speed: 22,
      route: [{ x: 282, y: 216 }, { x: 222, y: 223 }, { x: 160, y: 226 }, { x: 98, y: 221 }, { x: 34, y: 224 }, { x: -38, y: 222 }],
      routeIndex: 1, hp: 8, maxHp: 8, incomingDamage: 0, bombPending: false,
    };
    ui.priorityButton.hidden = false;
  },
  destroyTargetsForTest: () => {
    if (!operation) return;
    operation.targets.forEach((target) => { target.hp = 0; target.incomingDamage = 0; });
    operation.bombs = [];
    operation.waveRespawn = 20;
    const plane = operation.aircraft.find((candidate) => !["crashing", "knocked"].includes(candidate.phase));
    if (plane) {
      plane.x = 338;
      plane.y = 164;
      plane.altitude = 1;
      plane.hasBomb = true;
      plane.assignedTargetId = null;
      changePhase(plane, "attackApproach");
    }
  },
  rebuildTargetsForTest: () => {
    if (!operation) return;
    operation.targets.forEach((target) => { target.hp = 0; target.incomingDamage = 0; });
    operation.bombs = [];
    operation.waveRespawn = 0.01;
    const plane = operation.aircraft.find((candidate) => !["crashing", "knocked"].includes(candidate.phase));
    if (plane) {
      plane.x = 82;
      plane.y = 220;
      plane.altitude = 1;
      plane.hasBomb = true;
      plane.assignedTargetId = "fox-right";
      changePhase(plane, "attackApproach");
    }
  },
  spawnFighterForTest: () => {
    if (!operation) return;
    const plane = operation.aircraft.find((candidate) => !["ground", "taxiOut", "takeoffRoll", "landingRoll", "taxiIn", "crashing", "knocked"].includes(candidate.phase));
    if (!plane) return;
    operation.fighter = {
      x: plane.x - 55,
      y: plane.y,
      direction: 1,
      speed: 112,
      heading: 0,
      phase: "attack",
      targetId: plane.id,
      fired: false,
    };
  },
  triggerThreatForTest: (type) => {
    if (!operation || !["rifle", "aa"].includes(type)) return;
    const plane = operation.aircraft.find((candidate) => !["ground", "taxiOut", "takeoffRoll", "landingRoll", "taxiIn", "crashing", "knocked"].includes(candidate.phase));
    if (!plane) return;
    const source = type === "rifle" ? TRENCH_RIFLE_POSITIONS[0] : AA_POSITIONS[0];
    const amount = type === "rifle" ? TUNING.rifleDamageMin : TUNING.aaDamageMin;
    damagePlane(plane, amount, type, source);
  },
  knockOutAircraftForTest: () => {
    if (!operation) return null;
    const plane = operation.aircraft.find((candidate) => !["ground", "taxiOut", "takeoffRoll", "landingRoll", "taxiIn", "crashing", "knocked"].includes(candidate.phase));
    if (!plane) return null;
    damagePlane(plane, operation.stats.maxIntegrity * 2, "fighter", operation.fighter || { x: plane.x - 40, y: plane.y });
    return plane.id;
  },
  finishForTest: () => {
    if (!operation) return;
    if (operation.pendingBonds === 0) {
      operation.pendingBonds = 24;
      operation.sorties = 2;
      operation.hits = 2;
      operation.baseMedals = 3;
      operation.destroyedTargets = 2;
    }
    finishOperation();
  },
  grantBondsForTest: (amount = 100) => {
    if (!operation) return;
    operation.pendingBonds += Math.max(0, Math.floor(Number(amount) || 0));
    updateUI();
  },
  buySortieUpgrade,
  simulateForTest: (seconds) => {
    const steps = Math.ceil(Math.max(0, seconds) * 30);
    for (let index = 0; index < steps && state === "playing"; index += 1) update(1 / 30);
    render();
    updateUI();
    return state;
  },
};

updateUI();
resizeCanvas();
requestAnimationFrame(frame);
