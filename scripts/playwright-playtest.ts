import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.resolve('/home/user/arkhe/playtest-descent');

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();

  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="prologue-veil"]');
  await page.locator('[data-testid="btn-open-curtain"]').click();
  await sleep(250);

  // PART A: Deterministically verify Boss Turn-by-Turn Descent, Heart Breach & Game Over!
  console.log('1. Testing Boss Turn-by-Turn Descent & Seal Breach on STAGE 5...');
  await page.evaluate(() => {
    const e = (window as any).__KINTSUGI__.engine;
    e.stage = 5;
    e.integrity = 2; // Test 1st breach repulse (2 -> 1), then 2nd breach Game Over (1 -> 0)!
    e.vessels = [];
    e.setupStage(5);
    // Clear small escort vessels so ONLY the Boss tests pure Boss descent!
    e.vessels = [];
  });
  await sleep(300);

  const initBoss = await page.evaluate(() => {
    const e = (window as any).__KINTSUGI__.engine;
    return {
      y: e.guardian.targetY,
      turnsLeft: e.getGuardianTurnsUntilBreach(),
      integrity: e.integrity,
    };
  });
  console.log('   Initial Boss State:', initBoss);
  if (initBoss.turnsLeft !== 10) {
    throw new Error(`Expected 10 turns until breach initially, got ${initBoss.turnsLeft}`);
  }
  await page.screenshot({ path: path.join(OUT, '01-boss-turn1-10steps.png') });

  // Advance 9 volleys without killing Boss -> should reach 1 turn left!
  for (let t = 1; t <= 9; t++) {
    await page.evaluate(() => {
      const e = (window as any).__KINTSUGI__.engine;
      e.chapterBannerTimer = 0;
      e.onVolleySettled();
    });
    await sleep(100);
  }

  const urgentBoss = await page.evaluate(() => {
    const e = (window as any).__KINTSUGI__.engine;
    return {
      targetY: e.guardian.targetY,
      turnsLeft: e.getGuardianTurnsUntilBreach(),
      integrity: e.integrity,
    };
  });
  console.log('   After 9 Volleys (Urgent 1 Turn Left!):', urgentBoss);
  if (urgentBoss.turnsLeft !== 1 || urgentBoss.integrity !== 2) {
    throw new Error(`Expected turnsLeft=1 and integrity=2, got ${JSON.stringify(urgentBoss)}`);
  }
  await sleep(250);
  await page.screenshot({ path: path.join(OUT, '02-boss-urgent-1step.png') });

  // 10th volley -> Boss breaches Seal Line! Integrity drops 2 -> 1, Boss repelled back to 4 turns!
  await page.evaluate(() => {
    (window as any).__KINTSUGI__.engine.onVolleySettled();
  });
  await sleep(200);
  const afterFirstBreach = await page.evaluate(() => {
    const e = (window as any).__KINTSUGI__.engine;
    return {
      targetY: e.guardian.targetY,
      turnsLeft: e.getGuardianTurnsUntilBreach(),
      integrity: e.integrity,
      phase: e.phase,
    };
  });
  console.log('   After 10th Volley (1st Seal Breach & Repulse):', afterFirstBreach);
  if (afterFirstBreach.integrity !== 1 || afterFirstBreach.turnsLeft !== 4) {
    throw new Error(`Expected integrity=1 & repelled to 4 turns, got ${JSON.stringify(afterFirstBreach)}`);
  }

  // 4 more volleys -> Boss breaches again! Integrity drops 1 -> 0 -> SHATTERED (Game Over)!
  for (let t = 0; t < 4; t++) {
    await page.evaluate(() => {
      (window as any).__KINTSUGI__.engine.onVolleySettled();
    });
  }
  await sleep(200);
  const gameOverState = await page.evaluate(() => {
    const e = (window as any).__KINTSUGI__.engine;
    return { integrity: e.integrity, phase: e.phase };
  });
  console.log('   After Final Breach (Game Over verified!):', gameOverState);
  if (gameOverState.integrity !== 0 || gameOverState.phase !== 'SHATTERED') {
    throw new Error(`Expected Game Over SHATTERED, got ${JSON.stringify(gameOverState)}`);
  }

  // PART B: Restart fresh from STAGE 1 and organically play through STAGE 1 -> STAGE 6 defeating the descending Boss!
  console.log('2. Playing organically STAGE 1 -> STAGE 6 defeating descending Boss...');
  await page.locator('[data-testid="btn-mend-again"]').click();
  await sleep(260);

  const canvas = page.locator('[data-testid="kintsugi-canvas"]');
  let reachedStage6 = false;

  for (let step = 0; step < 90; step++) {
    if (await page.locator('[data-testid="interlude-modal"]').isVisible()) {
      await page.locator('[data-testid="talisman-0"]').click();
      await sleep(220);
    }

    const st = await page.evaluate(() => {
      const e = (window as any).__KINTSUGI__.engine;
      return {
        stage: e.stage,
        phase: e.phase,
        integrity: e.integrity,
        bossTurns: e.getGuardianTurnsUntilBreach(),
      };
    });

    if (st.stage >= 6) {
      console.log(`   ✅ Defeated descending Boss & reached STAGE ${st.stage} with Integrity=${st.integrity}!`);
      reachedStage6 = true;
      break;
    }

    if (st.phase === 'AIMING') {
      const box = (await canvas.boundingBox())!;
      const aim = await page.evaluate(() => {
        const e = (window as any).__KINTSUGI__.engine;
        if (e.stage === 1) return { nx: 0.49, ny: 0.25 };
        if (e.guardian) return { nx: e.guardian.x / 390, ny: e.guardian.y / 660 };
        if (e.orbs.length > 0) return { nx: e.orbs[0].x / 390, ny: e.orbs[0].y / 660 };
        if (e.vessels.length > 0) return { nx: e.vessels[0].x / 390, ny: e.vessels[0].y / 660 };
        return { nx: 0.45, ny: 0.28 };
      });

      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.88);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * aim.nx, box.y + box.height * aim.ny, { steps: 5 });
      await page.mouse.up();
      await sleep(260);

      if (await page.locator('[data-testid="btn-ff"]').isVisible()) {
        await page.locator('[data-testid="btn-ff"]').click();
      }
      await sleep(720);
    } else {
      await sleep(360);
    }
  }

  await browser.close();

  if (!reachedStage6 || consoleErrors.length > 0 || pageErrors.length > 0) {
    console.error('PLAYTEST FAILED:', { reachedStage6, consoleErrors, pageErrors });
    process.exit(1);
  }
  console.log('✅ ALL BOSS DESCENT & GAMEPLAY TESTS PASSED WITH ZERO ERRORS!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
