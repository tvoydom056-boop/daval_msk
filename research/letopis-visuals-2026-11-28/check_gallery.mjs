import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const moduleFlag = args.indexOf('--playwright-module');
const modulePath = moduleFlag >= 0 ? args[moduleFlag + 1] : process.env.PLAYWRIGHT_MODULE_PATH;
const require = createRequire(import.meta.url);
const { chromium } = require(modulePath || 'playwright');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
const assets = manifest.assets;
const categories = [...new Set(assets.map(asset => asset.category))];
const qa = path.join(root, 'qa');
fs.mkdirSync(qa, { recursive: true });

const results = [];
const errors = [];
const safeMessage = message => String(message)
  .split(pathToFileURL(root + path.sep).href).join('./')
  .split(root).join('.')
  .split(root.replaceAll(path.sep, '/')).join('.');
function check(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: ${detail}`);
}

check('manifest', assets.length === 50 && new Set(assets.map(asset => asset.id)).size === 50,
  `${assets.length} entries, ${new Set(assets.map(asset => asset.id)).size} unique ids`);
check('categories', categories.length === 5, `${categories.length}/5 categories`);
const missingFiles = assets.filter(asset => {
  const target = path.resolve(root, asset.file);
  if (!target.startsWith(root + path.sep)) return true;
  return !fs.existsSync(target) || !fs.statSync(target).isFile();
});
check('original files', missingFiles.length === 0, `${50 - missingFiles.length}/50 present`);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 375, 812]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    page.on('console', message => {
      if (message.type() === 'error') errors.push(safeMessage(`${name} console: ${message.text()}`));
    });
    page.on('pageerror', error => errors.push(safeMessage(`${name} page: ${error.message}`)));
    page.on('requestfailed', request => errors.push(safeMessage(`${name} request: ${request.url()} ${request.failure()?.errorText}`)));
    await page.goto(pathToFileURL(path.join(root, 'gallery.html')).href, { waitUntil: 'load' });
    const imageState = await page.locator('img').evaluateAll(async images => {
      await Promise.all(images.map(image => {
        image.loading = 'eager';
        return image.decode().catch(() => {});
      }));
      return {
        count: images.length,
        loaded: images.filter(image => image.complete && image.naturalWidth > 0).length,
        named: images.filter(image => Boolean(image.alt.trim())).length
      };
    });
    const overflow = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth
    }));
    check(`${name} overflow`, overflow.document <= width && overflow.body <= width,
      `viewport ${overflow.viewport}, document ${overflow.document}, body ${overflow.body}`);
    const cardCount = await page.locator('article.card').count();
    check(`${name} cards`, cardCount === 50, `${cardCount}/50 cards`);
    check(`${name} images`, imageState.count === 50 && imageState.loaded === 50 && imageState.named === 50,
      `${imageState.loaded}/${imageState.count} loaded, ${imageState.named} with alt`);
    const originalLinks = await page.locator('a.visual').count();
    check(`${name} original links`, originalLinks === 50, `${originalLinks}/50 original links`);

    for (const category of categories) {
      await page.getByRole('button', { name: category, exact: true }).click();
      const visible = await page.locator('article.card:not([hidden])').count();
      const expected = assets.filter(asset => asset.category === category).length;
      check(`${name} filter ${category}`, expected === 10 && visible === expected,
        `${visible}/${expected} visible`);
    }
    await page.getByRole('button', { name: 'Все 50', exact: true }).click();
    const restored = await page.locator('article.card:not([hidden])').count();
    check(`${name} all filter`, restored === 50, `${restored}/50 visible`);
    const firstDetails = page.locator('article.card details').first();
    await firstDetails.locator('summary').click();
    const detailsOpen = await firstDetails.evaluate(element => element.open);
    const promptText = await firstDetails.locator('pre').innerText();
    check(`${name} prompt details`, detailsOpen && promptText === assets[0].generation_prompt,
      `open ${detailsOpen}, complete prompt ${promptText === assets[0].generation_prompt}`);
    await firstDetails.locator('summary').click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(qa, `${name}.png`) });
    if (name === 'desktop') {
      for (const [category, filename] of [
        ['Портреты и характер', 'portraits.png'],
        ['События как воспоминания', 'events.png']
      ]) {
        await page.getByRole('button', { name: category, exact: true }).click();
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(qa, filename), fullPage: true });
      }
    }
    await page.close();
  }
  check('browser errors', errors.length === 0, `${errors.length} console/page/request errors`);
  errors.forEach(error => console.log(error));
} finally {
  await browser.close();
}
const passed = results.filter(result => result.passed).length;
const report = {
  passed,
  total: results.length,
  results,
  errors,
  screenshots: ['qa/desktop.png', 'qa/mobile.png', 'qa/portraits.png', 'qa/events.png']
};
fs.writeFileSync(path.join(qa, 'results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`RESULT ${passed}/${results.length} PASS`);
if (passed !== results.length) process.exitCode = 1;
