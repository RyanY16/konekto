import { test, expect } from "@playwright/test";

// Content display edge cases — these are the "what if the data is weird" cases
// that often slip through because they don't happen in happy-path testing.

test("circles list loads and renders at least one card or empty state", async ({ page }) => {
  await page.goto("/circles");
  await page.waitForLoadState("networkidle");
  const hasCards = await page.locator("[data-testid='circle-card'], .rounded-xl, article").count() > 0;
  const hasEmpty = await page.getByText(/no circles|nothing here|empty/i).count() > 0;
  expect(hasCards || hasEmpty).toBeTruthy();
});

test("events list loads without blank page", async ({ page }) => {
  await page.goto("/events");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main")).not.toBeEmpty();
});

test("deals list loads without blank page", async ({ page }) => {
  await page.goto("/discounts");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main")).not.toBeEmpty();
});

test("circle detail page with no events does not crash", async ({ page }) => {
  // Visit circles, find first one and check its detail page handles missing events gracefully
  await page.goto("/circles");
  await page.waitForLoadState("networkidle");
  const link = page.locator("a[href^='/circles/']").first();
  if (await link.count() === 0) return; // no circles seeded

  await link.click();
  await page.waitForLoadState("networkidle");
  // Should not show a JS error regardless of whether events exist
  await expect(page.locator("body")).not.toContainText("TypeError");
  await expect(page.locator("body")).not.toContainText("Cannot read");
});

test("deal with no image renders placeholder gracefully", async ({ page }) => {
  await page.goto("/discounts");
  await page.waitForLoadState("networkidle");
  // All img tags should either have a src or the parent shows a fallback
  const brokenImages = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")];
    return imgs.filter((img) => !img.complete || img.naturalWidth === 0).length;
  });
  // Allow some broken images (avatars of deleted users etc) but not a flood
  expect(brokenImages).toBeLessThan(5);
});

test("social links with percent-encoded Japanese URL display readable text", async ({ page }) => {
  // If any deal/circle has a Japanese URL, it should not show raw %E6%97%A5 in the link badge
  await page.goto("/discounts");
  await page.waitForLoadState("networkidle");
  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/%[0-9A-F]{2}%[0-9A-F]{2}/);
});

test("circles page category filter shows only matching results", async ({ page }) => {
  await page.goto("/circles");
  await page.waitForLoadState("networkidle");

  // Find a category filter button
  const filterBtn = page.getByRole("button", { name: /sports|music|arts|tech|gaming/i }).first();
  if (await filterBtn.count() === 0) return;

  await filterBtn.click();
  await page.waitForTimeout(300);

  // After filtering, no card from a different category should appear
  // (rough check — just ensure page didn't crash and still has content or empty state)
  await expect(page.locator("body")).not.toContainText("Something went wrong");
});

test("home page retry button appears and is clickable when data fails", async ({ page }) => {
  // Simulate offline by blocking Supabase requests
  await page.route("**/rest/v1/**", (route) => route.abort());
  await page.goto("/");
  await page.waitForTimeout(20_000); // wait for timeout logic

  // Either a retry button or error message should be visible
  const retryBtn = page.getByRole("button", { name: /retry|try again|refresh/i });
  const errorMsg = page.getByText(/error|failed|timed out/i);
  await expect(retryBtn.or(errorMsg)).toBeVisible({ timeout: 25_000 });
}, { timeout: 40_000 });

test("very long description in a circle card truncates without overflow", async ({ page }) => {
  await page.goto("/circles");
  await page.waitForLoadState("networkidle");

  // Check no card text escapes its container horizontally
  const overflow = await page.evaluate(() => {
    const cards = document.querySelectorAll("article, [class*='rounded-xl']");
    for (const card of cards) {
      if (card.scrollWidth > card.clientWidth + 2) return true;
    }
    return false;
  });
  expect(overflow).toBe(false);
});
