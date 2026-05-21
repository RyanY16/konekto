# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: forms.spec.ts >> new deal form >> submit with empty required fields shows validation
- Location: tests/forms.spec.ts:9:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /add deal/i })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link "Konekto Konekto" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "Konekto" [ref=e6]
        - generic [ref=e7]: Konekto
      - generic [ref=e10]:
        - img [ref=e11]
        - textbox "Search circles and people…" [ref=e14]
      - generic [ref=e15]:
        - navigation [ref=e16]:
          - link "Home" [ref=e17] [cursor=pointer]:
            - /url: /
            - img [ref=e18]
            - generic [ref=e21]: Home
          - link "Circles" [ref=e22] [cursor=pointer]:
            - /url: /circles
            - img [ref=e23]
            - generic [ref=e28]: Circles
          - link "Events" [ref=e29] [cursor=pointer]:
            - /url: /events
            - img [ref=e30]
            - generic [ref=e32]: Events
          - link "Deals" [ref=e33] [cursor=pointer]:
            - /url: /discounts
            - img [ref=e34]
            - generic [ref=e37]: Deals
          - link "Profile" [ref=e38] [cursor=pointer]:
            - /url: /profile
            - img [ref=e39]
            - generic [ref=e42]: Profile
        - link "Settings" [ref=e43] [cursor=pointer]:
          - /url: /settings
          - img [ref=e44]
        - generic [ref=e48]:
          - link "Log in" [ref=e49] [cursor=pointer]:
            - /url: /login
          - link "Sign up" [ref=e50] [cursor=pointer]:
            - /url: /signup
  - main [ref=e51]:
    - generic [ref=e52]:
      - paragraph [ref=e53]: You need to be signed in to add a deal.
      - link "Sign in" [ref=e54] [cursor=pointer]:
        - /url: /login
  - contentinfo [ref=e55]:
    - generic [ref=e56]:
      - generic [ref=e57]: © 2026 Konekto
      - generic [ref=e58]:
        - link "Instagram" [ref=e59] [cursor=pointer]:
          - /url: https://www.instagram.com/join.konekto
          - img [ref=e60]
        - link "LinkedIn" [ref=e62] [cursor=pointer]:
          - /url: https://www.linkedin.com/company/joinkonekto
          - img [ref=e63]
        - link "About" [ref=e66] [cursor=pointer]:
          - /url: /about
        - link "Features" [ref=e67] [cursor=pointer]:
          - /url: /features
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | // Form validation — these test the hard-coded guard rails before any DB call.
  4   | // Run against the dev server with a logged-in session via storageState if you
  5   | // want to reach the actual submit path; otherwise these test the guest-visible
  6   | // error states and client-side validation.
  7   | 
  8   | test.describe("new deal form", () => {
  9   |   test("submit with empty required fields shows validation", async ({ page }) => {
  10  |     await page.goto("/discounts/new");
  11  |     // Guest gets redirected or sees a sign-in prompt — either is fine
  12  |     const url = page.url();
  13  |     if (url.includes("login") || url.includes("signup")) return;
  14  | 
> 15  |     await page.getByRole("button", { name: /add deal/i }).click();
      |                                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
  16  |     // Brand and title are required — browser validation or inline error
  17  |     await expect(
  18  |       page.getByText(/required|fill|please enter/i).or(page.locator(":invalid"))
  19  |     ).toBeTruthy();
  20  |   });
  21  | 
  22  |   test("profanity in brand name shows error without posting", async ({ page }) => {
  23  |     await page.goto("/discounts/new");
  24  |     if (page.url().includes("login") || page.url().includes("signup")) return;
  25  | 
  26  |     await page.getByLabel(/brand/i).fill("FuckBrand");
  27  |     await page.getByLabel(/title/i).fill("Some deal");
  28  |     await page.getByRole("button", { name: /add deal/i }).click();
  29  |     await expect(page.getByText(/inappropriate language/i)).toBeVisible();
  30  |   });
  31  | 
  32  |   test("sale end date in the past is still accepted by form (edge case)", async ({ page }) => {
  33  |     // The form should not crash when an old date is selected — it's a user mistake
  34  |     // but should fail gracefully (DB can reject it, form shouldn't throw)
  35  |     await page.goto("/discounts/new");
  36  |     if (page.url().includes("login") || page.url().includes("signup")) return;
  37  |     // Just verify the calendar picker opens
  38  |     await page.getByRole("button", { name: /select date/i }).click();
  39  |     await expect(page.locator("[role=dialog]").or(page.locator(".rdp"))).toBeVisible();
  40  |   });
  41  | });
  42  | 
  43  | test.describe("new event form", () => {
  44  |   test("submit without selecting a date shows error", async ({ page }) => {
  45  |     await page.goto("/events/new");
  46  |     if (page.url().includes("login") || page.url().includes("signup")) return;
  47  | 
  48  |     await page.getByLabel(/title/i).fill("Test event");
  49  |     await page.getByRole("button", { name: /add event/i }).click();
  50  |     await expect(page.getByText(/select a date/i)).toBeVisible();
  51  |   });
  52  | 
  53  |   test("weekly event toggle switches form to recurring mode", async ({ page }) => {
  54  |     await page.goto("/events/new");
  55  |     if (page.url().includes("login") || page.url().includes("signup")) return;
  56  | 
  57  |     const toggle = page.getByLabel(/weekly/i).or(page.getByText(/recurring/i));
  58  |     if (await toggle.count() > 0) {
  59  |       await toggle.click();
  60  |       // Day-of-week picker should appear
  61  |       await expect(page.getByText(/monday|tuesday|wednesday/i)).toBeVisible();
  62  |     }
  63  |   });
  64  | 
  65  |   test("profanity in event title is blocked", async ({ page }) => {
  66  |     await page.goto("/events/new");
  67  |     if (page.url().includes("login") || page.url().includes("signup")) return;
  68  | 
  69  |     await page.getByLabel(/title/i).fill("Nazi rally");
  70  |     await page.getByRole("button", { name: /add event/i }).click();
  71  |     await expect(page.getByText(/inappropriate language/i)).toBeVisible();
  72  |   });
  73  | });
  74  | 
  75  | test.describe("new circle form", () => {
  76  |   test("profanity in circle name is blocked by hard censor", async ({ page }) => {
  77  |     await page.goto("/circles/new");
  78  |     if (page.url().includes("login") || page.url().includes("signup")) return;
  79  | 
  80  |     await page.getByLabel(/name/i).fill("Faggot club");
  81  |     await page.getByRole("button", { name: /add circle|create/i }).click();
  82  |     await expect(page.getByText(/inappropriate language/i)).toBeVisible();
  83  |   });
  84  | 
  85  |   test("very long circle name does not crash the form", async ({ page }) => {
  86  |     await page.goto("/circles/new");
  87  |     if (page.url().includes("login") || page.url().includes("signup")) return;
  88  | 
  89  |     await page.getByLabel(/name/i).fill("A".repeat(300));
  90  |     // Should not throw a JS error — form may show validation or trim
  91  |     await expect(page.locator("body")).not.toContainText("Something went wrong");
  92  |   });
  93  | 
  94  |   test("selecting all tags does not break tag picker", async ({ page }) => {
  95  |     await page.goto("/circles/new");
  96  |     if (page.url().includes("login") || page.url().includes("signup")) return;
  97  | 
  98  |     // Click every visible tag
  99  |     const tags = page.locator("button[data-tag], [data-testid='tag']");
  100 |     const count = await tags.count();
  101 |     for (let i = 0; i < Math.min(count, 20); i++) {
  102 |       await tags.nth(i).click();
  103 |     }
  104 |     await expect(page.locator("body")).not.toContainText("Something went wrong");
  105 |   });
  106 | });
  107 | 
```