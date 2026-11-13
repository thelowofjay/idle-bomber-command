import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.env.TEST_URL || "http://127.0.0.1:4174";
const captureDir = process.env.CAPTURE_DIR;
const profile = await mkdtemp(join(tmpdir(), "ibc-chromium-"));
const browser = spawn("chromium", [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
  "--remote-debugging-port=9227", `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });

let socket;
let sequence = 0;
const pending = new Map();

try {
  const endpoint = await waitForEndpoint();
  socket = new WebSocket(endpoint.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url });
  await waitFor(() => evaluate("document.readyState === 'complete' && Boolean(window.__IBC__)"));

  assert.equal(await evaluate("document.querySelector('link[rel=manifest]').getAttribute('href')"), "manifest.webmanifest");
  assert.equal(await evaluate("window.__IBC__.getState().state"), "base");
  assert.equal(await evaluate("document.querySelector('#baseView').hidden"), false);
  assert.equal(await evaluate("document.querySelector('#battleView').hidden"), true);
  assert.equal(await evaluate("document.querySelectorAll('.currency-ledger').length"), 2);
  assert.equal(await evaluate("document.querySelector('#bankedMedals').textContent"), "0");
  assert.equal(await evaluate("document.querySelector('#bankedTrophies').textContent"), "0");
  assert.equal(await evaluate("document.querySelector('#settingsAction').getBoundingClientRect().width >= 44"), true);
  assert.equal(await evaluate("document.querySelector('#baseHeading').textContent"), "Main Menu");
  assert.equal(await evaluate("document.querySelector('.identity-lockup h1').textContent"), "Idle Bomber Command");
  assert.equal(await evaluate("document.querySelectorAll('.dock-action').length"), 4);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.department-dock')).gridTemplateColumns.split(' ').length"), 2);
  assert.equal(await evaluate("document.querySelectorAll('[data-theater]').length"), 2);
  assert.equal(await evaluate("[...document.querySelectorAll('[data-theater]')].every((button) => button.getAttribute('aria-disabled') === 'true')"), true);
  assert.equal(await evaluate("document.querySelectorAll('.aircraft-card').length"), 11);
  await evaluate("document.querySelector('#nextOperation').click(); true");
  assert.equal(await evaluate("document.querySelector('#operationName').textContent"), "Supply Convoy");
  assert.equal(await evaluate("document.querySelector('#deployAction').disabled"), true);
  await evaluate("document.querySelector('#previousOperation').click(); true");
  assert.equal(await evaluate("document.querySelector('#operationName').textContent"), "Trench Network");
  assert.equal(await evaluate("document.querySelector('#deployAction').disabled"), false);
  await evaluate("document.querySelector('#armoryTab').click(); true");
  assert.equal(await evaluate("document.querySelector('#departmentDialog').open"), true);
  assert.equal(await evaluate("document.querySelector('#armoryPanel').hidden"), false);
  if (captureDir) await capture("mobile-armory.png");
  await evaluate("document.querySelector('#closeDepartment').click(); document.querySelector('#requisitionsTab').click(); true");
  assert.equal(await evaluate("document.querySelector('#requisitionsPanel').hidden"), false);
  assert.equal(await evaluate("document.querySelector('#aircraftDetailSprite').currentSrc.includes('canvas-biplane-topdown.webp')"), true);
  assert.equal(await evaluate("document.querySelector('.aircraft-detail p').textContent.includes('told him to avoid too many bumps')"), true);
  assert.equal(await evaluate("Math.abs(document.querySelector('#departmentDialog').getBoundingClientRect().top + document.querySelector('#departmentDialog').getBoundingClientRect().height / 2 - innerHeight / 2) < 3"), true);
  if (captureDir) await capture("mobile-requisitions.png");
  await evaluate("document.querySelector('#closeDepartment').click(); document.querySelector('#flightOperationsTab').click(); true");
  assert.equal(await evaluate("document.querySelector('#flightOperationsPanel').hidden"), false);
  if (captureDir) await capture("mobile-flight-operations.png");
  await evaluate("document.querySelector('#closeDepartment').click(); document.querySelector('#maintenanceTab').click(); true");
  assert.equal(await evaluate("document.querySelector('#maintenancePanel').hidden"), false);
  await evaluate("document.querySelector('#closeDepartment').click(); window.scrollTo(0, 0); true");
  await evaluate("document.querySelector('#settingsAction').click(); true");
  assert.equal(await evaluate("document.querySelector('#settingsDialog').open"), true);
  assert.equal(await evaluate("document.querySelector('#resetSave').getBoundingClientRect().height >= 44"), true);
  assert.equal(await evaluate("window.__IBC__.getAudioState().available"), true);
  await evaluate("document.querySelector('#soundToggle').click(); true");
  assert.equal(await evaluate("window.__IBC__.getAudioState().enabled"), false);
  await evaluate("document.querySelector('#soundToggle').click(); true");
  assert.equal(await evaluate("window.__IBC__.getAudioState().enabled"), true);
  if (captureDir) await capture("mobile-settings.png");
  await evaluate("document.querySelector('#closeSettings').click(); true");
  if (captureDir) await capture("mobile-base.png");

  await evaluate("window.__IBC__.setAircraftForTest(7); true");
  await evaluate("document.querySelector('#deployAction').click(); true");
  assert.equal(await evaluate("window.__IBC__.getState().state"), "playing");
  assert.equal(await evaluate("document.querySelector('canvas').clientWidth"), 390);
  assert.equal(await evaluate("document.querySelector('#sortieUpgradesAction').getBoundingClientRect().height >= 44"), true);
  assert.equal(await evaluate("document.querySelector('#sortieUpgradesAction').getBoundingClientRect().bottom <= innerHeight"), true);
  if (captureDir) await capture("mobile-mission-controls.png");
  await evaluate("document.querySelector('#sortieUpgradesAction').click(); true");
  assert.equal(await evaluate("document.querySelector('#sortieDialog').open"), true);
  assert.equal(await evaluate("document.querySelectorAll('#sortieUpgradeList [data-sortie-purchase]').length"), 3);
  if (captureDir) await capture("mobile-sortie-upgrades.png");
  await evaluate("document.querySelector('#closeSortieUpgrades').click(); true");
  await evaluate("document.querySelector('#settingsAction').click(); document.querySelector('#speedToggle').click(); true");
  assert.equal(await evaluate("window.__IBC__.getState().save.settings.doubleSpeed"), true);
  assert.equal(await evaluate("document.querySelector('#speedIndicator').hidden"), false);
  await evaluate("document.querySelector('#speedToggle').click(); document.querySelector('#closeSettings').click(); true");
  await new Promise((resolve) => setTimeout(resolve, 900));
  const climbState = await evaluate("window.__IBC__.getState().operation.aircraft[0]");
  assert.equal(climbState.phase, "taxiOut");
  assert.equal(climbState.visualSize < 40, true);
  const takeoffState = await evaluate("(() => { for (let i = 0; i < 300; i += 1) { window.__IBC__.simulateForTest(0.1); const plane = window.__IBC__.getState().operation.aircraft.find((candidate) => candidate.phase === 'takeoffRoll'); if (plane) return plane; } return null; })()");
  assert.notEqual(takeoffState, null);
  assert.equal(Math.abs(takeoffState.y - 438) < 1, true);
  assert.equal(takeoffState.x >= 236, true);
  assert.equal(takeoffState.visualSize < 26, true);
  assert.equal(takeoffState.visualBank, 0);
  const departureSpacing = await evaluate("(() => { for (let i = 0; i < 300; i += 1) { window.__IBC__.simulateForTest(0.1); const planes = window.__IBC__.getState().operation.aircraft.filter((plane) => ['taxiOut','takeoffRoll','climb'].includes(plane.phase)); if (planes.length >= 3) { let minimum = Infinity; for (let a = 0; a < planes.length; a += 1) for (let b = a + 1; b < planes.length; b += 1) minimum = Math.min(minimum, Math.hypot(planes[a].x - planes[b].x, planes[a].y - planes[b].y)); return minimum; } } return null; })()");
  assert.notEqual(departureSpacing, null);
  assert.equal(departureSpacing >= 14, true);
  const bankingState = await evaluate("(() => { for (let i = 0; i < 400; i += 1) { window.__IBC__.simulateForTest(0.05); const plane = window.__IBC__.getState().operation.aircraft.find((candidate) => Math.abs(candidate.visualBank) > 0.2); if (plane) return plane; } return null; })()");
  assert.notEqual(bankingState, null);
  const noseLedMovement = await evaluate("(() => { for (let i = 0; i < 500; i += 1) { window.__IBC__.simulateForTest(0.05); const before = window.__IBC__.getState().operation.aircraft.find((plane) => ['climb','attackApproach','targetOverfly','emptyReturn','final'].includes(plane.phase)); if (!before) continue; window.__IBC__.simulateForTest(0.05); const after = window.__IBC__.getState().operation.aircraft.find((plane) => plane.id === before.id); if (!after || after.phase !== before.phase) continue; const dx = after.x - before.x; const dy = after.y - before.y; const distance = Math.hypot(dx, dy); if (distance < .1) continue; return (dx * Math.sin(after.heading) + dy * -Math.cos(after.heading)) / distance; } return null; })()");
  assert.notEqual(noseLedMovement, null);
  assert.equal(noseLedMovement > 0.98, true);
  if (captureDir) await capture("mobile-runway-takeoff.png");
  const bombReleased = await evaluate("(() => { for (let i = 0; i < 600; i += 1) { window.__IBC__.simulateForTest(0.05); const op = window.__IBC__.getState().operation; if (op.bombs.length > 0) return op; } return null; })()");
  assert.notEqual(bombReleased, null);
  assert.equal(bombReleased.targets.length, 9);
  assert.equal(bombReleased.targets.filter((target) => target.type === "foxhole").length, 4);
  const firstTarget = bombReleased.targets.find((target) => target.id === "fox-right");
  assert.equal(firstTarget.hp, 8);
  assert.equal(firstTarget.incomingDamage, 8);
  assert.equal(bombReleased.hits, 0);
  assert.equal(bombReleased.aircraft.some((plane) => !plane.hasBomb && plane.phase === "targetOverfly"), true);
  await evaluate("window.__IBC__.simulateForTest(0.4); true");
  assert.equal(await evaluate("window.__IBC__.getState().operation.targets.find((target) => target.id === 'fox-right').hp"), 8);
  assert.equal(await evaluate("window.__IBC__.getState().operation.bombs[0].visual.progress > 0 && window.__IBC__.getState().operation.bombs[0].visual.progress < 1"), true);
  if (captureDir) await capture("mobile-bomb-drop.png");
  await evaluate("window.__IBC__.simulateForTest(0.7); true");
  const firstPass = await evaluate("window.__IBC__.getState().operation");
  assert.equal(firstPass.targets.find((target) => target.id === "fox-right").hp, 0);
  assert.equal(firstPass.targets.find((target) => target.id === "gun-right").hp, 16);
  assert.equal(firstPass.targets.find((target) => target.id === "bunker-left").hp, 64);
  assert.equal(firstPass.hits > 0, true);
  const integrityBeforeThreats = firstPass.aircraft.reduce((sum, plane) => sum + plane.integrity, 0);
  await evaluate("window.__IBC__.triggerThreatForTest('rifle'); window.__IBC__.triggerThreatForTest('aa'); window.__IBC__.spawnFighterForTest(); window.__IBC__.simulateForTest(0.1); true");
  const turningFighter = await evaluate("window.__IBC__.getState().operation.fighter");
  assert.notEqual(turningFighter, null);
  assert.equal(Math.abs(turningFighter.heading) > 0.05, true);
  await evaluate("(() => { for (let i = 0; i < 180; i += 1) { window.__IBC__.simulateForTest(0.05); if (window.__IBC__.getState().operation.threatEvents.fighter > 0) return true; } return false; })()");
  const threatState = await evaluate("window.__IBC__.getState().operation");
  assert.equal(threatState.threatEvents.rifle >= 1, true);
  assert.equal(threatState.threatEvents.aa >= 1, true);
  assert.equal(threatState.threatEvents.fighter >= 1, true);
  assert.equal(threatState.aircraft.reduce((sum, plane) => sum + plane.integrity, 0) < integrityBeforeThreats, true);
  if (captureDir) await capture("mobile-threats.png");
  if (captureDir) await capture("mobile-attack.png");
  const landingState = await evaluate("(() => { for (let i = 0; i < 500; i += 1) { window.__IBC__.simulateForTest(0.1); const plane = window.__IBC__.getState().operation?.aircraft.find((candidate) => candidate.phase === 'landingRoll'); if (plane) return plane; } return null; })()");
  assert.notEqual(landingState, null);
  assert.equal(Math.abs(landingState.y - 438) < 1, true);
  assert.equal(landingState.x <= 156, true);
  assert.equal(landingState.visualSize, 18);
  assert.equal(landingState.visualBank, 0);
  assert.equal(Math.abs(Math.atan2(Math.sin(landingState.heading - Math.PI / 2), Math.cos(landingState.heading - Math.PI / 2))) < .35, true);
  const taxiInState = await evaluate("(() => { for (let i = 0; i < 200; i += 1) { window.__IBC__.simulateForTest(0.05); const plane = window.__IBC__.getState().operation?.aircraft.find((candidate) => candidate.phase === 'taxiIn'); if (plane) return plane; } return null; })()");
  assert.notEqual(taxiInState, null);
  assert.equal(taxiInState.x >= 156 && taxiInState.x <= 215, true);
  assert.equal(taxiInState.visualBank, 0);
  if (captureDir) await capture("mobile-runway-landing.png");

  await evaluate("window.__IBC__.destroyTargetsForTest(); true");
  const holdingState = await evaluate("(() => { for (let i = 0; i < 180; i += 1) { window.__IBC__.simulateForTest(0.1); const plane = window.__IBC__.getState().operation.aircraft.find((candidate) => candidate.phase === 'holding'); if (plane) return plane; } return null; })()");
  assert.notEqual(holdingState, null);
  assert.equal(holdingState.hasBomb, true);
  await evaluate("window.__IBC__.rebuildTargetsForTest(); window.__IBC__.simulateForTest(0.1); true");
  const rebuiltAssignment = await evaluate("window.__IBC__.getState().operation.aircraft.find((plane) => plane.assignedTargetId === 'fox-left')");
  assert.notEqual(rebuiltAssignment, null);
  if (captureDir) await capture("mobile-loaded-holding.png");

  await evaluate("document.querySelector('#pauseAction').click(); true");
  assert.equal(await evaluate("window.__IBC__.getState().state"), "paused");
  assert.equal(await evaluate("document.querySelector('#primaryAction').textContent"), "Emergency retreat");
  assert.equal(await evaluate("document.querySelector('#pauseAction span').textContent"), "Resume");
  if (captureDir) await capture("mobile-paused.png");
  await evaluate("document.querySelector('#pauseAction').click(); true");
  assert.equal(await evaluate("window.__IBC__.getState().state"), "playing");

  await evaluate("window.__IBC__.spawnPriorityForTest(); window.__IBC__.simulateForTest(0.5); true");
  assert.equal(await evaluate("window.__IBC__.getState().operation.priority.x < 282"), true);
  if (captureDir) await capture("mobile-priority-truck.png");
  await evaluate("window.__IBC__.markPriority(); true");
  const markedPriority = await evaluate("window.__IBC__.getState().operation.priority");
  assert.equal(markedPriority.marked, true);
  assert.equal(markedPriority.direction, -1);
  const fallingPriorityBomb = await evaluate("(() => { for (let i = 0; i < 600; i += 1) { window.__IBC__.simulateForTest(0.05); const op = window.__IBC__.getState().operation; if (op.priority?.bombPending && op.bombs.some((bomb) => bomb.priority)) return op; } return null; })()");
  assert.notEqual(fallingPriorityBomb, null);
  assert.equal(fallingPriorityBomb.priority.hp, 8);
  const priorityResult = await evaluate("(() => { for (let i = 0; i < 600; i += 1) { window.__IBC__.simulateForTest(0.1); const op = window.__IBC__.getState().operation; if (!op.priority) return op; } return null; })()");
  assert.notEqual(priorityResult, null);
  assert.equal(priorityResult.aircraft.some((plane) => !plane.hasBomb), true);

  const permanentPayloadBefore = await evaluate("window.__IBC__.getState().save.upgrades.payload");
  const sortiePayloadBefore = await evaluate("window.__IBC__.getState().operation.stats.payload");
  await evaluate("window.__IBC__.grantBondsForTest(100); window.__IBC__.buySortieUpgrade('payload'); true");
  assert.equal(await evaluate(`window.__IBC__.getState().save.upgrades.payload === ${permanentPayloadBefore}`), true);
  assert.equal(await evaluate(`window.__IBC__.getState().operation.stats.payload > ${sortiePayloadBefore}`), true);
  assert.equal(await evaluate("window.__IBC__.getState().operation.sortieUpgrades.payload"), 1);

  const medalsBeforeRetreat = await evaluate("window.__IBC__.getState().save.medals");
  await evaluate("window.__IBC__.emergencyRetreat(); window.__IBC__.simulateForTest(120); true");
  assert.equal(await evaluate("window.__IBC__.getState().state"), "debrief");
  assert.equal(await evaluate(`window.__IBC__.getState().save.medals > ${medalsBeforeRetreat}`), true);
  assert.equal(await evaluate("(() => { const award = window.__IBC__.getState().operation.medalAward; return award.total === award.base + award.survivalBonus && award.survivalBonus === Math.floor(award.base * award.survivalRate); })()"), true);
  assert.equal(await evaluate("window.__IBC__.getState().operation.endReason"), "retreated");
  assert.equal(await evaluate("document.querySelector('#debriefDialog').open"), true);
  assert.equal(await evaluate("document.querySelector('.debrief-total span').textContent"), "Medals");
  if (captureDir) await capture("mobile-debrief.png");
  await evaluate("document.querySelector('#closeDebrief').click(); true");
  assert.equal(await evaluate("window.__IBC__.getState().state"), "base");
  assert.equal(await evaluate("document.querySelector('#baseView').hidden"), false);
  const horizontalOverflow = await evaluate("(() => ({ page: [document.documentElement.clientWidth, document.documentElement.scrollWidth], offenders: [...document.querySelectorAll('body *')].filter((node) => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 8).map((node) => [node.tagName, node.id, node.className, Math.round(node.getBoundingClientRect().right)]) }))()");
  assert.equal(horizontalOverflow.page[1] <= horizontalOverflow.page[0], true, JSON.stringify(horizontalOverflow));
  await evaluate("window.confirm = () => true; document.querySelector('#resetSave').click(); true");
  const resetState = await evaluate("window.__IBC__.getState()");
  assert.equal(resetState.save.medals, 0);
  assert.equal(resetState.save.trophies, 0);
  assert.equal(resetState.save.aircraft, 1);
  assert.deepEqual(resetState.save.upgrades, { payload: 0, armor: 0, speed: 0, turnaround: 0 });
  assert.equal(resetState.save.operations, 0);
  if (captureDir) {
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise((resolve) => setTimeout(resolve, 250));
    await capture("desktop.png");
  }
  await evaluate("navigator.serviceWorker.ready.then(() => true)");
  await send("Page.reload", { ignoreCache: false });
  await waitFor(() => evaluate("document.readyState === 'complete' && Boolean(window.__IBC__) && Boolean(navigator.serviceWorker.controller)"));
  await send("Network.enable");
  await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0, connectionType: "none" });
  await send("Page.reload", { ignoreCache: false });
  await waitFor(() => evaluate("document.readyState === 'complete' && Boolean(window.__IBC__)"));
  assert.equal(await evaluate("document.title"), "Idle Bomber Command");
  await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1, connectionType: "wifi" });
  await send("Page.navigate", { url: `${url}/sound-lab/` });
  await waitFor(() => evaluate("document.readyState === 'complete' && document.title.includes('Sound Workshop')"));
  assert.equal(await evaluate("document.querySelectorAll('.category').length"), 7);
  assert.equal(await evaluate("document.querySelectorAll('[data-cue]').length"), 21);
  assert.equal(await evaluate("document.querySelectorAll('input[type=radio]').length"), 21);
  await evaluate("document.querySelector('input[type=radio]').click(); document.querySelector('[data-cue]').click(); true");
  assert.equal(await evaluate("document.querySelector('#selectionCount').textContent"), "1 of 7 favorites selected");
  await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0, connectionType: "none" });
  await send("Page.reload", { ignoreCache: false });
  await waitFor(() => evaluate("document.readyState === 'complete' && document.title.includes('Sound Workshop')"));
  assert.equal(await evaluate("document.querySelectorAll('[data-cue]').length"), 21);
  await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1, connectionType: "wifi" });
  console.log("Browser smoke passed: delayed grenade impacts, nine-target durability, road-following priority truck, sound workshop link, smoothed nose-led flight, curved runway recovery, fighter pursuit, survival bonus, responsive shell, and offline reload.");
} finally {
  socket?.close();
  if (browser.exitCode === null && browser.signalCode === null) {
    browser.kill("SIGTERM");
    await new Promise((resolve) => browser.once("exit", resolve));
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(profile, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
      break;
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

async function waitForEndpoint() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9227/json/new?about:blank", { method: "PUT" });
      if (response.ok) return response.json();
    } catch { /* browser is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Chromium DevTools endpoint did not start");
}

function send(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(check) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for browser state");
}

async function capture(name) {
  await mkdir(captureDir, { recursive: true });
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(join(captureDir, name), Buffer.from(result.data, "base64"));
}
