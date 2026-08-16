import { test, expect } from "@playwright/test";

function collectConsoleIssues(page: import("@playwright/test").Page) {
  const issues: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") issues.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => issues.push(`pageerror: ${err.message}`));
  return issues;
}

test("main routes load without console errors", async ({ page }) => {
  const issues = collectConsoleIssues(page);

  for (const hash of ["/", "/#/practice", "/#/how-to-play", "/#/stats", "/#/settings", "/#/duel"]) {
    await page.goto(hash);
    await page.waitForTimeout(300);
  }

  expect(issues, issues.join("\n")).toEqual([]);
});

test("unknown hash route does not blank-screen", async ({ page }) => {
  const issues = collectConsoleIssues(page);
  await page.goto("/#/this-route-does-not-exist");
  await page.waitForTimeout(300);
  // App shell should still be present (HashRouter with no matching Route
  // renders nothing for the <Routes>, but the document should not be
  // completely empty/crashed).
  const bodyLength = await page.evaluate(() => document.body.innerHTML.length);
  expect(bodyLength).toBeGreaterThan(0);
  expect(issues, issues.join("\n")).toEqual([]);
});

test("direct URL into practice/session with no navigation state defaults to quick practice, not a blank screen", async ({ page }) => {
  const issues = collectConsoleIssues(page);
  await page.goto("/#/practice/session");
  await expect(page.getByText(/ROUND 1\//)).toBeVisible({ timeout: 5000 });
  expect(issues, issues.join("\n")).toEqual([]);
});

// Regression test for a real bug found during exploratory QA: submitting a
// correct answer with Enter silently skipped the result screen entirely
// (100% of the time, not just on a held key). CodeMirror's Enter keybinding
// called preventDefault() but never stopped the event from bubbling past
// the editor; React mounts the result screen's own global "Enter to
// continue" window listener fast enough that it catches the tail of the
// very same physical keydown that just submitted, instantly dismissing a
// screen the player never got to see. Fixed by setting
// `stopPropagation: true` on the editor's submit keybinding (XPathEditor.tsx)
// plus an `e.repeat` guard on the result/intro screens' listeners
// (RoundResult.tsx, RoundIntro.tsx) as defense-in-depth for a held key once
// focus has moved off the editor.
test("quick practice: submitting the correct answer with Enter shows the result screen, and a held Enter does not blow through it", async ({ page }) => {
  const issues = collectConsoleIssues(page);
  await page.goto("/#/practice/session");

  await expect(page.getByText(/Press Enter or click to begin/)).toBeVisible({ timeout: 5000 });
  await page.keyboard.press("Enter");

  // Find the target's data-xa-id by brute-forcing candidate ids against the
  // app's own live evaluation feedback — this is exactly what a black-box
  // player interaction looks like, just automated, with no insider
  // knowledge of the generator's target.
  const frame = page.frameLocator('iframe[title="Simulated website"]');
  const ids = await frame.locator("[data-xa-id]").evaluateAll((els) => els.map((e) => e.getAttribute("data-xa-id")));
  expect(ids.length).toBeGreaterThan(0);

  await page.locator(".cm-content").click();

  let solved = false;
  for (const id of ids) {
    await page.keyboard.press("Control+A");
    await page.keyboard.insertText(`//*[@data-xa-id='${id}']`);
    if (await page.getByText("TARGET LOCKED").isVisible().catch(() => false)) {
      solved = true;
      break;
    }
  }
  test.skip(!solved, "this generated challenge has a multi-node target — brute-force-by-id can't solve it, skip");

  // A single, real Enter keydown submits.
  await page.keyboard.down("Enter");
  await page.waitForTimeout(100);

  // The result screen must actually be visible — this is the core
  // regression: previously this single keydown submitted AND immediately
  // dismissed the result screen in one go.
  await expect(page.getByText(/Target Locked|Round Failed|Time's Up/)).toBeVisible();
  await expect(page.getByText(/ROUND 2\//)).not.toBeVisible();

  // Now simulate held-key OS auto-repeat events on top, before releasing —
  // these must also be ignored, not just the first keydown.
  await page.evaluate(() => {
    const target = document.activeElement ?? window;
    for (let i = 0; i < 5; i++) {
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, repeat: true }));
    }
  });
  await page.keyboard.up("Enter");
  await page.waitForTimeout(100);

  await expect(page.getByText(/Target Locked|Round Failed|Time's Up/)).toBeVisible();
  await expect(page.getByText(/ROUND 2\//)).not.toBeVisible();

  expect(issues, issues.join("\n")).toEqual([]);
});
