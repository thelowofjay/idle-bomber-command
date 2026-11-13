import test from "node:test";
import assert from "node:assert/strict";
import {
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
  purchaseCost,
  sanitizeSave,
  selectClosestTarget,
  selectClosestLoadedAircraft,
  selectNextTarget,
  sortiePurchaseCost,
  turnToward,
} from "../core.js";

test("default force begins with one biplane and no permanent currency", () => {
  const save = createDefaultSave();
  assert.equal(save.aircraft, 1);
  assert.equal(save.medals, 0);
  assert.equal(save.trophies, 0);
  assert.equal(save.settings.doubleSpeed, false);
  assert.deepEqual(save.upgrades, { payload: 0, armor: 0, speed: 0, turnaround: 0 });
});

test("permanent purchases spend medals and change only the requested force value", () => {
  const save = createDefaultSave();
  save.medals = 100;
  const result = applyPurchase(save, "payload");
  assert.equal(result.purchased, true);
  assert.equal(result.save.medals, 100 - purchaseCost(save, "payload"));
  assert.equal(result.save.trophies, 0);
  assert.equal(result.save.upgrades.payload, 1);
  assert.equal(save.upgrades.payload, 0);
});

test("unaffordable purchases preserve the same save", () => {
  const save = createDefaultSave();
  const result = applyPurchase(save, "aircraft");
  assert.equal(result.purchased, false);
  assert.equal(result.save, save);
});

test("stats scale transparently and turnaround has a floor", () => {
  const save = createDefaultSave();
  save.upgrades = { payload: 2, armor: 3, speed: 2, turnaround: 99 };
  const stats = calculateStats(save);
  assert.equal(stats.payload, 14);
  assert.equal(stats.maxIntegrity, 112);
  assert.equal(stats.turnaround, 0.9);
  assert.equal(stats.speed, 32);
});

test("sortie upgrades stack on permanent stats without mutating the save", () => {
  const save = createDefaultSave();
  const stats = calculateStats(save, { payload: 2, armor: 1, turnaround: 3 });
  assert.equal(stats.payload, 12);
  assert.equal(stats.maxIntegrity, 80);
  assert.equal(stats.turnaround, 1.9);
  assert.deepEqual(save.upgrades, { payload: 0, armor: 0, speed: 0, turnaround: 0 });
  assert.equal(sortiePurchaseCost({ payload: 0, armor: 0, turnaround: 0 }, "payload"), 12);
});

test("save sanitization rejects malformed values and migrates legacy bonds to medals", () => {
  const save = sanitizeSave({ bonds: -20, aircraft: 0, upgrades: { payload: 2.9 }, operations: "many", settings: { sound: false } });
  assert.equal(save.medals, 0);
  assert.equal(save.trophies, 0);
  assert.equal(save.aircraft, 1);
  assert.equal(save.upgrades.payload, 2);
  assert.equal(save.operations, 0);
  assert.equal(save.settings.sound, false);
});

test("version 3 trophy balances migrate once to medals while boss trophies start empty", () => {
  const save = sanitizeSave({ version: 3, trophies: 27, aircraft: 2, upgrades: {}, settings: { doubleSpeed: true } });
  assert.equal(save.medals, 27);
  assert.equal(save.trophies, 0);
  assert.equal(save.settings.doubleSpeed, true);
});

test("surviving aircraft add an equal-percentage medal bonus", () => {
  assert.deepEqual(calculateMedalAward(10, 4, 4), {
    base: 10, recovered: 4, totalAircraft: 4, survivalRate: 1, survivalBonus: 10, total: 20,
  });
  const partial = calculateMedalAward(10, 3, 4);
  assert.equal(partial.survivalRate, 0.75);
  assert.equal(partial.survivalBonus, 7);
  assert.equal(partial.total, 17);
});

test("priority hit testing includes the edge and excludes separated points", () => {
  const circle = { x: 10, y: 10, radius: 5 };
  assert.equal(pointInCircle({ x: 15, y: 10 }, circle), true);
  assert.equal(pointInCircle({ x: 16, y: 10 }, circle), false);
});

test("bond formatting remains compact but legible", () => {
  assert.equal(formatBonds(999), "999");
  assert.equal(formatBonds(1_250), "1.3K");
  assert.equal(formatBonds(2_500_000), "2.5M");
});

test("target selection works right to left and skips destroyed targets", () => {
  const targets = [
    { x: 74, hp: 18 },
    { x: 194, hp: 0 },
    { x: 314, hp: 7 },
  ];
  assert.equal(selectNextTarget(targets), targets[2]);
  targets[2].hp = 0;
  assert.equal(selectNextTarget(targets), targets[0]);
  targets[0].hp = 0;
  assert.equal(selectNextTarget(targets), null);
});

test("explicit target order puts soft positions before hardened bunkers", () => {
  const targets = [
    { id: "bunker-left", attackOrder: 4, hp: 64 },
    { id: "soft-right", attackOrder: 0, hp: 16 },
    { id: "soft-center", attackOrder: 1, hp: 16 },
  ];
  assert.equal(selectNextTarget(targets), targets[1]);
  targets[1].hp = 0;
  assert.equal(selectNextTarget(targets), targets[2]);
});

test("reserved incoming damage keeps formations from wasting bombs on doomed targets", () => {
  const targets = [
    { id: "fox-right", attackOrder: 0, hp: 8, incomingDamage: 8 },
    { id: "gun-right", attackOrder: 1, hp: 16, incomingDamage: 8 },
    { id: "gun-center", attackOrder: 2, hp: 16, incomingDamage: 0 },
  ];
  assert.equal(selectNextTarget(targets), targets[1]);
  targets[1].incomingDamage = 16;
  assert.equal(selectNextTarget(targets), targets[2]);
});

test("rebuilt positions send an en-route aircraft to its nearest live target", () => {
  const targets = [
    { id: "left", x: 70, y: 80, hp: 16, attackOrder: 2 },
    { id: "center", x: 195, y: 130, hp: 16, attackOrder: 1 },
    { id: "right", x: 315, y: 130, hp: 16, attackOrder: 0 },
  ];
  assert.equal(selectClosestTarget(targets, { x: 90, y: 210 }).id, "left");
  targets[0].hp = 0;
  assert.equal(selectClosestTarget(targets, { x: 90, y: 210 }).id, "center");
});

test("priority interception selects the closest loaded airborne aircraft", () => {
  const aircraft = [
    { id: 1, x: 20, y: 20, phase: "attackRun", hasBomb: true },
    { id: 2, x: 90, y: 90, phase: "holding", hasBomb: true },
    { id: 3, x: 95, y: 95, phase: "attackRun", hasBomb: false },
    { id: 4, x: 99, y: 99, phase: "ground", hasBomb: true },
  ];
  assert.equal(selectClosestLoadedAircraft(aircraft, { x: 100, y: 100 }).id, 2);
  aircraft[1].hasBomb = false;
  assert.equal(selectClosestLoadedAircraft(aircraft, { x: 100, y: 100 }).id, 1);
});

test("aircraft scale communicates climb and descent without exceeding cruise size", () => {
  assert.equal(aircraftVisualSize(0), 18);
  assert.equal(aircraftVisualSize(1), 40);
  assert.equal(aircraftVisualSize(-2), 18);
  assert.equal(aircraftVisualSize(3), 40);
});

test("aircraft headings turn continuously at 120 degrees per second", () => {
  const quarterSecond = turnToward(0, Math.PI / 2, Math.PI / 6);
  assert.equal(quarterSecond, Math.PI / 6);
  assert.equal(turnToward(quarterSecond, Math.PI / 2, Math.PI / 6), Math.PI / 3);
  const acrossNorth = turnToward(170 * Math.PI / 180, -170 * Math.PI / 180, 10 * Math.PI / 180);
  assert.equal(Math.round(acrossNorth * 180 / Math.PI), 180);
});

test("heading vectors move only through the aircraft nose", () => {
  assert.deepEqual(headingVector(0), { x: 0, y: -1 });
  const east = headingVector(Math.PI / 2);
  assert.equal(Math.abs(east.x - 1) < 1e-12, true);
  assert.equal(Math.abs(east.y) < 1e-12, true);
});

test("priority targets vary within bounded times, positions, and lifetimes", () => {
  const earliest = createPriorityEventSchedule(0, 0, 0);
  const latest = createPriorityEventSchedule(0.999, 0.999, 0.999);
  assert.equal(earliest.spawnAt, 12);
  assert.equal(earliest.direction, 1);
  assert.deepEqual(earliest.position, { x: -38, y: 222 });
  assert.equal(earliest.life, 14);
  assert.equal(latest.spawnAt > 26.9 && latest.spawnAt < 27, true);
  assert.equal(latest.direction, -1);
  assert.deepEqual(latest.position, { x: 428, y: 218 });
  assert.equal(latest.life > 17.9 && latest.life < 18, true);
});

test("grenade drops remain airborne before reaching the target at one second", () => {
  const bomb = { startX: 250, startY: 220, targetX: 200, targetY: 160, duration: 1 };
  assert.deepEqual(bombVisualState(bomb, 0), { progress: 0, x: 250, y: 220, scale: 1, shadowScale: 0.35 });
  const halfway = bombVisualState(bomb, 0.5);
  assert.equal(halfway.progress, 0.5);
  assert.equal(halfway.x, 237.5);
  assert.equal(halfway.y, 205);
  assert.equal(halfway.scale, 0.75);
  assert.equal(bombVisualState(bomb, 1).progress, 1);
});
