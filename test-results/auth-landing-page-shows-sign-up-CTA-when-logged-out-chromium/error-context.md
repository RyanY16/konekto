# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> landing page shows sign up CTA when logged out
- Location: tests/auth.spec.ts:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: /sign up/i })
Expected: visible
Error: strict mode violation: getByRole('link', { name: /sign up/i }) resolved to 2 elements:
    1) <a href="/signup" class="px-2.5 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap">Sign up</a> aka getByRole('banner').getByRole('link', { name: 'Sign up' })
    2) <a href="/signup" class="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-white/20 hover:bg-white/30 px-4 py-2 text-sm font-semibold transition-colors">…</a> aka getByRole('main').getByRole('link', { name: 'Sign up' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: /sign up/i })

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
    - generic [ref=e53]:
      - generic [ref=e54]:
        - paragraph [ref=e55]:
          - img [ref=e56]
          - text: For students in Japan
        - heading "Your campus, connected." [level=1] [ref=e59]:
          - text: Your campus,
          - text: connected.
        - paragraph [ref=e60]: With Konekto, discover student circles, events, and opportunities across every university in Japan - all in one place.
        - generic [ref=e61]:
          - link "Get started free" [ref=e62] [cursor=pointer]:
            - /url: /signup
            - text: Get started free
            - img [ref=e63]
          - link "Log in" [ref=e65] [cursor=pointer]:
            - /url: /login
        - link "Continue as guest →" [ref=e67] [cursor=pointer]:
          - /url: /circles
        - generic [ref=e68]:
          - link "Instagram" [ref=e69] [cursor=pointer]:
            - /url: https://www.instagram.com/join.konekto
            - img [ref=e70]
          - link "LinkedIn" [ref=e72] [cursor=pointer]:
            - /url: https://www.linkedin.com/company/joinkonekto
            - img [ref=e73]
      - generic [ref=e76]:
        - generic [ref=e77]:
          - img [ref=e79]
          - heading "Circles" [level=3] [ref=e84]
          - paragraph [ref=e85]: Find student clubs and communities that match your interests.
        - generic [ref=e86]:
          - img [ref=e88]
          - heading "Events" [level=3] [ref=e90]
          - paragraph [ref=e91]: Discover campus events, meetups, and cultural experiences.
        - generic [ref=e92]:
          - img [ref=e94]
          - heading "Deals" [level=3] [ref=e97]
          - paragraph [ref=e98]: Exclusive student discounts at shops, cafés, and services.
        - generic [ref=e99]:
          - img [ref=e101]
          - heading "Careers" [level=3] [ref=e104]
          - paragraph [ref=e105]: Internships and job opportunities for international students.
        - generic [ref=e106]:
          - img [ref=e108]
          - heading "Japan Life" [level=3] [ref=e111]
          - paragraph [ref=e112]: Practical guides for navigating daily life in Japan.
        - generic [ref=e113]:
          - generic [ref=e114]:
            - paragraph [ref=e115]: Ready?
            - heading "Join Konekto today" [level=3] [ref=e116]
            - paragraph [ref=e117]: It's free for all students.
          - link "Sign up" [ref=e118] [cursor=pointer]:
            - /url: /signup
            - text: Sign up
            - img [ref=e119]
  - contentinfo [ref=e121]:
    - generic [ref=e122]:
      - generic [ref=e123]: © 2026 Konekto
      - generic [ref=e124]:
        - link "Instagram" [ref=e125] [cursor=pointer]:
          - /url: https://www.instagram.com/join.konekto
          - img [ref=e126]
        - link "LinkedIn" [ref=e128] [cursor=pointer]:
          - /url: https://www.linkedin.com/company/joinkonekto
          - img [ref=e129]
        - link "About" [ref=e132] [cursor=pointer]:
          - /url: /about
        - link "Features" [ref=e133] [cursor=pointer]:
          - /url: /features
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
> 8  |   await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
     |                                                              ^ Error: expect(locator).toBeVisible() failed
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
  23 |   await expect(page.getByRole("link", { name: /add event/i })).not.toBeVisible();
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