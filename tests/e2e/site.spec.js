import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const ICONS = new Set(
  readFileSync(new URL('../../scripts/icons.txt', import.meta.url), 'utf8')
    .split(/\s+/)
    .filter(Boolean),
);

/** Fails the test on any console error or uncaught exception, hydration mismatches included. */
function watchErrors(page) {
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

/** Waits until React has hydrated: the theme switch thumb is measured on mount. */
async function hydrated(page) {
  await expect(page.locator('.cv-head .cv-seg__thumb').first()).not.toHaveAttribute('style', /opacity/);
}

test('the prerendered page is complete without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Volodymyr Myronenko');
  await expect(page.locator('#cv-experience')).toContainText('Test rigs for hardware components.');
  await expect(page.locator('#cv-projects')).toContainText('Betaflight OSD Fonts');
  await expect(page.locator('#cv-skills')).toContainText('FreeRTOS');
  await expect(page.locator('#cv-contact a[href="mailto:volempdoge@gmail.com"]').first()).toBeVisible();
  await expect(page.locator('.cv-boot')).toBeHidden();
  await context.close();
});

test('hydrates without errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await hydrated(page);
  await expect(page.locator('.cv-foot__commit')).toContainText(/^[0-9a-f]{7}/);
  expect(errors).toEqual([]);
});

test('has no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('terminal runs commands and scrolls to sections', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await hydrated(page);
  await page.getByRole('button', { name: 'terminal', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'command', exact: true });
  await expect(input).toBeFocused();
  await input.fill('cat sk');
  await input.press('Tab');
  await expect(input).toHaveValue('cat skills.txt ');
  await input.press('Enter');
  await expect(page.locator('.cv-term')).toContainText('embedded: STM32, ESP32, FreeRTOS, LoRa, SWD/JTAG');
  await expect(page.locator('#cv-skills')).toBeInViewport();
  await input.fill('frobnicate');
  await input.press('Enter');
  await expect(page.locator('.cv-term__line--err')).toHaveText('zsh: command not found: frobnicate');
  expect(errors).toEqual([]);
});

test('command palette finds and opens sections', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  await page.keyboard.press('ControlOrMeta+k');
  const search = page.getByRole('textbox', { name: 'commands' });
  await expect(search).toBeFocused();
  await search.fill('educ');
  await search.press('Enter');
  await expect(page.locator('.cv-window')).toHaveCount(0);
  await expect(page.locator('#cv-education')).toBeInViewport();
});

test('theme is applied and remembered', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await hydrated(page);
  await expect(page.getByRole('button', { name: 'light' })).toHaveAttribute('aria-pressed', 'true');
});

test('saved language and shared focus are applied behind the boot screen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => localStorage.setItem('vm-cv2.lang', 'ua'));
  await page.goto('/?role=software');
  await expect(page.locator('h1')).toHaveText('Володимир Мироненко');
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await expect(page.locator('#cv-projects')).toContainText('Сайт Гуртка політичних студій KSE');
  await expect(page.locator('html')).not.toHaveAttribute('data-boot');
  await expect(page.locator('.cv-boot')).toBeHidden();
  expect(errors).toEqual([]);
});

test('focus switch updates the page and the address', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  await page.getByRole('button', { name: 'focus on relevant projects & skills' }).click();
  await page.getByRole('option', { name: /Software Engineer/ }).click();
  await expect(page).toHaveURL(/\?role=software$/);
  await expect(page.locator('#cv-projects')).toContainText('KSE Political Studies Club website');
});

test('every icon on the page is in the icon font subset', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  await page.getByRole('button', { name: 'focus on relevant projects & skills' }).click();
  const seen = new Set(await page.locator('.cv-icon').allTextContents());
  await page.keyboard.press('Escape');
  await page.keyboard.press('ControlOrMeta+k');
  for (const name of await page.locator('.cv-icon').allTextContents()) seen.add(name);
  const missing = [...seen].filter((n) => !ICONS.has(n));
  expect(missing, 'add these to scripts/icons.txt and run node scripts/subset-icons.mjs').toEqual([]);
});

test('print shows the short light version', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.cv-head')).toBeHidden();
  await expect(page.locator('#cv-contact')).toBeHidden();
  await expect(page.locator('.cv-print-note')).toBeVisible();
  await expect(page.locator('.cv-print-contact')).toContainText('volempdoge@gmail.com');
});
