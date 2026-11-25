/** Smoke QA for the clear Povod pages, using an already installed Playwright. */
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((arg, index, all) =>
  arg.startsWith('--') ? [arg.slice(2), all[index + 1]?.startsWith('--') ? true : all[index + 1] ?? true] : null,
).filter(Boolean));
if (args.help) {
  console.log('node check_povod_clear.mjs [--url http://127.0.0.1:5174/] [--output TEMP_DIRECTORY] [--playwright-module PATH] [--browser msedge|chrome|chromium]');
  process.exit(0);
}
const require = createRequire(import.meta.url);
const { chromium } = require(args['playwright-module'] || process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = new URL(args.url || 'http://127.0.0.1:5174/');
base.hash = '';
const output = args.output ? path.resolve(args.output) : await mkdtemp(path.join(tmpdir(), 'povod-clear-'));
await mkdir(output, { recursive: true });
const report = { url: base.href, started: new Date().toISOString(), checks: [], browserErrors: [], brokenResources: [], abortedRequests: [], screenshots: [], facts: [], anchors: [] };
let browser;
const deadline = setTimeout(async () => {
  report.checks.push({ name: 'Overall time limit', passed: false, detail: 'Stopped after 240 seconds' });
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser?.close().catch(() => {});
  process.exit(1);
}, 240_000);

function assert(value, message) {
  if (!value) throw new Error(message);
}
async function check(name, run) {
  try {
    const detail = await run();
    report.checks.push({ name, passed: true, ...(detail === undefined ? {} : { detail }) });
  } catch (error) {
    report.checks.push({ name, passed: false, detail: error.message });
  }
}
const routes = ['home', 'wedding', 'birthday', 'anniversary', 'jubilee'];
const occasionIds = ['unknown', 'wedding', 'birthday', 'anniversary', 'jubilee', 'custom'];
const planIds = ['unknown', 'mini', 'story', 'prem'];
const primarySizes = [[1440, 900], [375, 812]];
const extraSizes = [[320, 812], [768, 1024], [1024, 768], [390, 844]];

async function ready(page, route) {
  await page.waitForFunction(key => window.__povod?.ready === true && window.__povod.route === key, route);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
}
async function open(page, route) {
  const url = new URL(base);
  url.hash = route;
  await page.goto(url.href, { waitUntil: 'networkidle' });
  await ready(page, routes.includes(route) ? route : 'home');
}
async function targetInView(page, id) {
  await page.waitForFunction(key => {
    const target = document.getElementById(key);
    if (!target) return false;
    const r = target.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  }, id);
  await page.evaluate(() => new Promise(resolve => {
    let previous = scrollY, stable = 0;
    const started = performance.now();
    function sample() {
      stable = Math.abs(scrollY - previous) < .5 ? stable + 1 : 0;
      previous = scrollY;
      if (stable >= 4 || performance.now() - started > 3000) resolve();
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  const rect = await page.locator(`#${id}`).evaluate(el => {
    const r = el.getBoundingClientRect();
    const headerBottom = document.querySelector('.navigation')?.getBoundingClientRect().bottom || 0;
    return { top: r.top, bottom: r.bottom, viewport: innerHeight, width: innerWidth, headerBottom,
      route: document.body.dataset.route, scrollY, scrollMax: Math.max(0, document.documentElement.scrollHeight - innerHeight) };
  });
  assert(rect.top < rect.viewport && rect.bottom > 0, `${id} is outside the viewport: ${JSON.stringify(rect)}`);
  const belowHeader = rect.top >= rect.headerBottom - 1;
  const aligned = belowHeader && rect.top <= rect.headerBottom + 96;
  const clamped = Math.abs(rect.scrollY - rect.scrollMax) <= 2 && belowHeader && rect.bottom <= rect.viewport + 1;
  assert(aligned || clamped,
    `${id} is not aligned below the header: ${JSON.stringify(rect)}`);
  report.anchors.push({ id, ...rect, clamped: !aligned && clamped });
}
async function scrollAction(page, id) {
  const visible = page.locator(`[data-scroll="${id}"]:visible`).first();
  if (!await visible.count() && await page.locator('#menu-toggle').isVisible()) await page.locator('#menu-toggle').click();
  await visible.click();
}
async function visibleImages(page) {
  const inspect = () => [...document.images].filter(img => {
    if (img.closest('details:not([open])')) return false;
    const r = img.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0
      && r.top < innerHeight && r.left < innerWidth && getComputedStyle(img).visibility !== 'hidden';
  });
  await page.waitForFunction(`(${inspect.toString()})().every(img => img.complete && img.naturalWidth > 0)`)
    .catch(error => { if (error.name !== 'TimeoutError') throw error; });
  const facts = await page.evaluate(`(${inspect.toString()})().map(img => ({
    src: img.currentSrc || img.src, complete: img.complete, naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight, width: img.getAttribute('width'), height: img.getAttribute('height'),
    srcset: img.getAttribute('srcset') || ''
  }))`);
  assert(facts.every(img => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0),
    `Visible images are not loaded: ${JSON.stringify(facts)}`);
  return facts;
}
async function shot(page, name, fullPage = false) {
  if (fullPage) {
    await page.evaluate(() => {
      document.activeElement?.blur();
      scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
  }
  await visibleImages(page);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage, animations: 'disabled' });
  report.screenshots.push(`${name}.png`);
}
async function basics(page, label) {
  await check(`${label}: content visible and no overflow`, async () => {
    const facts = await page.evaluate(() => {
      const hidden = [...document.querySelectorAll('#main h1,#main h2,#main .lead,#prices .plan,#request-form')].filter(el => {
        if (el.closest('details:not([open])')) return false;
        let current = el;
        while (current && current.id !== 'main') {
          const style = getComputedStyle(current);
          if (style.display === 'none' || style.visibility === 'hidden' || +style.opacity < .1) return true;
          current = current.parentElement;
        }
        return !el.getBoundingClientRect().width || !el.getBoundingClientRect().height;
      }).map(el => `${el.tagName}: ${el.textContent.trim().slice(0, 70)}`);
      return { width: innerWidth, scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth), pins: document.querySelectorAll('.pin-spacer').length, hidden };
    });
    assert(facts.scrollWidth <= facts.width + 1, `Horizontal overflow: ${JSON.stringify(facts)}`);
    assert(!facts.pins, `Pinned sections remain: ${facts.pins}`);
    assert(!facts.hidden.length, `Hidden main content: ${JSON.stringify(facts.hidden)}`);
    return facts;
  });
  await check(`${label}: stable visible H1`, async () => {
    const h1 = page.locator('#main h1');
    assert(await h1.count() === 1, 'Expected one H1');
    const text = (await h1.innerText()).trim();
    assert(text.length > 5 && await h1.isVisible(), 'H1 is empty or invisible');
    await page.waitForTimeout(450);
    assert((await h1.innerText()).trim() === text, 'H1 changes automatically');
    return text;
  });
}

async function routeCase(context, route, size, detailed = false, reduced = false) {
  const label = `${route}-${size.join('x')}${reduced ? '-reduced' : ''}`;
  const page = await context.newPage();
  await page.setViewportSize({ width: size[0], height: size[1] });
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(20_000);
  const actions = [];
  page.on('console', msg => { if (msg.type() === 'error') report.browserErrors.push({ label, type: 'console', message: msg.text(), location: msg.location() }); });
  page.on('pageerror', error => report.browserErrors.push({ label, type: 'pageerror', message: error.message }));
  page.on('request', request => {
    if (['fetch', 'xhr'].includes(request.resourceType()) || !['GET', 'HEAD'].includes(request.method())) actions.push({ method: request.method(), url: request.url() });
  });
  page.on('requestfailed', request => {
    if (new URL(request.url()).origin !== base.origin) return;
    const item = { label, url: request.url(), error: request.failure()?.errorText };
    (item.error?.includes('ERR_ABORTED') ? report.abortedRequests : report.brokenResources).push(item);
  });
  page.on('response', response => {
    if (new URL(response.url()).origin === base.origin && response.status() >= 400) report.brokenResources.push({ label, url: response.url(), status: response.status() });
  });
  try {
    await open(page, route);
    await basics(page, label);
    await check(`${label}: visible photos load with responsive sources and dimensions`, async () => {
      const facts = await visibleImages(page);
      const photos = facts.filter(img => /\.(?:jpe?g|png|webp|avif)(?:$|[?#])/i.test(img.src));
      assert(photos.length > 0, 'No visible gift photograph on the first screen');
      assert(photos.every(img => Number(img.width) > 0 && Number(img.height) > 0),
        `Photo intrinsic dimensions missing: ${JSON.stringify(photos)}`);
      assert(photos.every(img => img.srcset.split(',').filter(Boolean).length >= 2),
        `Responsive photo sources missing: ${JSON.stringify(photos)}`);
      return facts;
    });
    if (detailed) await shot(page, `${label}-hero`);
    await check(`${label}: section actions preserve route`, async () => {
      const hash = new URL(page.url()).hash;
      for (const id of ['prices', 'request']) {
        await scrollAction(page, id);
        await page.waitForTimeout(450);
        await targetInView(page, id);
        assert(new URL(page.url()).hash === hash && await page.locator('body').getAttribute('data-route') === route, `${id} changed the route`);
        if (detailed) await shot(page, `${label}-${id === 'request' ? 'form' : id}`);
      }
    });
    await check(`${label}: form option IDs and honest labels`, async () => {
      const facts = await page.locator('#request-form').evaluate(form => ({
        occasions: [...form.elements.occasion.options].map(o => o.value),
        plans: [...form.elements.plan.options].map(o => ({ value: o.value, disabled: o.disabled })),
        selectedOccasion: form.elements.occasion.value,
        labels: [...form.querySelectorAll('input,select,textarea')].every(el => el.labels?.length || el.getAttribute('aria-label')),
        note: document.querySelector('#request-note')?.textContent.trim(),
        fiction: /вымышлен|вымышлены/i.test(document.body.innerText),
      }));
      assert(JSON.stringify([...facts.occasions].sort()) === JSON.stringify([...occasionIds].sort()), `Unexpected occasion IDs: ${JSON.stringify(facts.occasions)}`);
      assert(facts.plans.every(p => planIds.includes(p.value)), `Unexpected plan IDs: ${JSON.stringify(facts.plans)}`);
      assert(['unknown', 'story', 'prem'].every(id => facts.plans.some(p => p.value === id)), 'Required plan options missing');
      assert(route === 'wedding' ? !facts.plans.some(p => p.value === 'mini') : facts.plans.some(p => p.value === 'mini' && !p.disabled), 'Mini eligibility is incorrect');
      assert(facts.selectedOccasion === (route === 'home' ? 'unknown' : route), `Initial occasion is ${facts.selectedOccasion}`);
      assert(facts.labels, 'A form control has no accessible label');
      assert(/макет|демо/i.test(facts.note || '') && /не отправ|не перед/i.test(facts.note || ''), 'Permanent demo warning missing');
      assert(facts.fiction, 'Fictional examples are not disclosed');
      report.facts.push({ label, viewport: { width: size[0], height: size[1] }, reducedMotion: reduced, ...facts });
    });
    await check(`${label}: shown gift package matches the highlighted price`, async () => {
      const expectedPlan = route === 'birthday' ? 'prem' : 'story';
      const expectedName = expectedPlan === 'prem' ? /премиум/i : /история/i;
      const heroNote = await page.locator('.hero .visual-note').innerText();
      const includes = await page.locator('#example .example-includes').innerText();
      assert(expectedName.test(heroNote), `Hero does not name the shown package: ${heroNote}`);
      assert(expectedName.test(includes), `Example does not name the shown package: ${includes}`);
      if (route === 'wedding') {
        assert(/свадьб/i.test(includes) && /истори/i.test(includes) && /премиум/i.test(includes),
          `Allowed wedding packages are not explicit: ${includes}`);
      } else {
        assert(/мини/i.test(includes) && /хронолог/i.test(includes) && /голос/i.test(includes) && /без|нет|не вход/i.test(includes),
          `Mini limits are not explicit: ${includes}`);
      }
      const badge = page.locator('#prices .plan-example');
      assert(await badge.count() === 1 && await badge.isVisible(), 'Expected exactly one visible example package marker');
      assert(/как в примере выше/i.test(await badge.innerText()), 'Example marker is not clearly named');
      const markedPlan = await badge.locator('xpath=ancestor::article[contains(@class,"plan")]').locator('[data-plan]').getAttribute('data-plan');
      assert(markedPlan === expectedPlan, `Example package ${expectedPlan} is marked as ${markedPlan}`);
      return { expectedPlan, heroNote, includes, markedPlan };
    });
    if (route === 'home') await check(`${label}: wedding resets an ineligible Mini selection`, async () => {
      await page.locator('[name="plan"]').selectOption('mini');
      await page.locator('[name="occasion"]').selectOption('wedding');
      assert(await page.locator('[name="plan"]').inputValue() === 'unknown', 'Mini was not reset to unknown');
      assert(!await page.locator('[name="plan"] option[value="mini"]:not([disabled])').count(), 'Mini remains selectable for wedding');
      await page.locator('[name="occasion"]').selectOption('unknown');
    });
    if (route === 'home') await check(`${label}: Story card preserves a manually chosen wedding occasion`, async () => {
      try {
        await page.locator('[name="occasion"]').selectOption('wedding');
        await page.locator('#prices [data-plan="story"]').click();
        await targetInView(page, 'request');
        assert(await page.locator('[name="occasion"]').inputValue() === 'wedding', 'Story card reset the selected wedding occasion');
        assert(await page.locator('[name="plan"]').inputValue() === 'story', 'Story card did not select Story');
      } finally {
        await page.locator('[name="occasion"]').selectOption('unknown');
      }
    });
    if (route === 'home') await check(`${label}: incompatible Mini choice preserves wedding and explains alternatives`, async () => {
      try {
        await page.locator('[name="occasion"]').selectOption('wedding');
        await page.locator('#prices [data-plan="mini"]').click();
        await targetInView(page, 'request');
        assert(await page.locator('[name="occasion"]').inputValue() === 'wedding', 'Mini card reset the selected wedding occasion');
        assert(await page.locator('[name="plan"]').inputValue() === 'unknown', 'An incompatible Mini package remained selected');
        const status = (await page.locator('#request-status').innerText()).trim();
        assert(/свадьб/i.test(status) && /истори|премиум/i.test(status), `Wedding alternatives are not explained: ${status}`);
        return status;
      } finally {
        await page.locator('[name="occasion"]').selectOption('unknown');
      }
    });
    await check(`${label}: plan card fills the request form`, async () => {
      const plan = page.locator('#prices [data-plan]:visible').first();
      const id = await plan.getAttribute('data-plan');
      assert(planIds.includes(id), `Plan card uses a label instead of an ID: ${id}`);
      await plan.click();
      await page.waitForTimeout(350);
      assert(await page.locator('[name="plan"]').inputValue() === id, 'Plan did not reach the form');
      await targetInView(page, 'request');
    });
    await check(`${label}: static phone preview`, async () => {
      const preview = page.locator('.phone .phone-screen,.phone .gift-preview');
      assert(await preview.count(), 'Phone preview is missing');
      const before = await preview.evaluateAll(elements => elements.map(el => getComputedStyle(el).transform));
      await page.locator('.phone').first().scrollIntoViewIfNeeded();
      await page.evaluate(() => scrollBy(0, 350));
      await page.waitForTimeout(200);
      const after = await preview.evaluateAll(elements => elements.map(el => getComputedStyle(el).transform));
      assert(JSON.stringify(after) === JSON.stringify(before), 'Phone content moves with page scrolling');
    });
    await check(`${label}: native full example opens and works`, async () => {
      assert(await page.locator('details#gift-example').count() === 1, 'Example must use one native details element');
      assert(!await page.locator('#gift-example').evaluate(el => el.open), 'Full example starts open');
      await page.locator('[data-example]:visible').first().click();
      await page.waitForTimeout(350);
      assert(await page.locator('#gift-example').evaluate(el => el.open), 'Example action did not open details');
      await targetInView(page, 'gift-example');
      if (detailed) await shot(page, `${label}-example`);
      const answer = page.locator('#gift-example [data-answer]').first();
      if (await answer.count()) {
        await answer.click();
        assert((await answer.locator('xpath=ancestor::*[@data-quiz]').locator('.quiz-result').innerText()).trim(), 'Quiz gives no result');
      }
      const reason = page.locator('#gift-example [data-reason]').first();
      if (await reason.count()) {
        const before = await reason.innerText();
        await reason.click();
        assert(await reason.innerText() !== before, 'Reasons do not advance');
      }
      await page.locator('#gift-example > summary').click();
      assert(!await page.locator('#gift-example').evaluate(el => el.open), 'Example cannot be closed');
    });
    await check(`${label}: demo submit makes no data request`, async () => {
      await page.locator('[name="name"]').fill('Демо Проверка');
      await page.locator('[name="contact"]').fill('@povod_demo');
      const before = actions.length;
      await page.locator('#request-form button[type="submit"]').click();
      await page.waitForTimeout(250);
      const status = (await page.locator('#request-status').innerText()).trim();
      assert(/макет|демо|не отправ/i.test(status), `Demo result is missing: ${status}`);
      assert(actions.length === before, `Demo submit sent data requests: ${JSON.stringify(actions.slice(before))}`);
      return { status, dataRequests: actions.length - before };
    });
    await page.locator('#prices').scrollIntoViewIfNeeded();
    await page.locator('#request').scrollIntoViewIfNeeded();
    await basics(page, `${label}-after-actions`);
    if (detailed || reduced) await shot(page, `${label}-full`, true);
  } catch (error) {
    report.checks.push({ name: `${label}: page setup`, passed: false, detail: error.message });
  } finally {
    await page.close();
  }
}

try {
  const channel = args.browser || 'msedge';
  browser = await chromium.launch({ headless: true, ...(channel === 'chromium' ? {} : { channel }) });
  report.browser = { channel, version: browser.version() };
  const normal = await browser.newContext({ reducedMotion: 'no-preference' });
  for (const size of primarySizes) for (const route of routes) await routeCase(normal, route, size, true);
  for (const size of extraSizes) for (const route of ['home', 'wedding']) await routeCase(normal, route, size);
  await check('Navigation: direct hashes, Back and Forward preserve route, example and scroll', async () => {
    const page = await normal.newPage();
    page.setDefaultTimeout(5000);
    await open(page, 'not-a-povod-route');
    for (const section of ['prices', 'request']) {
      await open(page, section);
      await page.waitForTimeout(350);
      await targetInView(page, section);
    }
    await open(page, 'home');
    await page.locator('a[data-route="wedding"]:visible').first().click();
    await ready(page, 'wedding');
    await page.locator('a[data-route="birthday"]:visible').first().click();
    await ready(page, 'birthday');
    await page.locator('[data-example]:visible').first().click();
    await targetInView(page, 'gift-example');
    await page.evaluate(() => scrollBy(0, 375));
    await page.waitForTimeout(250);
    const savedY = await page.evaluate(() => scrollY);
    assert(savedY > 0, 'History scenario did not scroll the birthday page');
    await page.goBack();
    await ready(page, 'wedding');
    await page.goForward();
    await ready(page, 'birthday');
    assert(await page.locator('#gift-example').evaluate(el => el.open), 'Forward lost the open example');
    const restoredY = await page.evaluate(() => scrollY);
    assert(Math.abs(restoredY - savedY) <= 8, `Forward lost the scroll position: ${savedY} -> ${restoredY}`);
    await page.close();
    return { savedY, restoredY, exampleOpen: true };
  });
  for (const size of primarySizes) await check(`Keyboard ${size.join('x')}: skip link, focus and menu`, async () => {
    const page = await normal.newPage();
    await page.setViewportSize({ width: size[0], height: size[1] });
    page.setDefaultTimeout(5000);
    await open(page, 'home');
    await page.keyboard.press('Tab');
    assert(await page.locator('a.skip-link[href="#main"]').evaluate(el => el === document.activeElement), 'Skip link is not the first keyboard stop');
    await page.keyboard.press('Enter');
    assert(await page.locator('#main').evaluate(el => el === document.activeElement), 'Skip link does not focus main');
    if (size[0] < 768) {
      const toggle = page.locator('#menu-toggle');
      await toggle.focus();
      await page.keyboard.press('Enter');
      assert(await toggle.getAttribute('aria-expanded') === 'true' && await page.locator('#primary-nav').isVisible(), 'Menu does not open with keyboard');
      await page.keyboard.press('Escape');
      assert(await toggle.getAttribute('aria-expanded') === 'false', 'Escape does not close menu');
      assert(await toggle.evaluate(el => el === document.activeElement), 'Menu does not return focus');
      const routeHash = new URL(page.url()).hash;
      for (const id of ['how', 'prices', 'request']) {
        await toggle.focus();
        await page.keyboard.press('Enter');
        assert(await toggle.getAttribute('aria-expanded') === 'true', `Menu did not open before ${id}`);
        const link = page.locator(`#primary-nav [data-scroll="${id}"]`);
        for (let tabs = 0; tabs < 8 && !await link.evaluate(el => el === document.activeElement); tabs++) await page.keyboard.press('Tab');
        assert(await link.evaluate(el => el === document.activeElement), `${id} is not reachable by Tab`);
        await page.keyboard.press('Enter');
        await targetInView(page, id);
        assert(await page.locator(`#${id} h2`).first().evaluate(el => el === document.activeElement), `${id} heading did not receive focus`);
        assert(await toggle.getAttribute('aria-expanded') === 'false' && !await page.locator('#primary-nav').isVisible(), `${id} left the mobile menu open`);
        assert(new URL(page.url()).hash === routeHash && await page.locator('body').getAttribute('data-route') === 'home', `${id} changed the route`);
      }
    } else await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
    });
    assert((focus.outlineStyle !== 'none' && parseFloat(focus.outlineWidth) > 0) || focus.boxShadow !== 'none', `No visible focus treatment: ${JSON.stringify(focus)}`);
    await shot(page, `keyboard-${size.join('x')}`);
    await page.close();
  });
  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  for (const size of primarySizes) for (const route of ['home', 'wedding']) await routeCase(reduced, route, size, false, true);
  await check('Browser console and page errors', () => assert(!report.browserErrors.length, JSON.stringify(report.browserErrors)));
  await check('Local resources load successfully', () => assert(!report.brokenResources.length, JSON.stringify(report.brokenResources)));
} catch (error) {
  report.checks.push({ name: 'QA runner', passed: false, detail: error.stack || error.message });
} finally {
  clearTimeout(deadline);
  await browser?.close().catch(() => {});
  report.finished = new Date().toISOString();
  report.passed = report.checks.every(item => item.passed);
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  const failures = report.checks.filter(item => !item.passed);
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failures, screenshots: report.screenshots.length, output }, null, 2));
  process.exitCode = report.passed ? 0 : 1;
}
