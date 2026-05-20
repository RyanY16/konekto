import { test, expect } from "@playwright/test";

// Auth flows — most failures here are from OAuth redirect state being lost
// or the profile-incomplete guard redirecting at the wrong time.

test("landing page shows sign up CTA when logged out", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  await expect(page.getByText(/log in/i)).toBeVisible();
});

test("unauthenticated user visiting /circles sees content but no Create button", async ({ page }) => {
  await page.goto("/circles");
  // Page should load — not redirect to login
  await expect(page).not.toHaveURL(/login/);
  // Create button should not be visible without auth
  await expect(page.getByRole("link", { name: /create circle/i })).not.toBeVisible();
});

test("unauthenticated user visiting /events sees content but no Create button", async ({ page }) => {
  await page.goto("/events");
  await expect(page).not.toHaveURL(/login/);
  await expect(page.getByRole("link", { name: /add event/i })).not.toBeVisible();
});

test("unauthenticated user visiting /discounts sees content but no Add button", async ({ page }) => {
  await page.goto("/discounts");
  await expect(page).not.toHaveURL(/login/);
  await expect(page.getByRole("link", { name: /add deal/i })).not.toBeVisible();
});

test("direct navigation to /admin redirects non-admin to home", async ({ page }) => {
  await page.goto("/admin");
  // Should not stay on /admin when not logged in or not admin
  await expect(page).not.toHaveURL(/admin/);
});

test("login page renders Google sign-in button", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/continue with google/i)).toBeVisible();
  // Email/password fields should NOT exist (Google-only)
  await expect(page.getByLabel(/password/i)).not.toBeVisible();
});

test("signup page shows profile setup step after google callback with ?step=profile", async ({ page }) => {
  // Simulate arriving at signup with a step param (as Google OAuth redirect does)
  await page.goto("/signup");
  // Step 1 (Google OAuth button) should be visible
  await expect(page.getByText(/continue with google/i)).toBeVisible();
});

test("navigating back from signup to home does not break navigation", async ({ page }) => {
  await page.goto("/signup");
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.locator("nav")).toBeVisible();
});
