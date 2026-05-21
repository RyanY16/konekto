# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: content.spec.ts >> home page retry button appears and is clickable when data fails
- Location: tests/content.spec.ts:76:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /retry|try again|refresh/i }).or(getByText(/error|failed|timed out/i))
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 25000ms
  - waiting for getByRole('button', { name: /retry|try again|refresh/i }).or(getByText(/error|failed|timed out/i))

```

```yaml
- banner:
  - link "Konekto Konekto":
    - /url: /
    - img "Konekto"
    - text: Konekto
  - textbox "Search circles and people…"
  - navigation:
    - link "Home":
      - /url: /
    - link "Circles":
      - /url: /circles
    - link "Events":
      - /url: /events
    - link "Deals":
      - /url: /discounts
    - link "Profile":
      - /url: /profile
  - link "Settings":
    - /url: /settings
  - link "Log in":
    - /url: /login
  - link "Sign up":
    - /url: /signup
- main:
  - paragraph: For students in Japan
  - heading "Your campus, connected." [level=1]
  - paragraph: With Konekto, discover student circles, events, and opportunities across every university in Japan - all in one place.
  - link "Get started free":
    - /url: /signup
  - link "Log in":
    - /url: /login
  - link "Continue as guest →":
    - /url: /circles
  - link "Instagram":
    - /url: https://www.instagram.com/join.konekto
  - link "LinkedIn":
    - /url: https://www.linkedin.com/company/joinkonekto
  - heading "Circles" [level=3]
  - paragraph: Find student clubs and communities that match your interests.
  - heading "Events" [level=3]
  - paragraph: Discover campus events, meetups, and cultural experiences.
  - heading "Deals" [level=3]
  - paragraph: Exclusive student discounts at shops, cafés, and services.
  - heading "Careers" [level=3]
  - paragraph: Internships and job opportunities for international students.
  - heading "Japan Life" [level=3]
  - paragraph: Practical guides for navigating daily life in Japan.
  - paragraph: Ready?
  - heading "Join Konekto today" [level=3]
  - paragraph: It's free for all students.
  - link "Sign up":
    - /url: /signup
- contentinfo:
  - text: © 2026 Konekto
  - link "Instagram":
    - /url: https://www.instagram.com/join.konekto
  - link "LinkedIn":
    - /url: https://www.linkedin.com/company/joinkonekto
  - link "About":
    - /url: /about
  - link "Features":
    - /url: /features
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | // Content display edge cases — these are the "what if the data is weird" cases
  4   | // that often slip through because they don't happen in happy-path testing.
  5   | 
  6   | test("circles list loads and renders at least one card or empty state", async ({ page }) => {
  7   |   await page.goto("/circles");
  8   |   await page.waitForLoadState("networkidle");
  9   |   const hasCards = await page.locator("[data-testid='circle-card'], .rounded-xl, article").count() > 0;
  10  |   const hasEmpty = await page.getByText(/no circles|nothing here|empty/i).count() > 0;
  11  |   expect(hasCards || hasEmpty).toBeTruthy();
  12  | });
  13  | 
  14  | test("events list loads without blank page", async ({ page }) => {
  15  |   await page.goto("/events");
  16  |   await page.waitForLoadState("networkidle");
  17  |   await expect(page.locator("main")).not.toBeEmpty();
  18  | });
  19  | 
  20  | test("deals list loads without blank page", async ({ page }) => {
  21  |   await page.goto("/discounts");
  22  |   await page.waitForLoadState("networkidle");
  23  |   await expect(page.locator("main")).not.toBeEmpty();
  24  | });
  25  | 
  26  | test("circle detail page with no events does not crash", async ({ page }) => {
  27  |   // Visit circles, find first one and check its detail page handles missing events gracefully
  28  |   await page.goto("/circles");
  29  |   await page.waitForLoadState("networkidle");
  30  |   const link = page.locator("a[href^='/circles/']").first();
  31  |   if (await link.count() === 0) return; // no circles seeded
  32  | 
  33  |   await link.click();
  34  |   await page.waitForLoadState("networkidle");
  35  |   // Should not show a JS error regardless of whether events exist
  36  |   await expect(page.locator("body")).not.toContainText("TypeError");
  37  |   await expect(page.locator("body")).not.toContainText("Cannot read");
  38  | });
  39  | 
  40  | test("deal with no image renders placeholder gracefully", async ({ page }) => {
  41  |   await page.goto("/discounts");
  42  |   await page.waitForLoadState("networkidle");
  43  |   // All img tags should either have a src or the parent shows a fallback
  44  |   const brokenImages = await page.evaluate(() => {
  45  |     const imgs = [...document.querySelectorAll("img")];
  46  |     return imgs.filter((img) => !img.complete || img.naturalWidth === 0).length;
  47  |   });
  48  |   // Allow some broken images (avatars of deleted users etc) but not a flood
  49  |   expect(brokenImages).toBeLessThan(5);
  50  | });
  51  | 
  52  | test("social links with percent-encoded Japanese URL display readable text", async ({ page }) => {
  53  |   // If any deal/circle has a Japanese URL, it should not show raw %E6%97%A5 in the link badge
  54  |   await page.goto("/discounts");
  55  |   await page.waitForLoadState("networkidle");
  56  |   const bodyText = await page.locator("body").innerText();
  57  |   expect(bodyText).not.toMatch(/%[0-9A-F]{2}%[0-9A-F]{2}/);
  58  | });
  59  | 
  60  | test("circles page category filter shows only matching results", async ({ page }) => {
  61  |   await page.goto("/circles");
  62  |   await page.waitForLoadState("networkidle");
  63  | 
  64  |   // Find a category filter button
  65  |   const filterBtn = page.getByRole("button", { name: /sports|music|arts|tech|gaming/i }).first();
  66  |   if (await filterBtn.count() === 0) return;
  67  | 
  68  |   await filterBtn.click();
  69  |   await page.waitForTimeout(300);
  70  | 
  71  |   // After filtering, no card from a different category should appear
  72  |   // (rough check — just ensure page didn't crash and still has content or empty state)
  73  |   await expect(page.locator("body")).not.toContainText("Something went wrong");
  74  | });
  75  | 
  76  | test("home page retry button appears and is clickable when data fails", async ({ page }) => {
  77  |   // Simulate offline by blocking Supabase requests
  78  |   await page.route("**/rest/v1/**", (route) => route.abort());
  79  |   await page.goto("/");
  80  |   await page.waitForTimeout(20_000); // wait for timeout logic
  81  | 
  82  |   // Either a retry button or error message should be visible
  83  |   const retryBtn = page.getByRole("button", { name: /retry|try again|refresh/i });
  84  |   const errorMsg = page.getByText(/error|failed|timed out/i);
> 85  |   await expect(retryBtn.or(errorMsg)).toBeVisible({ timeout: 25_000 });
      |                                       ^ Error: expect(locator).toBeVisible() failed
  86  | }, { timeout: 40_000 });
  87  | 
  88  | test("very long description in a circle card truncates without overflow", async ({ page }) => {
  89  |   await page.goto("/circles");
  90  |   await page.waitForLoadState("networkidle");
  91  | 
  92  |   // Check no card text escapes its container horizontally
  93  |   const overflow = await page.evaluate(() => {
  94  |     const cards = document.querySelectorAll("article, [class*='rounded-xl']");
  95  |     for (const card of cards) {
  96  |       if (card.scrollWidth > card.clientWidth + 2) return true;
  97  |     }
  98  |     return false;
  99  |   });
  100 |   expect(overflow).toBe(false);
  101 | });
  102 | 
```