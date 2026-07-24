import { expect, test } from '@playwright/test';
import { solveLumaBoard } from '../src/apps/luma/game-engine';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('nimvelis-e2e-ready')) return;
    localStorage.clear();
    sessionStorage.setItem('nimvelis-e2e-ready', 'true');
  });
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

test('desktop and accessibility settings update persisted shell preferences', async ({ page }) => {
  await page
    .getByRole('button', { name: /^Settings/ })
    .last()
    .click();
  const settingsWindow = page.locator('[data-app-id="settings"]');

  await settingsWindow.getByRole('button', { name: /Desktop/ }).click();
  await settingsWindow.getByRole('button', { name: 'Compact' }).click();
  await settingsWindow.getByRole('button', { name: /Date & Time/ }).click();
  await settingsWindow.getByRole('switch', { name: 'Show seconds' }).click();
  await settingsWindow.getByRole('combobox', { name: 'Time zone' }).selectOption('Asia/Tokyo');
  await settingsWindow.getByRole('button', { name: 'Monday' }).click();
  await expect(page.locator('.desktop-shell')).toHaveAttribute('data-density', 'compact');
  await expect(settingsWindow.getByText('Nimvelis override')).toBeVisible();

  await settingsWindow.getByRole('button', { name: /Accessibility/ }).click();
  await settingsWindow.getByRole('button', { name: 'Large' }).click();
  await settingsWindow.getByRole('switch', { name: 'Higher contrast' }).click();
  await settingsWindow.getByRole('switch', { name: 'Reduce motion' }).click();
  await expect(page.locator('.desktop-shell')).toHaveAttribute('data-high-contrast', 'true');
  await expect(page.locator('.desktop-shell')).toHaveAttribute('data-reduce-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-text-scale', 'large');

  await page.reload();
  await expect(page.locator('.desktop-shell')).toHaveAttribute('data-density', 'compact');
  await expect(page.locator('.desktop-shell')).toHaveAttribute('data-high-contrast', 'true');
});

test('tasks and calendar share a local agenda', async ({ page }) => {
  await page
    .getByRole('button', { name: /^Tasks/ })
    .last()
    .click();
  const tasksWindow = page.locator('[data-app-id="tasks"]');
  await tasksWindow.getByRole('textbox', { name: 'Task title' }).fill('Ship Aurora 0.8');
  await tasksWindow.getByRole('textbox', { name: 'Task due date' }).fill('2026-07-23');
  await tasksWindow.getByRole('button', { name: 'Add task' }).click();
  await expect(tasksWindow.getByText('Ship Aurora 0.8')).toBeVisible();

  await page
    .getByRole('button', { name: /^Calendar/ })
    .last()
    .click();
  const calendarWindow = page.locator('[data-app-id="calendar"]');
  await calendarWindow.getByRole('textbox', { name: 'Event title' }).fill('Release review');
  await calendarWindow.getByRole('button', { name: 'Add event' }).click();
  await expect(calendarWindow.getByText('Release review')).toBeVisible();
});

test('clock includes world clocks, timer, and stopwatch', async ({ page }) => {
  await page
    .getByRole('button', { name: /^Clock/ })
    .last()
    .click();
  const clockWindow = page.locator('[data-app-id="clock"]');
  await expect(clockWindow.getByText('Vancouver')).toBeVisible();

  await clockWindow.getByRole('button', { name: 'Timer' }).click();
  await clockWindow.getByRole('button', { name: 'Start' }).click();
  await expect(clockWindow.getByRole('button', { name: 'Pause' })).toBeVisible();

  await clockWindow.getByRole('button', { name: 'Stopwatch' }).click();
  await clockWindow.getByRole('button', { name: 'Start' }).click();
  await expect(clockWindow.getByRole('button', { name: 'Pause' })).toBeVisible();
});

test('connections shows honest network diagnostics and Bluetooth availability', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: /^Connections/ })
    .last()
    .click();
  const connectionsWindow = page.locator('[data-app-id="connections"]');

  await expect(connectionsWindow).toBeVisible();
  await expect(connectionsWindow.getByRole('heading', { name: 'Network & Wi-Fi' })).toBeVisible();
  await expect(connectionsWindow.getByText('Websites cannot read Wi-Fi names')).toBeVisible();
  await expect(
    connectionsWindow.getByRole('heading', { name: 'Bluetooth', exact: true }),
  ).toBeVisible();
  await expect(
    connectionsWindow
      .getByRole('region', { name: 'Bluetooth' })
      .getByText(/Available|Unavailable|Checking/, { exact: true }),
  ).toBeVisible();

  await connectionsWindow.getByRole('button', { name: 'Test connection' }).click();
  await expect(connectionsWindow.getByRole('button', { name: 'Test connection' })).toBeEnabled();
});

test('Terminal operates on local files with history and an honest sandbox boundary', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: /^Terminal/ })
    .last()
    .click();
  const terminalWindow = page.locator('[data-app-id="terminal"]');
  const commandInput = terminalWindow.getByRole('textbox', { name: 'Terminal command' });

  await expect(terminalWindow).toBeVisible();
  await expect(terminalWindow.getByText('Nimvelis Local Shell 1.0')).toBeVisible();

  await commandInput.fill('mkdir "CLI Notes"');
  await commandInput.press('Enter');
  await expect(terminalWindow.getByText('Created /CLI Notes/')).toBeVisible();

  await commandInput.fill('cd "CLI Notes"');
  await commandInput.press('Enter');
  await expect(commandInput).toBeEnabled();

  await commandInput.fill('write plan.txt "Ship local shell"');
  await commandInput.press('Enter');
  await expect(terminalWindow.getByText(/Wrote .* to \/CLI Notes\/plan.txt/)).toBeVisible();

  await commandInput.fill('cat plan.txt');
  await commandInput.press('Enter');
  await expect(terminalWindow.getByText('Ship local shell', { exact: true })).toBeVisible();

  await commandInput.fill('sudo whoami');
  await commandInput.press('Enter');
  await expect(terminalWindow.getByText(/unavailable in the browser sandbox/)).toBeVisible();

  await commandInput.press('ArrowUp');
  await expect(commandInput).toHaveValue('sudo whoami');
});

test('Luma plays as a keyboard-friendly local puzzle and keeps its best score', async ({
  page,
}) => {
  await page.getByRole('button', { name: /^Luma/ }).last().click();
  const lumaWindow = page.locator('[data-app-id="luma"]');
  await expect(lumaWindow).toBeVisible();
  await expect(lumaWindow.getByText('Quiet constellation puzzle')).toBeVisible();

  await lumaWindow.getByRole('button', { name: 'Pocket 3 × 3' }).click();
  const cells = lumaWindow.locator('[data-luma-cell]');
  await expect(cells).toHaveCount(9);

  await lumaWindow.getByRole('button', { name: 'Pause game' }).click();
  await expect(lumaWindow.getByText('Sky paused')).toBeVisible();
  await lumaWindow.getByRole('button', { name: 'Resume', exact: true }).click();

  await cells.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(cells.nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    lumaWindow.locator('.luma-stats article').filter({ hasText: 'Moves' }),
  ).toContainText('01');
  await lumaWindow.getByRole('button', { name: 'Undo' }).click();

  const board = await cells.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-lit') === 'true'),
  );
  const solution = solveLumaBoard(board, 3);
  expect(solution).not.toBeNull();
  for (const index of solution ?? []) {
    await cells.nth(index).click();
  }

  await expect(lumaWindow.getByText('Quiet sky restored')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('nimvelis.luma.best.v1')))
    .not.toBeNull();

  await page.reload();
  const restoredLuma = page.locator('[data-app-id="luma"]');
  await expect(restoredLuma).toBeVisible();
  await restoredLuma.getByRole('button', { name: 'Pocket 3 × 3' }).click();
  await expect(
    restoredLuma.locator('.luma-stats article').filter({ hasText: 'Best' }),
  ).not.toContainText('—');
});

test('desktop icons can be moved and keep their positions after reload', async ({ page }) => {
  const filesIcon = page.getByRole('button', { name: 'Open Files' });
  const before = await filesIcon.boundingBox();
  if (!before) throw new Error('Files desktop icon was not measurable');

  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x - 210, before.y + 120, { steps: 10 });
  await page.mouse.up();

  await expect.poll(async () => (await filesIcon.boundingBox())?.x).toBeLessThan(before.x - 150);
  const moved = await filesIcon.boundingBox();
  await page.reload();
  const restored = await page.getByRole('button', { name: 'Open Files' }).boundingBox();
  expect(restored?.x).toBeCloseTo(moved?.x ?? 0, 0);
  expect(restored?.y).toBeCloseTo(moved?.y ?? 0, 0);
});

test('Vela exposes a persistent server-approved model picker', async ({ page }) => {
  await page.getByRole('button', { name: /^Vela/ }).last().click();
  const velaWindow = page.locator('[data-app-id="vela"]');
  await expect(velaWindow).toBeVisible();
  const modelPicker = velaWindow.getByRole('combobox', { name: 'Vela model' });
  await modelPicker.selectOption('llama-4-scout');
  await expect(modelPicker).toHaveValue('llama-4-scout');

  await page.reload();
  await expect(page.locator('[data-app-id="vela"]').getByRole('combobox')).toHaveValue(
    'llama-4-scout',
  );
});

test('system menus expose Nimvelis workflows and keyboard guidance', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Nimvelis menu' }).click();
  await page.getByRole('menuitem', { name: 'About This Device' }).click();
  const about = page.getByRole('dialog', { name: 'Nimvelis Aurora' });
  await expect(about).toBeVisible();
  await expect(about).toContainText('Version 0.8');
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
