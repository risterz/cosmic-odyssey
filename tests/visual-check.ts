import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4173');
await page.waitForSelector('.is-ready');
for (const [name, fraction] of [['galaxy', 0.5], ['worlds', 0.5], ['beyond', 0.5]] as const) {
  await page.evaluate(({ name, fraction }) => {
    const element = document.getElementById(name)!;
    const target = element.offsetTop + (element.offsetHeight - innerHeight) * fraction;
    window.scrollTo({ top: target, behavior: 'instant' });
  }, { name, fraction });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `test-results/${name}-desktop.png` });
}
await browser.close();
