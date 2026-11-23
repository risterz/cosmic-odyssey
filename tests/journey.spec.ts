import { test, expect } from '@playwright/test';

test('cinematic journey, planet details, sound and dialogs work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.experience')).toHaveClass(/is-ready/, { timeout: 30000 });
  await expect(page.getByRole('heading', { name: 'COSMIC ODYSSEY' })).toBeVisible();
  await expect(page.locator('.loader')).toBeHidden();
  await expect(page.locator('.hero-title > span').last()).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'test-results/hero-desktop.png' });

  await page.getByRole('button', { name: 'Enable ambient sound' }).click();
  await expect(page.getByRole('button', { name: 'Mute ambient sound' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Mute ambient sound' }).click();

  await page.getByRole('button', { name: 'Our Mission' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A new way to see home.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();

  await page.locator('.world-selector').getByRole('button', { name: /Earth/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.planet-info h2')).toHaveText('Earth');
  await page.getByRole('button', { name: 'Next destination' }).click();
  await expect(page.locator('.planet-info h2')).toHaveText('Mars');
  await page.getByRole('button', { name: 'Close dialog' }).click();

  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.menu-overlay nav button').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.locator('.menu-overlay').getByRole('button', { name: /04 Weightless/ }).click();
  await expect(page.locator('.menu-overlay')).not.toHaveClass(/open/);
  await expect.poll(() => page.evaluate(() => Math.abs(window.scrollY - document.getElementById('weightless')!.offsetTop))).toBeLessThan(2);
  await expect(page.locator('#weightless .section-title')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'test-results/weightless-desktop.png' });

  await page.locator('#beyond').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Begin your odyssey' }).click();
  await expect(page.getByRole('heading', { name: 'Ready for a new perspective?' })).toBeVisible();
  await page.getByRole('button', { name: 'Start cinematic journey' }).click();
  await expect(page.getByRole('button', { name: 'Pause cinematic journey' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause cinematic journey' }).click();
  expect(errors).toEqual([]);
});

test('mobile layout has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.experience')).toHaveClass(/is-ready/, { timeout: 30000 });
  await expect(page.locator('.loader')).toBeHidden();
  await expect(page.locator('.hero-title > span').last()).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'test-results/hero-mobile.png' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.locator('.menu-overlay').getByRole('button', { name: /03 New worlds/ }).click();
  await expect.poll(() => page.evaluate(() => Math.abs(window.scrollY - document.getElementById('worlds')!.offsetTop))).toBeLessThan(2);
  await expect(page.locator('#worlds .section-title')).toHaveCSS('opacity', '1');
  await expect(page.locator('.jupiter-hotspot')).toHaveCSS('opacity', '1');
  for (const id of ['earth', 'mars', 'jupiter', 'saturn']) {
    const label = page.locator(`.${id}-hotspot`);
    await expect(label).toBeVisible();
    await expect(label).toHaveCSS('opacity', '1');
    await expect(label).toHaveCSS('pointer-events', 'auto');
    await expect(label).toHaveAttribute('aria-hidden', 'false');
    await expect(label).toHaveJSProperty('inert', false);
    await expect(label).toHaveAttribute('tabindex', '0');
    const bounds = await label.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    expect(bounds!.y).toBeGreaterThan(250);
    expect(bounds!.y + bounds!.height).toBeLessThan(690);
  }
  await page.screenshot({ path: 'test-results/worlds-mobile.png' });
  await page.getByRole('button', { name: 'Explore Jupiter', exact: true }).click();
  await expect(page.locator('.planet-info h2')).toHaveText('Jupiter');
  await page.screenshot({ path: 'test-results/planet-mobile.png' });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.jupiter-hotspot')).toHaveCSS('opacity', '1');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.jupiter-hotspot')).toHaveCSS('opacity', '1');
});

test('reduced motion keeps every chapter readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.experience')).toHaveClass(/is-ready/, { timeout: 30000 });
  await expect(page.locator('.tour-control')).toBeHidden();
  await page.locator('#galaxy').scrollIntoViewIfNeeded();
  await expect(page.locator('#galaxy-title')).toBeVisible();
  const opacity = await page.locator('#galaxy-title').evaluate((element) => getComputedStyle(element).opacity);
  expect(opacity).toBe('1');
  await page.locator('#worlds').scrollIntoViewIfNeeded();
  await expect(page.locator('.jupiter-hotspot')).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: 'Explore Saturn', exact: true }).click();
  await expect(page.locator('.planet-info h2')).toHaveText('Saturn');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
