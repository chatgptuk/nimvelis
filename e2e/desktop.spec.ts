import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
});

test('desktop window can be dragged, minimized, restored, and duplicated', async ({ page }) => {
  await expect(page.locator('.desktop-shell')).toHaveAttribute('data-wallpaper', 'aurora');
  const memoWindow = page.locator('[data-app-id="memo"]').first();
  await expect(memoWindow).toBeVisible();

  const titlebar = memoWindow.locator('.window-titlebar');
  const before = await memoWindow.boundingBox();
  const titlebarBox = await titlebar.boundingBox();
  if (!before || !titlebarBox) throw new Error('Memo window was not measurable');

  await page.mouse.move(titlebarBox.x + 180, titlebarBox.y + 20);
  await page.mouse.down();
  await page.mouse.move(titlebarBox.x + 270, titlebarBox.y + 74, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => (await memoWindow.boundingBox())?.x).toBeGreaterThan(before.x + 60);

  const beforeResize = await memoWindow.boundingBox();
  if (!beforeResize) throw new Error('Memo window was not measurable before resize');
  await page.mouse.move(
    beforeResize.x + beforeResize.width - 2,
    beforeResize.y + beforeResize.height - 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    beforeResize.x + beforeResize.width + 74,
    beforeResize.y + beforeResize.height + 48,
    { steps: 8 },
  );
  await page.mouse.up();

  await expect
    .poll(async () => (await memoWindow.boundingBox())?.width)
    .toBeGreaterThan(beforeResize.width + 50);

  await memoWindow.getByRole('button', { name: /Minimize/ }).click();
  await expect(memoWindow).toBeHidden();

  await page.getByRole('button', { name: /^Memo/ }).last().click();
  await expect(memoWindow).toBeVisible();

  await page
    .getByRole('button', { name: /^Memo/ })
    .last()
    .click({ modifiers: ['Shift'] });
  await expect(page.locator('[data-app-id="memo"]')).toHaveCount(2);
});

test('appearance settings update the desktop immediately', async ({ page }) => {
  await page
    .getByRole('button', { name: /^Settings/ })
    .last()
    .click();
  const settingsWindow = page.locator('[data-app-id="settings"]');
  await expect(settingsWindow).toBeVisible();

  await settingsWindow.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('.desktop-shell')).toHaveAttribute('data-appearance', 'dark');

  await settingsWindow.getByRole('button', { name: /Soft Solstice/ }).click();
  await expect(page.locator('.desktop-shell')).toHaveAttribute('data-wallpaper', 'solstice');
});
