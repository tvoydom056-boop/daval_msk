import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const option = name => process.argv[process.argv.indexOf(name) + 1];
const modulePath = process.argv.includes('--playwright-module') ? option('--playwright-module') : (process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const { chromium } = require(modulePath);
const url = process.argv.includes('--url') ? option('--url') : 'http://127.0.0.1:8773/';
const folder = path.dirname(fileURLToPath(import.meta.url));
await mkdir(path.join(folder, 'screens'), { recursive: true });
const checks = [];
const check = (name, passed, details = '') => { checks.push({ name, passed: Boolean(passed), details }); };
const range = await fetch(url + 'assets/story.mp3', { headers: { Range: 'bytes=0-1' } });
check('preview server: byte range for audio', range.status === 206 && (await range.arrayBuffer()).byteLength === 2);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 375]) {
    for (const scenario of ['default', 'audio-only', 'uncertain-date']) {
      const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 900 : 812 } });
      const errors = [];
      let mediaCancellations = 0;
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('requestfailed', request => {
        const failure = request.failure()?.errorText;
        // При seek браузер отменяет предыдущий MP3-запрос и начинает byte-range запрос.
        if (request.url().endsWith('/story.mp3') && failure === 'net::ERR_ABORTED') mediaCancellations++;
        else errors.push(request.url().split('/').pop() + ': ' + failure);
      });
      const response = await page.goto(url + (scenario === 'default' ? '' : '?case=' + scenario));
      await page.evaluate(() => document.fonts.ready);
      for (const image of await page.locator('img:visible').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(image => image.decode());
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForFunction(() => Number.isFinite(document.querySelector('audio').duration));
      const prefix = `${width}/${scenario}`;
      check(`${prefix}: HTTP`, response.ok());
      check(`${prefix}: no overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      check(`${prefix}: local font`, await page.evaluate(() => document.fonts.check('400 17px Literata')));
      check(`${prefix}: media duration and no autoplay`, await page.evaluate(() => {
        const audio = document.querySelector('audio');
        return audio.paused && !audio.autoplay && audio.duration >= 120 && audio.duration <= 300;
      }));
      check(`${prefix}: readable story`, await page.locator('.story').isVisible());
      const pictures = await page.locator('.photo-material:visible').count();
      check(`${prefix}: picture scenario`, scenario === 'audio-only' ? pictures === 0 : pictures === 3, String(pictures));
      if (scenario === 'uncertain-date') check(`${prefix}: approximate date`, /Примерно/.test(await page.locator('#episode-date').innerText()) && /Подтверждения нет/.test(await page.locator('#date-note').innerText()));
      await page.locator('.hero__actions a[href="#listen"]').click();
      await page.waitForFunction(() => document.querySelector('audio').currentTime > 0.3);
      check(`${prefix}: hero starts audio`, await page.evaluate(() => !document.querySelector('audio').paused));
      await page.locator('#toggle').click();
      await page.locator('#toggle').focus();
      check(`${prefix}: visible keyboard focus`, await page.locator('#toggle').evaluate(element => {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight && parseFloat(getComputedStyle(element).outlineWidth) >= 2;
      }));
      const playedFrom = await page.evaluate(() => document.querySelector('audio').currentTime);
      await page.keyboard.press('Space');
      await page.waitForFunction(from => !document.querySelector('audio').paused && document.querySelector('audio').currentTime > from + 0.2, playedFrom);
      check(`${prefix}: keyboard play`, await page.locator('#toggle').getAttribute('aria-pressed') === 'true');
      await page.keyboard.press('Space');
      check(`${prefix}: keyboard pause`, await page.evaluate(() => document.querySelector('audio').paused));
      await page.locator('#seek').focus();
      const before = await page.evaluate(() => document.querySelector('audio').currentTime);
      await page.keyboard.press('ArrowRight');
      check(`${prefix}: keyboard seek`, await page.evaluate(before => document.querySelector('audio').currentTime > before, before));
      await page.locator('#seek').fill('30');
      await page.locator('#seek').dispatchEvent('input');
      check(`${prefix}: seek 30 seconds`, await page.evaluate(() => Math.abs(document.querySelector('audio').currentTime - 30) < 1));
      await page.locator('#toggle').click();
      await page.waitForFunction(() => document.querySelector('audio').currentTime > 30.3);
      await page.locator('#toggle').click();
      check(`${prefix}: playback after seek`, await page.evaluate(() => document.querySelector('audio').paused && !document.querySelector('audio').error));
      check(`${prefix}: no browser errors`, errors.length === 0, errors.join('; ') || `Normal MP3 request cancellations during seek: ${mediaCancellations}`);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(folder, 'screens', `${scenario}-${width}.png`), fullPage: true });
      await page.close();
    }
  }
  for (const width of [768, 1024]) {
    const page = await browser.newPage({ viewport: { width, height: 1024 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))));
    for (const image of await page.locator('img:visible').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(image => image.decode());
    }
    check(`${width}/album: no overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    check(`${width}/album: readable story and illustrations`, await page.locator('.story').isVisible() && await page.locator('.photo-material:visible').count() === 3);
    check(`${width}/album: player controls do not overlap`, await page.evaluate(() => {
      const button = document.querySelector('#toggle').getBoundingClientRect();
      const slider = document.querySelector('#seek').getBoundingClientRect();
      return button.right <= slider.left || slider.right <= button.left || button.bottom <= slider.top || slider.bottom <= button.top;
    }));
    check(`${width}/album: captions at least 13px`, await page.locator('figcaption').evaluateAll(elements => elements.every(element => parseFloat(getComputedStyle(element).fontSize) >= 13)));
    check(`${width}/album: no browser errors`, errors.length === 0, errors.join('; '));
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(folder, 'screens', `album-${width}.png`), fullPage: true });
    await page.close();
  }
  const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  await noJs.goto(url);
  check('no-JS: native audio and readable text', await noJs.locator('audio[controls]').isVisible() && await noJs.locator('.story').isVisible());
  await noJs.close();
  const failed = await browser.newPage();
  await failed.route('**/story.mp3', route => route.abort());
  await failed.goto(url);
  await failed.waitForFunction(() => document.querySelector('#audio-status').textContent.includes('не загрузилась'));
  check('audio error: message, disabled controls, readable story', await failed.locator('#toggle').isDisabled() && await failed.locator('#seek').isDisabled() && await failed.locator('.story').isVisible());
  await failed.close();
  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto(url);
  check('reduced motion: no entrance animation', await reduced.locator('.hero__copy').evaluate(element => getComputedStyle(element).animationName === 'none'));
  await reduced.close();
  const offline = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await offline.goto(pathToFileURL(path.join(folder, '..', 'index.html')).href);
  await offline.locator('#toggle').click();
  await offline.waitForFunction(() => document.querySelector('audio').currentTime > 0.3);
  await offline.locator('#toggle').click();
  await offline.locator('#seek').fill('30');
  check('offline file: play, pause, seek, font and story', await offline.evaluate(() => Math.abs(document.querySelector('audio').currentTime - 30) < 1 && document.querySelector('audio').paused && document.fonts.check('400 17px Literata')) && await offline.locator('.story').isVisible());
  await offline.close();
} finally {
  await browser.close();
  await writeFile(path.join(folder, 'results.json'), JSON.stringify({ checked: '2026-11-28', browser: 'Edge', checks }, null, 2) + '\n');
}
const failed = checks.filter(item => !item.passed);
console.log(`${checks.length - failed.length}/${checks.length} passed`);
for (const item of failed) console.log(`FAIL ${item.name}: ${item.details}`);
if (failed.length) process.exitCode = 1;
