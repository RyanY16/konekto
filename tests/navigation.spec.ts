import { test, expect } from "@playwright/test";

// Navigation and routing — likely failure points:
// - Handle-based URLs with special characters (Japanese, spaces)
// - 404 handling for deleted or non-existent posts
// - Bottom nav active state
// - Deep-link to a detail page loads correctly

test("home page loads and shows nav", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header")).toBeVisible();
  // Bottom nav on mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("nav").last()).toBeVisible();
});

test("bottom nav Home link is active on /", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const homeLink = page.locator("nav a[href='/']").last();
  await expect(homeLink).toHaveClass(/text-primary/);
});

test("bottom nav Circles link is active on /circles", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/circles");
  const link = page.locator("nav a[href='/circles']").last();
  await expect(link).toHaveClass(/text-primary/);
});

test("navigating to a non-existent circle handle shows 404 or error state", async ({ page }) => {
  await page.goto("/circles/this-circle-does-not-exist-xyz-999");
  // Should show 404 page or a 'not found' message — not a blank crash
  const body = page.locator("body");
  await expect(
    body.getByText(/not found|404|doesn't exist|no circle/i)
      .or(body.getByText(/error/i))
  ).toBeVisible({ timeout: 10_000 });
});

test("navigating to a non-existent event handle shows 404 or error state", async ({ page }) => {
  await page.goto("/events/fake-event-that-does-not-exist-abc");
  const body = page.locator("body");
  await expect(
    body.getByText(/not found|404|doesn't exist|no event/i)
      .or(body.getByText(/error/i))
  ).toBeVisible({ timeout: 10_000 });
});

test("navigating to a non-existent deal handle shows 404 or error state", async ({ page }) => {
  await page.goto("/discounts/fake-deal-xyz-000");
  const body = page.locator("body");
  await expect(
    body.getByText(/not found|404|doesn't exist|no deal/i)
      .or(body.getByText(/error/i))
  ).toBeVisible({ timeout: 10_000 });
});

test("circles page search/filter does not crash with special characters", async ({ page }) => {
  await page.goto("/circles");
  const search = page.getByPlaceholder(/search/i);
  if (await search.count() > 0) {
    await search.fill("テスト!@#$%^&*()");
    await expect(page.locator("body")).not.toContainText("Something went wrong");
  }
});

test("global search with Japanese characters does not crash", async ({ page }) => {
  await page.goto("/");
  const search = page.getByPlaceholder(/search/i).first();
  await search.fill("日本語");
  await expect(page.locator("body")).not.toContainText("Something went wrong");
});

test("settings page loads without auth (redirects or shows page)", async ({ page }) => {
  await page.goto("/settings");
  // Either shows settings or redirects — must not crash
  await expect(page.locator("body")).not.toContainText("Something went wrong");
  await expect(page.locator("body")).not.toContainText("TypeError");
});

test("about page loads", async ({ page }) => {
  await page.goto("/about");
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator("header")).toBeVisible();
});

test("rapid tab switching does not leave broken state", async ({ page }) => {
  await page.goto("/circles");
  await page.goto("/events");
  await page.goto("/discounts");
  await page.goto("/circles");
  await expect(page.locator("body")).not.toContainText("Something went wrong");
  await expect(page.locator("header")).toBeVisible();
});

test("browser back button after visiting a detail page returns to list", async ({ page }) => {
  await page.goto("/circles");
  await page.waitForLoadState("networkidle");
  const firstCircle = page.locator("a[href^='/circles/']").first();
  if (await firstCircle.count() > 0) {
    await firstCircle.click();
    await page.goBack();
    await expect(page).toHaveURL(/\/circles$/);
  }
});
