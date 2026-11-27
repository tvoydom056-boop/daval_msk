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
const researchRoot = path.dirname(root);
const catalogCollections = fs.readdirSync(researchRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && fs.existsSync(path.join(researchRoot, entry.name, 'manifest.json')))
  .map(entry => ({ folder: entry.name, manifest: JSON.parse(fs.readFileSync(path.join(researchRoot, entry.name, 'manifest.json'), 'utf8').replace(/^\uFEFF/, '')) }))
  .filter(entry => entry.manifest.site === 'letopis' && entry.manifest.assets?.length);
const catalogTotal = catalogCollections.reduce((total, entry) => total + entry.manifest.assets.length, 0);
const expectedCatalogLinks = new Set(catalogCollections.map(entry => pathToFileURL(path.join(researchRoot, entry.folder, 'gallery.html')).href));
const qa = path.join(root, 'qa');
fs.mkdirSync(qa, { recursive: true });

const results = [];
const errors = [];
const safeMessage = message => String(message)
  .split(pathToFileURL(path.dirname(root) + path.sep).href).join('../')
  .split(path.dirname(root)).join('..')
  .split(path.dirname(root).replaceAll(path.sep, '/')).join('..')
  .split(pathToFileURL(root + path.sep).href).join('./')
  .split(root).join('.')
  .split(root.replaceAll(path.sep, '/')).join('.');
function check(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: ${detail}`);
}

const sortedIds = assets.map(asset => asset.id).sort((a, b) => a - b);
check('manifest', assets.length === 20 && sortedIds.every((id, index) => id === index + 101),
  `${assets.length} entries, exact ids 101-120: ${sortedIds.every((id, index) => id === index + 101)}`);
check('categories', categories.length === 4, `${categories.length}/4 categories`);
const cutoutIds = assets.filter(asset => asset.transparent_background).map(asset => asset.id).sort((a, b) => a - b);
check('transparent assignments', cutoutIds.length === 5 && cutoutIds.every((id, index) => id === index + 116),
  `${cutoutIds.length}/5 cutouts, exact ids 116-120: ${cutoutIds.every((id, index) => id === index + 116)}`);
const missingFiles = assets.filter(asset => {
  const target = path.resolve(root, asset.file);
  if (!target.startsWith(root + path.sep)) return true;
  return !fs.existsSync(target) || !fs.statSync(target).isFile();
});
check('original files', missingFiles.length === 0, `${20 - missingFiles.length}/20 present`);

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
    check(`${name} cards`, cardCount === 20, `${cardCount}/20 cards`);
    check(`${name} images`, imageState.count === 20 && imageState.loaded === 20 && imageState.named === 20,
      `${imageState.loaded}/${imageState.count} loaded, ${imageState.named} with alt`);
    const originalLinks = await page.locator('a.visual').count();
    check(`${name} original links`, originalLinks === 20, `${originalLinks}/20 original links`);
    const cutoutStyles = await page.locator('a.visual.cutout').evaluateAll(elements => elements.map(element => ({
      background: getComputedStyle(element).backgroundImage,
      fit: getComputedStyle(element.querySelector('img')).objectFit
    })));
    check(`${name} transparent previews`, cutoutStyles.length === 5 && cutoutStyles.every(item => item.background.includes('conic-gradient') && item.fit === 'contain'),
      `${cutoutStyles.length}/5 CSS checker backgrounds, complete images: ${cutoutStyles.every(item => item.fit === 'contain')}`);

    for (const category of categories) {
      await page.getByRole('button', { name: category, exact: true }).click();
      const visible = await page.locator('article.card:not([hidden])').count();
      const expected = assets.filter(asset => asset.category === category).length;
      check(`${name} filter ${category}`, expected === 5 && visible === expected,
        `${visible}/${expected} visible`);
    }
    await page.getByRole('button', { name: 'Все 20', exact: true }).click();
    const restored = await page.locator('article.card:not([hidden])').count();
    check(`${name} all filter`, restored === 20, `${restored}/20 visible`);
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
        ['Личные вещи', 'objects.png'],
        ['Домашние традиции', 'traditions.png']
      ]) {
        await page.getByRole('button', { name: category, exact: true }).click();
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(qa, filename), fullPage: true });
        if (category === 'Личные вещи') {
          for (const [background, variant] of [['#f3ece0', 'paper'], ['#1d1a16', 'dark']]) {
            const style = await page.addStyleTag({ content: `.visual.cutout{background:${background}!important}` });
            await page.screenshot({ path: path.join(qa, `objects-${variant}.png`), fullPage: true });
            await style.evaluate(element => element.remove());
          }
        }
      }
    }
    await page.close();
  }
  const catalogPath = path.join(root, '..', 'letopis-catalog.html');
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 375, 812]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    page.on('console', message => {
      if (message.type() === 'error') errors.push(safeMessage(`catalog ${name} console: ${message.text()}`));
    });
    page.on('pageerror', error => errors.push(safeMessage(`catalog ${name} page: ${error.message}`)));
    page.on('requestfailed', request => errors.push(safeMessage(`catalog ${name} request: ${request.url()} ${request.failure()?.errorText}`)));
    await page.goto(pathToFileURL(catalogPath).href, { waitUntil: 'load' });
    const galleryLinks = await page.locator('a.gallery-link').evaluateAll(links => links.map(link => link.href));
    const validLinks = galleryLinks.length === catalogCollections.length && galleryLinks.every(link => expectedCatalogLinks.has(link) && fs.existsSync(fileURLToPath(link)));
    check(`catalog ${name} links`, validLinks, `${galleryLinks.length}/${catalogCollections.length} gallery links, targets exist: ${validLinks}`);
    const catalogHeading = await page.locator('h1').innerText();
    const catalogCount = await page.locator('header .count').innerText();
    check(`catalog ${name} total`, catalogHeading.startsWith(`${catalogTotal} `) && catalogCount.includes(`${catalogTotal} из ${catalogTotal}`),
      `${catalogTotal} expected, complete total shown: ${catalogCount.includes(`${catalogTotal} из ${catalogTotal}`)}`);
    const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    check(`catalog ${name} overflow`, overflow.document <= width && overflow.body <= width,
      `viewport ${width}, document ${overflow.document}, body ${overflow.body}`);
    const previews = await page.locator('img').evaluateAll(async images => {
      await Promise.all(images.map(image => image.decode().catch(() => {})));
      return { total: images.length, loaded: images.filter(image => image.complete && image.naturalWidth > 0).length };
    });
    check(`catalog ${name} previews`, previews.total === catalogCollections.length * 2 && previews.loaded === previews.total,
      `${previews.loaded}/${previews.total} loaded`);
    await page.screenshot({ path: path.join(qa, `catalog-${name}.png`), fullPage: true });
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
  screenshots: ['qa/desktop.png', 'qa/mobile.png', 'qa/objects.png', 'qa/objects-paper.png', 'qa/objects-dark.png', 'qa/traditions.png', 'qa/catalog-desktop.png', 'qa/catalog-mobile.png']
};
fs.writeFileSync(path.join(qa, 'results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`RESULT ${passed}/${results.length} PASS`);
if (passed !== results.length) process.exitCode = 1;
