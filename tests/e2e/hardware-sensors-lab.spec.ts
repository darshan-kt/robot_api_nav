// tests/e2e/hardware-sensors-lab.spec.ts
import { test, expect, type Page } from '@playwright/test';

/**
 * Validation spec for the Hardware & Sensors Lab. Confirms every UI state
 * the SIMULATED DATA promise depends on is actually reachable — not just
 * that the components compile — and captures reference screenshots of both
 * device cards fully expanded, per the feature's original ask.
 */

const consoleErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.goto('/hardware-sensors-lab');
  // Header renders the title in a <span>, not a heading role — see src/components/layout/Header.tsx.
  await expect(page.getByText('Hardware & Sensors Lab').first()).toBeVisible();
});

test.afterEach(() => {
  // Header polls the robot gateway's /health every 5s on every page
  // (pre-existing, unrelated to this feature) — filter that specific,
  // expected noise out and keep the assertion strict for anything else.
  const realErrors = consoleErrors.filter((e) => !e.includes('ERR_CONNECTION_REFUSED'));
  expect(realErrors, `console.error fired during the flow: ${realErrors.join('; ')}`).toEqual([]);
});

async function expandCard(page: Page, deviceId: string) {
  const card = page.getByTestId(`device-card-${deviceId}`);
  await expect(card).toBeVisible();

  await card.getByTestId(`params-toggle-${deviceId}`).click();
  await card.getByTestId(`running-instructions-toggle-${deviceId}`).click();
  await card.getByRole('button', { name: 'Start Live View' }).click();
  await card.getByTestId(`raw-frame-toggle-${deviceId}`).click();

  return card;
}

test.describe('RPLIDAR A2 card', () => {
  test('every expected section is reachable', async ({ page }) => {
    const card = await expandCard(page, 'rplidar_a2');

    // Parameters — the load-bearing one.
    await expect(card.getByTestId('param-row-rplidar_a2-serial_baudrate')).toBeVisible();

    // Running instructions — the real, course-verified command.
    await expect(card).toContainText('ros2 launch rplidar_ros view_rplidar_a2m8_launch.py');

    // Honesty banner.
    await expect(card.getByTestId('datasource-banner-rplidar_a2')).toContainText('SIMULATED DATA');

    // Live visualization actually rendered.
    await expect(card.getByTestId('lidar-polar-dial')).toBeVisible();

    // Raw frame inspector shows a real mock-tagged frame once streaming.
    await page.waitForTimeout(200); // let at least one tick land
    await expect(card.getByTestId('raw-frame-json-rplidar_a2')).toContainText('"sourceKind": "mock"');
  });

  test('baud mismatch demo: wrong config shows the real diagnostic string', async ({ page }) => {
    const card = page.getByTestId('device-card-rplidar_a2');
    await card.getByTestId('baud-demo-launch-select-rplidar_a2').selectOption('a2m7');
    await card.getByTestId('baud-demo-start-rplidar_a2').click();

    await expect(card.getByTestId('baud-demo-result-rplidar_a2')).toContainText(
      'Error, operation time out. SL_RESULT_OPERATION_TIMEOUT!',
      { timeout: 3000 }
    );

    await page.screenshot({ path: 'tests/e2e/__screenshots__/rplidar-baud-mismatch-error.png' });
  });

  test('baud mismatch demo: matching config succeeds', async ({ page }) => {
    const card = page.getByTestId('device-card-rplidar_a2');
    await card.getByTestId('baud-demo-launch-select-rplidar_a2').selectOption('a2m8');
    await card.getByTestId('baud-demo-start-rplidar_a2').click();

    await expect(card.getByTestId('baud-demo-result-rplidar_a2')).toContainText(
      '/scan publishing',
      { timeout: 3000 }
    );

    await page.screenshot({ path: 'tests/e2e/__screenshots__/rplidar-baud-mismatch-success.png' });
  });
});

test.describe('Astra Pro card', () => {
  test('every expected section is reachable', async ({ page }) => {
    const card = await expandCard(page, 'astra_pro');

    await expect(card.getByTestId('param-row-astra_pro-depth_registration')).toBeVisible();
    await expect(card).toContainText('ros2 launch astra_camera astra_pro.launch.xml');
    await expect(card.getByTestId('datasource-banner-astra_pro')).toContainText('SIMULATED DATA');
    await expect(card.getByTestId('depth-rgb-dual-view')).toBeVisible();

    await page.waitForTimeout(200);
    await expect(card.getByTestId('raw-frame-json-astra_pro')).toContainText('"sourceKind": "mock"');
  });

  test('depth_registration toggle visibly changes the overlay both ways', async ({ page }) => {
    const card = page.getByTestId('device-card-astra_pro');
    await card.getByRole('button', { name: 'Start Live View' }).click();
    await page.waitForTimeout(150);

    const toggle = card.getByTestId('depth-registration-toggle-astra_pro');

    // Default is false (matches the real driver's own default) — misaligned state.
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(card).toContainText('Misaligned');
    await expect(card).toContainText('actual default');
    await page.screenshot({
      path: 'tests/e2e/__screenshots__/astra-depth-registration-off.png',
    });

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(card.getByText('depth_registration: true')).toBeVisible();
    await page.screenshot({
      path: 'tests/e2e/__screenshots__/astra-depth-registration-on.png',
    });

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(card.getByText('depth_registration: false')).toBeVisible();
  });
});

test('full-page screenshots of both cards fully expanded', async ({ page }) => {
  await expandCard(page, 'rplidar_a2');
  await expandCard(page, 'astra_pro');
  await page.waitForTimeout(300); // let both live streams tick at least once

  await page.getByTestId('device-card-rplidar_a2').screenshot({
    path: 'tests/e2e/__screenshots__/rplidar-full-expanded.png',
  });
  await page.getByTestId('device-card-astra_pro').screenshot({
    path: 'tests/e2e/__screenshots__/astra-full-expanded.png',
  });
  await page.screenshot({
    path: 'tests/e2e/__screenshots__/hardware-sensors-lab-full-page.png',
    fullPage: true,
  });
});
