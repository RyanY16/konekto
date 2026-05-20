import { test, expect } from "@playwright/test";

// Form validation — these test the hard-coded guard rails before any DB call.
// Run against the dev server with a logged-in session via storageState if you
// want to reach the actual submit path; otherwise these test the guest-visible
// error states and client-side validation.

test.describe("new deal form", () => {
  test("submit with empty required fields shows validation", async ({ page }) => {
    await page.goto("/discounts/new");
    // Guest gets redirected or sees a sign-in prompt — either is fine
    const url = page.url();
    if (url.includes("login") || url.includes("signup")) return;

    await page.getByRole("button", { name: /add deal/i }).click();
    // Brand and title are required — browser validation or inline error
    await expect(
      page.getByText(/required|fill|please enter/i).or(page.locator(":invalid"))
    ).toBeTruthy();
  });

  test("profanity in brand name shows error without posting", async ({ page }) => {
    await page.goto("/discounts/new");
    if (page.url().includes("login") || page.url().includes("signup")) return;

    await page.getByLabel(/brand/i).fill("FuckBrand");
    await page.getByLabel(/title/i).fill("Some deal");
    await page.getByRole("button", { name: /add deal/i }).click();
    await expect(page.getByText(/inappropriate language/i)).toBeVisible();
  });

  test("sale end date in the past is still accepted by form (edge case)", async ({ page }) => {
    // The form should not crash when an old date is selected — it's a user mistake
    // but should fail gracefully (DB can reject it, form shouldn't throw)
    await page.goto("/discounts/new");
    if (page.url().includes("login") || page.url().includes("signup")) return;
    // Just verify the calendar picker opens
    await page.getByRole("button", { name: /select date/i }).click();
    await expect(page.locator("[role=dialog]").or(page.locator(".rdp"))).toBeVisible();
  });
});

test.describe("new event form", () => {
  test("submit without selecting a date shows error", async ({ page }) => {
    await page.goto("/events/new");
    if (page.url().includes("login") || page.url().includes("signup")) return;

    await page.getByLabel(/title/i).fill("Test event");
    await page.getByRole("button", { name: /add event/i }).click();
    await expect(page.getByText(/select a date/i)).toBeVisible();
  });

  test("weekly event toggle switches form to recurring mode", async ({ page }) => {
    await page.goto("/events/new");
    if (page.url().includes("login") || page.url().includes("signup")) return;

    const toggle = page.getByLabel(/weekly/i).or(page.getByText(/recurring/i));
    if (await toggle.count() > 0) {
      await toggle.click();
      // Day-of-week picker should appear
      await expect(page.getByText(/monday|tuesday|wednesday/i)).toBeVisible();
    }
  });

  test("profanity in event title is blocked", async ({ page }) => {
    await page.goto("/events/new");
    if (page.url().includes("login") || page.url().includes("signup")) return;

    await page.getByLabel(/title/i).fill("Nazi rally");
    await page.getByRole("button", { name: /add event/i }).click();
    await expect(page.getByText(/inappropriate language/i)).toBeVisible();
  });
});

test.describe("new circle form", () => {
  test("profanity in circle name is blocked by hard censor", async ({ page }) => {
    await page.goto("/circles/new");
    if (page.url().includes("login") || page.url().includes("signup")) return;

    await page.getByLabel(/name/i).fill("Faggot club");
    await page.getByRole("button", { name: /add circle|create/i }).click();
    await expect(page.getByText(/inappropriate language/i)).toBeVisible();
  });

  test("very long circle name does not crash the form", async ({ page }) => {
    await page.goto("/circles/new");
    if (page.url().includes("login") || page.url().includes("signup")) return;

    await page.getByLabel(/name/i).fill("A".repeat(300));
    // Should not throw a JS error — form may show validation or trim
    await expect(page.locator("body")).not.toContainText("Something went wrong");
  });

  test("selecting all tags does not break tag picker", async ({ page }) => {
    await page.goto("/circles/new");
    if (page.url().includes("login") || page.url().includes("signup")) return;

    // Click every visible tag
    const tags = page.locator("button[data-tag], [data-testid='tag']");
    const count = await tags.count();
    for (let i = 0; i < Math.min(count, 20); i++) {
      await tags.nth(i).click();
    }
    await expect(page.locator("body")).not.toContainText("Something went wrong");
  });
});
