export const SAVE_VERSION = 5;

export const TUNING = Object.freeze({
  aircraftBaseCost: 8,
  aircraftCostGrowth: 1.55,
  upgradeBaseCosts: Object.freeze({ payload: 3, armor: 3, speed: 4, turnaround: 2 }),
  upgradeCostGrowth: Object.freeze({ payload: 1.58, armor: 1.55, speed: 1.62, turnaround: 1.6 }),
  sortieUpgradeBaseCosts: Object.freeze({ payload: 12, armor: 10, turnaround: 8 }),
  sortieUpgradeCostGrowth: Object.freeze({ payload: 1.65, armor: 1.6, turnaround: 1.55 }),
  baseIntegrity: 70,
  armorPerLevel: 14,
  basePayload: 8,
  payloadPerLevel: 3,
  baseTurnaround: 2.8,
  turnaroundPerLevel: 0.38,
  minimumTurnaround: 0.9,
  baseSpeed: 26,
  speedPerLevel: 3,
  warBondsPerDrop: 8,
  medalRewards: Object.freeze({ foxhole: 1, emplacement: 2, bunker: 3, priority: 2 }),
  sortiePayloadPerLevel: 2,
  sortieArmorPerLevel: 10,
  sortieTurnaroundPerLevel: 0.3,
  threatIntervalMin: 1.8,
  threatIntervalMax: 3.1,
  rifleDamageMin: 1,
  rifleDamageMax: 2,
  aaDamageMin: 4,
  aaDamageMax: 7,
  fighterDamageMin: 8,
  fighterDamageMax: 12,
  fighterIntervalMin: 20,
  fighterIntervalMax: 28,
  targetWaveDelay: 4.5,
  aircraftCruiseSize: 40,
  aircraftTurnRate: (Math.PI * 2) / 3,
  fighterTurnRate: Math.PI,
});

export function createDefaultSave() {
  return {
    version: SAVE_VERSION,
    medals: 0,
    trophies: 0,
    aircraft: 1,
    upgrades: { payload: 0, armor: 0, speed: 0, turnaround: 0 },
    operations: 0,
    settings: { sound: true, reducedEffects: false, doubleSpeed: false, pauseForSortieUpgrades: true },
  };
}

export function sanitizeSave(value) {
  const fallback = createDefaultSave();
  if (!value || typeof value !== "object") return fallback;
  const sourceVersion = nonNegativeInteger(value.version, 0);
  return {
    version: SAVE_VERSION,
    medals: nonNegativeInteger(value.medals ?? (sourceVersion < 4 ? value.trophies ?? value.bonds : 0), fallback.medals),
    trophies: nonNegativeInteger(sourceVersion >= 4 ? value.trophies : value.bossTrophies, fallback.trophies),
    aircraft: Math.max(1, nonNegativeInteger(value.aircraft, fallback.aircraft)),
    upgrades: {
      payload: nonNegativeInteger(value.upgrades?.payload, 0),
      armor: nonNegativeInteger(value.upgrades?.armor, 0),
      speed: nonNegativeInteger(value.upgrades?.speed, 0),
      turnaround: nonNegativeInteger(value.upgrades?.turnaround, 0),
    },
    operations: nonNegativeInteger(value.operations, 0),
    settings: {
      sound: value.settings?.sound !== false,
      reducedEffects: value.settings?.reducedEffects === true,
      doubleSpeed: value.settings?.doubleSpeed === true,
      pauseForSortieUpgrades: value.settings?.pauseForSortieUpgrades !== false,
    },
  };
}

export function calculateStats(save, sortieUpgrades = {}) {
  const sortiePayload = nonNegativeInteger(sortieUpgrades.payload, 0);
  const sortieArmor = nonNegativeInteger(sortieUpgrades.armor, 0);
  const sortieTurnaround = nonNegativeInteger(sortieUpgrades.turnaround, 0);
  return {
    maxIntegrity: TUNING.baseIntegrity + save.upgrades.armor * TUNING.armorPerLevel + sortieArmor * TUNING.sortieArmorPerLevel,
    payload: TUNING.basePayload + save.upgrades.payload * TUNING.payloadPerLevel + sortiePayload * TUNING.sortiePayloadPerLevel,
    turnaround: Math.max(
      TUNING.minimumTurnaround,
      TUNING.baseTurnaround - save.upgrades.turnaround * TUNING.turnaroundPerLevel - sortieTurnaround * TUNING.sortieTurnaroundPerLevel,
    ),
    speed: TUNING.baseSpeed + save.upgrades.speed * TUNING.speedPerLevel,
  };
}

export function purchaseCost(save, kind) {
  if (kind === "aircraft") {
    return Math.round(TUNING.aircraftBaseCost * TUNING.aircraftCostGrowth ** (save.aircraft - 1));
  }
  const level = save.upgrades[kind];
  if (!Number.isInteger(level)) throw new Error(`Unknown purchase: ${kind}`);
  return Math.round(TUNING.upgradeBaseCosts[kind] * TUNING.upgradeCostGrowth[kind] ** level);
}

export function applyPurchase(save, kind) {
  const cost = purchaseCost(save, kind);
  if (save.medals < cost) return { save, purchased: false, cost };
  const next = structuredClone(save);
  next.medals -= cost;
  if (kind === "aircraft") next.aircraft += 1;
  else next.upgrades[kind] += 1;
  return { save: next, purchased: true, cost };
}

export function sortiePurchaseCost(upgrades, kind) {
  const level = upgrades?.[kind];
  if (!Number.isInteger(level) || !(kind in TUNING.sortieUpgradeBaseCosts)) throw new Error(`Unknown sortie purchase: ${kind}`);
  return Math.round(TUNING.sortieUpgradeBaseCosts[kind] * TUNING.sortieUpgradeCostGrowth[kind] ** level);
}

export function calculateMedalAward(baseMedals, survivors, totalAircraft) {
  const base = nonNegativeInteger(baseMedals, 0);
  const total = Math.max(1, nonNegativeInteger(totalAircraft, 1));
  const recovered = Math.min(total, nonNegativeInteger(survivors, 0));
  const survivalRate = recovered / total;
  const survivalBonus = Math.floor(base * survivalRate);
  return { base, recovered, totalAircraft: total, survivalRate, survivalBonus, total: base + survivalBonus };
}

export function pointInCircle(point, circle) {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

export function selectNextTarget(targets) {
  return targets
    .filter((target) => target.hp - (target.incomingDamage || 0) > 0)
    .sort((left, right) => (left.attackOrder ?? -left.x) - (right.attackOrder ?? -right.x))[0] || null;
}

export function selectClosestTarget(targets, point) {
  return targets
    .filter((target) => target.hp - (target.incomingDamage || 0) > 0)
    .sort((left, right) => {
      const leftDistance = (left.x - point.x) ** 2 + (left.y - point.y) ** 2;
      const rightDistance = (right.x - point.x) ** 2 + (right.y - point.y) ** 2;
      return leftDistance - rightDistance || (left.attackOrder ?? 0) - (right.attackOrder ?? 0);
    })[0] || null;
}

export function createPriorityEventSchedule(timeRoll = Math.random(), positionRoll = Math.random(), lifeRoll = Math.random()) {
  const time = clamp(timeRoll, 0, 0.999999);
  const position = clamp(positionRoll, 0, 0.999999);
  const life = clamp(lifeRoll, 0, 0.999999);
  const direction = position < 0.5 ? 1 : -1;
  return {
    spawnAt: 12 + time * 15,
    direction,
    position: direction > 0 ? { x: -38, y: 222 } : { x: 428, y: 218 },
    life: 14 + life * 4,
  };
}

export function bombVisualState(bomb, elapsed = bomb.elapsed) {
  const duration = Math.max(0.001, bomb.duration || 0.9);
  const progress = clamp(elapsed / duration, 0, 1);
  const eased = progress ** 2;
  return {
    progress,
    x: bomb.startX + (bomb.targetX - bomb.startX) * eased,
    y: bomb.startY + (bomb.targetY - bomb.startY) * eased,
    scale: 1 - progress * 0.5,
    shadowScale: 0.35 + progress * 0.65,
  };
}

export function selectClosestLoadedAircraft(aircraft, point) {
  return aircraft
    .filter((plane) => plane.hasBomb && !["ground", "taxiOut", "takeoffRoll", "landingRoll", "taxiIn", "knocked"].includes(plane.phase))
    .sort((left, right) => {
      const leftDistance = (left.x - point.x) ** 2 + (left.y - point.y) ** 2;
      const rightDistance = (right.x - point.x) ** 2 + (right.y - point.y) ** 2;
      return leftDistance - rightDistance;
    })[0] || null;
}

export function aircraftVisualSize(altitude, cruiseSize = TUNING.aircraftCruiseSize) {
  const normalized = clamp(altitude, 0, 1);
  return cruiseSize * (0.45 + normalized * 0.55);
}

export function turnToward(current, target, maxDelta) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  if (Math.abs(delta) <= maxDelta) return target;
  return current + Math.sign(delta) * maxDelta;
}

export function headingVector(heading) {
  return { x: Math.sin(heading), y: -Math.cos(heading) };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatBonds(value) {
  if (value < 1_000) return String(Math.floor(value));
  if (value < 1_000_000) return `${(value / 1_000).toFixed(value < 10_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(value < 10_000_000 ? 1 : 0)}M`;
}

function nonNegativeInteger(value, fallback) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}
