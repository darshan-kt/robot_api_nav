// tests/e2e/visual-tracking-lab.spec.ts
import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Validation spec for the Visual Tracking Lab. Confirms every UI state the
 * app's claims depend on is actually reachable — the real vision pipeline
 * producing a detection, the Calibrate<->Track hand-off staging correctly,
 * the STOP-not-search safety behavior firing for real — and captures
 * reference screenshots of both tabs fully expanded.
 *
 * Both CalibratePanel and TrackPanel stay MOUNTED simultaneously across a
 * tab switch (only CSS `hidden` toggles, so CalibratePanel's trackbar state
 * survives switching away and back) — every testid inside a panel is
 * therefore scoped through that panel's own container locator, never
 * queried bare against the page, since both panels' internals share ids.
 */

const consoleErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.goto('/visual-tracking-lab');
  // Header renders the title in a <span>, not a heading role — see
  // src/components/layout/Header.tsx.
  await expect(page.getByText('Visual Tracking Lab').first()).toBeVisible();
});

test.afterEach(() => {
  // Header polls the robot gateway's /health every 5s on every page
  // (pre-existing, unrelated to this feature) — filter that specific,
  // expected noise out and keep the assertion strict for anything else.
  const realErrors = consoleErrors.filter((e) => !e.includes('ERR_CONNECTION_REFUSED'));
  expect(realErrors, `console.error fired during the flow: ${realErrors.join('; ')}`).toEqual([]);
});

const PARAM_KEYS = [
  'hsv_lower',
  'hsv_upper',
  'min_contour_area',
  'centroid_deadzone_px',
  'angular_gain',
  'max_linear_speed',
  'max_angular_speed',
  'target_lost_timeout_sec',
  'publish_debug_image',
];

function calibratePanel(page: Page): Locator {
  return page.getByTestId('calibrate-panel');
}

function trackPanel(page: Page): Locator {
  return page.getByTestId('track-panel');
}

async function expandTrackTab(page: Page): Promise<Locator> {
  await page.getByTestId('tab-track').click();
  const panel = trackPanel(page);
  await panel.getByTestId('params-toggle-color_tracker').click();
  await panel.getByTestId('running-instructions-toggle-color_tracker').click();
  await panel.getByTestId('raw-frame-toggle-color_tracker').click();
  await panel.getByTestId('checkpoints-quiz-toggle-color_tracker').click();
  return panel;
}

test.describe('Calibrate tab', () => {
  test('every expected section is reachable', async ({ page }) => {
    const panel = calibratePanel(page);
    await expect(panel).toBeVisible();

    await expect(panel.getByTestId('datasource-banner-vision')).toContainText('SIMULATED DATA');

    // All six trackbars, matching hsv_calibrator.py's six trackbars.
    for (const suffix of ['lower-h', 'lower-s', 'lower-v', 'upper-h', 'upper-s', 'upper-v']) {
      await expect(panel.getByTestId(`hsv-trackbar-${suffix}`)).toBeVisible();
    }

    await expect(panel.getByTestId('calibrate-camera-preview')).toBeVisible();
    await expect(panel.getByTestId('calibrate-mask-preview')).toBeVisible();
    await expect(panel.getByTestId('copy-to-track-config')).toBeVisible();
  });

  test("the initial mask is solid white — matches hsv_calibrator.py's own trackbar defaults", async ({ page }) => {
    // H min=0/max=179, S min=0/max=255, V min=0/max=255 — the real tool's
    // literal createTrackbar initial values, so the mask starts unfiltered.
    const panel = calibratePanel(page);
    await expect(panel.getByTestId('hsv-trackbar-lower-h')).toHaveValue('0');
    await expect(panel.getByTestId('hsv-trackbar-upper-h')).toHaveValue('179');
    await expect(panel.getByTestId('hsv-trackbar-lower-s')).toHaveValue('0');
    await expect(panel.getByTestId('hsv-trackbar-upper-s')).toHaveValue('255');
  });
});

test.describe('Calibrate -> Track hand-off', () => {
  test('Copy to Track Config stages hsv_lower/hsv_upper — not applied silently', async ({ page }) => {
    const cal = calibratePanel(page);
    await cal.getByTestId('hsv-trackbar-lower-h').fill('5');
    await cal.getByTestId('copy-to-track-config').locator('button').click();

    const track = await expandTrackTab(page);

    const hsvLowerRow = track.getByTestId('param-row-color_tracker-hsv_lower');
    await expect(hsvLowerRow).toContainText('STAGED');

    await track.getByTestId('relaunch-color_tracker').locator('button').click();
    await expect(hsvLowerRow).not.toContainText('STAGED');
  });
});

test.describe('Track tab', () => {
  test('every expected section is reachable, and the pipeline produces a real detection', async ({ page }) => {
    const panel = await expandTrackTab(page);

    await expect(panel).toBeVisible();
    await expect(panel.getByTestId('datasource-banner-vision')).toContainText('SIMULATED DATA');

    for (const key of PARAM_KEYS) {
      await expect(panel.getByTestId(`param-row-color_tracker-${key}`)).toBeVisible();
    }
    // hsv_lower/hsv_upper render via the shared HsvTrackbarGroup atom too.
    await expect(panel.getByTestId('param-hsv-hsv_lower-h')).toBeVisible();

    await expect(panel.getByText('ros2 launch visual_tracking_bot visual_tracking.launch.py')).toBeVisible();

    await expect(panel.getByTestId('pipeline-stages')).toBeVisible();
    for (const stage of ['raw', 'mask', 'contour', 'steering']) {
      await expect(panel.getByTestId(`pipeline-stage-${stage}`)).toBeVisible();
    }

    // The mock's default target is tuned to be captured by the real
    // default calibration — confirms the pipeline is actually computing,
    // not decorative.
    await expect(panel.getByTestId('pipeline-stage-steering')).not.toContainText('No target detected', {
      timeout: 5000,
    });

    await expect(panel.getByTestId('twist-readout')).toBeVisible();
    await expect(panel.getByTestId('robot-sandbox-2d')).toBeVisible();
    await expect(panel.getByTestId('robot-sandbox-disclaimer')).toContainText('not connected to the real robot');

    await expect(panel.getByTestId('raw-frame-json-color_tracker')).toContainText('"sourceKind": "mock"', {
      timeout: 5000,
    });

    await expect(panel.getByText('Why is the HSV calibration tool a separate script')).toBeVisible();
  });
});

test.describe('STOP not search', () => {
  test('hiding the target holds the last command, then hard-stops after the timeout', async ({ page }) => {
    const panel = await expandTrackTab(page);

    // Let the pipeline lock onto the target first.
    await expect(panel.getByTestId('twist-readout')).toContainText('0.120', { timeout: 5000 });

    await panel.getByTestId('target-lost-toggle').locator('button').click();

    // Grace period: countdown visible, no WARN yet.
    await expect(panel.getByTestId('target-lost-countdown')).toBeVisible();

    // Past the default 1.0s timeout.
    await expect(panel.getByTestId('target-lost-warn-log')).toContainText('publishing STOP, not searching', {
      timeout: 5000,
    });
    await expect(panel.getByTestId('twist-readout')).toContainText('0.000');
  });
});

test.describe('Source kind switch', () => {
  test('switching to webcam without camera permission shows an error and reverts to mock', async ({ page }) => {
    await page.getByTestId('source-kind-option-webcam').click();

    // No camera permission granted in this CI browser context ->
    // requestAccess() fails -> SourceKindSwitch reverts and shows the
    // reason via toast.
    await expect(page.getByTestId('source-kind-option-mock')).toHaveClass(/text-blue-400/, { timeout: 5000 });
    await expect(calibratePanel(page).getByTestId('datasource-banner-vision')).toContainText('SIMULATED DATA');
  });

  test('the live option is visibly disabled — reserved, not selectable', async ({ page }) => {
    await expect(page.getByTestId('source-kind-option-live')).toBeDisabled();
  });
});

test('full-page and per-tab screenshots, both fully expanded', async ({ page }) => {
  await expect(calibratePanel(page).getByTestId('datasource-banner-vision')).toContainText('SIMULATED DATA');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests/e2e/__screenshots__/visual-tracking-lab-calibrate-expanded.png' });

  await expandTrackTab(page);
  await page.waitForTimeout(400); // let the pipeline lock on and canvases paint
  await page.screenshot({
    path: 'tests/e2e/__screenshots__/visual-tracking-lab-track-expanded.png',
    fullPage: true,
  });

  await page.screenshot({
    path: 'tests/e2e/__screenshots__/visual-tracking-lab-full-page.png',
    fullPage: true,
  });
});
