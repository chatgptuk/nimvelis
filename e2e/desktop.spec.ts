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

test('system menus expose Nimvelis workflows and keyboard guidance', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Nimvelis menu' }).click();
  await page.getByRole('menuitem', { name: 'About This Device' }).click();
  const about = page.getByRole('dialog', { name: 'Nimvelis Aurora' });
  await expect(about).toBeVisible();
  await expect(about).toContainText('Version 0.2');
  await expect(about).toContainText('LOCAL STORAGE');
  await expect(about).toContainText('Display');
  await about.getByRole('button', { name: 'Close About This Device' }).click();
  await expect(about).toBeHidden();

  await page.getByRole('button', { name: 'Space', exact: true }).click();
  const spaceMenu = page.getByRole('menu');
  await expect(spaceMenu).toContainText('Saved on this device');

  await spaceMenu.getByRole('menuitem', { name: /Appearance/ }).click();
  await expect(page.locator('[data-app-id="settings"]')).toBeVisible();

  await page.getByRole('button', { name: 'Help', exact: true }).click();
  const helpMenu = page.getByRole('menu');
  await expect(helpMenu).toContainText('Keyboard flow');
  await expect(helpMenu).toContainText('Cycle focus');
});

test('local files can be edited, searched by content, imported, and previewed', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: /^Files/ })
    .last()
    .click();
  const filesWindow = page.locator('[data-app-id="files"]').first();
  await expect(filesWindow).toBeVisible();
  await expect(filesWindow.getByText('Aurora Shapes.svg')).toBeVisible();

  await filesWindow.getByRole('button', { name: 'New text' }).click();
  const textWindow = page.locator('[data-app-id="text"]').last();
  await expect(textWindow).toBeVisible();
  await textWindow.getByRole('textbox', { name: 'File name' }).fill('Aurora Plan.txt');
  await textWindow
    .getByRole('textbox', { name: 'Document content' })
    .fill('Offline roadmap and private local workspace');
  await expect(textWindow.getByText('Saved locally')).toBeVisible();

  await page.keyboard.press('Control+K');
  const search = page.getByRole('dialog', { name: 'Search Nimvelis' });
  await search.getByRole('textbox').fill('offline roadmap');
  await expect(search.getByRole('button', { name: /Aurora Plan.txt/ })).toBeVisible();
  await search.getByRole('button', { name: /Aurora Plan.txt/ }).click();
  await expect(page.locator('[data-app-id="text"]')).toHaveCount(2);

  await filesWindow.locator('input[type="file"]').setInputFiles({
    name: 'tiny.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="#58d8ca"/></svg>',
    ),
  });
  await expect(filesWindow.getByRole('button', { name: 'tiny.svg', exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: /^Files/ })
    .last()
    .click();
  await filesWindow.getByRole('button', { name: 'tiny.svg', exact: true }).click();

  const viewWindow = page.locator('[data-app-id="view"]').last();
  await expect(viewWindow).toBeVisible();
  await expect(viewWindow.getByRole('img', { name: 'tiny.svg' })).toBeVisible();
});
