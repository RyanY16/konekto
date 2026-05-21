# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> unauthenticated user visiting /events sees content but no Create button
- Location: tests/auth.spec.ts:20:1

# Error details

```
Error: expect(locator).not.toBeVisible() failed

Locator:  getByRole('link', { name: /add event/i })
Expected: not visible
Received: visible
Timeout:  5000ms

Call log:
  - Expect "not toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: /add event/i })
    14 × locator resolved to <a href="/signup" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">+ Add event</a>
       - unexpected value "visible"

```

```yaml
- link "+ Add event":
  - /url: /signup
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | // Auth flows — most failures here are from OAuth redirect state being lost
  4  | // or the profile-incomplete guard redirecting at the wrong time.
  5  | 
  6  | test("landing page shows sign up CTA when logged out", async ({ page }) => {
  7  |   await page.goto("/");
  8  |   await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  9  |   await expect(page.getByText(/log in/i)).toBeVisible();
  10 | });
  11 | 
  12 | test("unauthenticated user visiting /circles sees content but no Create button", async ({ page }) => {
  13 |   await page.goto("/circles");
  14 |   // Page should load — not redirect to login
  15 |   await expect(page).not.toHaveURL(/login/);
  16 |   // Create button should not be visible without auth
  17 |   await expect(page.getByRole("link", { name: /create circle/i })).not.toBeVisible();
  18 | });
  19 | 
  20 | test("unauthenticated user visiting /events sees content but no Create button", async ({ page }) => {
  21 |   await page.goto("/events");
  22 |   await expect(page).not.toHaveURL(/login/);
> 23 |   await expect(page.getByRole("link", { name: /add event/i })).not.toBeVisible();
     |                                                                    ^ Error: expect(locator).not.toBeVisible() failed
  24 | });
  25 | 
  26 | test("unauthenticated user visiting /discounts sees content but no Add button", async ({ page }) => {
  27 |   await page.goto("/discounts");
  28 |   await expect(page).not.toHaveURL(/login/);
  29 |   await expect(page.getByRole("link", { name: /add deal/i })).not.toBeVisible();
  30 | });
  31 | 
  32 | test("direct navigation to /admin redirects non-admin to home", async ({ page }) => {
  33 |   await page.goto("/admin");
  34 |   // Should not stay on /admin when not logged in or not admin
  35 |   await expect(page).not.toHaveURL(/admin/);
  36 | });
  37 | 
  38 | test("login page renders Google sign-in button", async ({ page }) => {
  39 |   await page.goto("/login");
  40 |   await expect(page.getByText(/continue with google/i)).toBeVisible();
  41 |   // Email/password fields should NOT exist (Google-only)
  42 |   await expect(page.getByLabel(/password/i)).not.toBeVisible();
  43 | });
  44 | 
  45 | test("signup page shows profile setup step after google callback with ?step=profile", async ({ page }) => {
  46 |   // Simulate arriving at signup with a step param (as Google OAuth redirect does)
  47 |   await page.goto("/signup");
  48 |   // Step 1 (Google OAuth button) should be visible
  49 |   await expect(page.getByText(/continue with google/i)).toBeVisible();
  50 | });
  51 | 
  52 | test("navigating back from signup to home does not break navigation", async ({ page }) => {
  53 |   await page.goto("/signup");
  54 |   await page.goto("/");
  55 |   await expect(page).toHaveURL("/");
  56 |   await expect(page.locator("nav")).toBeVisible();
  57 | });
  58 | 
```