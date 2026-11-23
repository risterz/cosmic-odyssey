import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

await mkdir('test-results/scenes', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4173');
await page.waitForFunction(() => document.querySelector('.experience')?.classList.contains('is-ready'));
await page.waitForTimeout(2600);
for (const id of ['home', 'galaxy', 'worlds', 'weightless', 'beyond']) {
  await page.evaluate((target) => window.scrollTo({ top: document.getElementById(target).offsetTop, behavior: 'instant' }), id);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `test-results/scenes/${id}-desktop.png` });
  const state = await page.evaluate((target) => {
    const element = document.getElementById(target);
    const title = element.querySelector('h1,h2');
    return { scrollY: window.scrollY, offsetTop: element.offsetTop, titleOpacity: getComputedStyle(title).opacity };
  }, id);
  console.log(id, state);
}
await page.setViewportSize({ width: 390, height: 844 });
for (const id of ['home', 'worlds', 'beyond']) {
  await page.evaluate((target) => window.scrollTo({ top: document.getElementById(target).offsetTop, behavior: 'instant' }), id);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `test-results/scenes/${id}-mobile.png` });
}
console.log('Browser errors:', errors);
await browser.close();
