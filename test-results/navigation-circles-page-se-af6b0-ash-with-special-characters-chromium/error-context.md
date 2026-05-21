# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> circles page search/filter does not crash with special characters
- Location: tests/navigation.spec.ts:59:1

# Error details

```
Error: locator.fill: Error: strict mode violation: getByPlaceholder(/search/i) resolved to 2 elements:
    1) <input value="" placeholder="Search circles and people…" class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"/> aka getByRole('textbox', { name: 'Search circles and people…' })
    2) <input value="" placeholder="Search by name, location or tag…" class="w-full pl-10 pr-4 h-11 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"/> aka getByRole('textbox', { name: 'Search by name, location or' })

Call log:
  - waiting for getByPlaceholder(/search/i)

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
      - generic [ref=e53]:
        - generic [ref=e54]:
          - paragraph [ref=e55]: Circles
          - heading "Find your circles." [level=1] [ref=e56]
          - paragraph [ref=e57]: From hackathons to hiking clubs — discover the communities that fit you.
        - link "+ Add circle" [ref=e59] [cursor=pointer]:
          - /url: /signup
      - generic [ref=e60]:
        - generic [ref=e61]:
          - img [ref=e62]
          - textbox "Search by name, location or tag…" [ref=e65]
        - generic [ref=e66]:
          - button "All" [ref=e67]
          - button "Technology" [ref=e68]
          - button "Business / Career" [ref=e69]
          - button "International / Cultural Exchange" [ref=e70]
          - button "Sports" [ref=e71]
          - button "Arts" [ref=e72]
          - button "Gaming" [ref=e73]
          - button "Community" [ref=e74]
          - button "Academic" [ref=e75]
          - button "Lifestyle" [ref=e76]
        - generic [ref=e77]:
          - generic [ref=e78]:
            - img
            - combobox [ref=e79]:
              - option "Most relevant"
              - option "Newest" [selected]
              - option "Recently updated"
              - option "A → Z"
              - option "Most members"
          - combobox [ref=e80]:
            - option "All universities" [selected]
            - option "Keio University"
            - option "Korea University"
            - option "No university"
            - option "Tokyo International University"
            - option "Waseda University"
            - option "Yonsei University"
          - combobox [ref=e81]:
            - option "All languages" [selected]
            - option "🇬🇧 English"
            - option "🇯🇵 Japanese"
          - button "✅ Recruiting only" [ref=e82]
      - generic [ref=e83]:
        - article [ref=e84]:
          - link "View UMAMI" [ref=e85] [cursor=pointer]:
            - /url: /circles/umami-0b2d374a
          - generic [ref=e86]:
            - img "UMAMI" [ref=e88]
            - button "Save" [ref=e89]:
              - img [ref=e90]
          - heading "UMAMI" [level=3] [ref=e92]
          - generic [ref=e94]: Technology · 1 members
          - paragraph [ref=e95]: UMAMI is a student organization that breaks language barriers through 'Itadakimasu', creating lifelong friendships through local food experiences and spreading Japanese cuisine to the world.
          - generic [ref=e96]:
            - generic [ref=e97]: Food and Drink
            - generic [ref=e98]: Café
          - generic [ref=e99]:
            - generic [ref=e100]: 🌏 English-friendly
            - generic [ref=e101]: Casual
          - generic [ref=e102]:
            - generic [ref=e103]:
              - link "A asdf" [ref=e104] [cursor=pointer]:
                - /url: /users/asdf
                - generic [ref=e105]: A
                - generic [ref=e106]: asdf
              - generic [ref=e107]: Updated today
            - generic [ref=e108]: View →
        - article [ref=e109]:
          - link "View ITAMAE" [ref=e110] [cursor=pointer]:
            - /url: /circles/itamae-7b27874f
          - generic [ref=e111]:
            - generic [ref=e113]: 💼
            - button "Save" [ref=e114]:
              - img [ref=e115]
          - heading "ITAMAE" [level=3] [ref=e117]
          - generic [ref=e119]: Career · 1 members
          - paragraph [ref=e120]: A student-led entrepreneurship network across Japan, organized around SusHi Tech Tokyo. ITAMAE brings together young innovators to challenge Japan's anti-failure culture and inspire the next generation of founders.
          - generic [ref=e121]:
            - generic [ref=e122]: Computer Science
            - generic [ref=e123]: Robotics and Hardware
            - generic [ref=e124]: Startups
            - generic [ref=e125]: Career and Networking
            - generic [ref=e126]: Science
            - generic [ref=e127]: Engineering
          - generic [ref=e129]: 🌏 English-friendly
          - generic [ref=e130]:
            - generic [ref=e131]:
              - link "Ryan Yuen Ryan Yuen" [ref=e132] [cursor=pointer]:
                - /url: /users/ryany16
                - img "Ryan Yuen" [ref=e134]
                - generic [ref=e135]: Ryan Yuen
              - generic [ref=e136]: Updated 13d ago
            - generic [ref=e137]: View →
        - article [ref=e138]:
          - link "View LinkedIn Student Club Japan" [ref=e139] [cursor=pointer]:
            - /url: /circles/linkedin-student-club-japan-51ba1a7d
          - generic [ref=e140]:
            - generic [ref=e142]: 💼
            - button "Save" [ref=e143]:
              - img [ref=e144]
          - heading "LinkedIn Student Club Japan" [level=3] [ref=e146]
          - generic [ref=e148]: Career · 70 members
          - paragraph [ref=e149]: A student-run ambassador network across Japanese universities helping students use LinkedIn for career development. Organizes LinkedIn Student Career Week and skill-building events. Over 70 active members.
          - generic [ref=e150]:
            - generic [ref=e151]: Startups
            - generic [ref=e152]: Marketing
            - generic [ref=e153]: Career and Networking
          - generic [ref=e154]:
            - generic [ref=e155]: ✅ Recruiting
            - generic [ref=e156]: 🌏 English-friendly
          - generic [ref=e157]:
            - generic [ref=e158]:
              - link "Ryan Yuen Ryan Yuen" [ref=e159] [cursor=pointer]:
                - /url: /users/ryany16
                - img "Ryan Yuen" [ref=e161]
                - generic [ref=e162]: Ryan Yuen
              - generic [ref=e163]: Updated 13d ago
            - generic [ref=e164]: View →
        - article [ref=e165]:
          - link "View Japan Venture Academy" [ref=e166] [cursor=pointer]:
            - /url: /circles/japan-venture-academy-14da1df7
          - generic [ref=e167]:
            - img "Japan Venture Academy" [ref=e169]
            - button "Save" [ref=e170]:
              - img [ref=e171]
          - heading "Japan Venture Academy" [level=3] [ref=e173]
          - generic [ref=e175]: Career · 2 members
          - paragraph [ref=e176]: A student-run org in Tokyo that empowers international students to build, pitch, and launch real tech products. The 3-month JVA Startup Bootcamp features weekly lectures, coaching, and mentorship. Backed by Shibuya Startup Support.
          - generic [ref=e177]:
            - generic [ref=e178]: Computer Science
            - generic [ref=e179]: Hackathons
            - generic [ref=e180]: Startups
            - generic [ref=e181]: Career and Networking
          - generic [ref=e182]:
            - generic [ref=e183]: ✅ Recruiting
            - generic [ref=e184]: 🌏 English-friendly
          - generic [ref=e185]:
            - generic [ref=e186]:
              - link "Ryan Yuen Ryan Yuen" [ref=e187] [cursor=pointer]:
                - /url: /users/ryany16
                - img "Ryan Yuen" [ref=e189]
                - generic [ref=e190]: Ryan Yuen
              - generic [ref=e191]: Updated 13d ago
            - generic [ref=e192]: View →
        - article [ref=e193]:
          - link "View GDGoC Yonsei University" [ref=e194] [cursor=pointer]:
            - /url: /circles/gdgoc-yonsei-university-32448dc6
          - generic [ref=e195]:
            - generic [ref=e197]: 💻
            - button "Save" [ref=e198]:
              - img [ref=e199]
          - heading "GDGoC Yonsei University" [level=3] [ref=e201]
          - generic [ref=e203]: Tech · 1 members
          - paragraph [ref=e204]: Google Developer Group on Campus at Yonsei University (Sinchon Campus). We empower students with the skills to impact the technology landscape through talks, workshops, and cross-border hackathons.
          - generic [ref=e205]:
            - generic [ref=e206]: Computer Science
            - generic [ref=e207]: Data Science and AI
            - generic [ref=e208]: Career and Networking
          - generic [ref=e209]:
            - generic [ref=e210]: ✅ Recruiting
            - generic [ref=e211]: 🌏 English-friendly
          - generic [ref=e212]:
            - generic [ref=e213]:
              - link "Ryan Yuen Ryan Yuen" [ref=e214] [cursor=pointer]:
                - /url: /users/ryany16
                - img "Ryan Yuen" [ref=e216]
                - generic [ref=e217]: Ryan Yuen
              - generic [ref=e218]: Updated 13d ago
            - generic [ref=e219]: View →
        - article [ref=e220]:
          - link "View GDGoC Korea University" [ref=e221] [cursor=pointer]:
            - /url: /circles/gdgoc-korea-university-d534be08
          - generic [ref=e222]:
            - generic [ref=e224]: 💻
            - button "Save" [ref=e225]:
              - img [ref=e226]
          - heading "GDGoC Korea University" [level=3] [ref=e228]
          - generic [ref=e230]: Tech · 1 members
          - paragraph [ref=e231]: Google Developer Group on Campus at Korea University, Seoul. A community of student developers building skills through Google technologies, workshops, and collaborative hackathons.
          - generic [ref=e232]:
            - generic [ref=e233]: Computer Science
            - generic [ref=e234]: Data Science and AI
            - generic [ref=e235]: Career and Networking
          - generic [ref=e236]:
            - generic [ref=e237]: ✅ Recruiting
            - generic [ref=e238]: 🌏 English-friendly
          - generic [ref=e239]:
            - generic [ref=e240]:
              - link "Ryan Yuen Ryan Yuen" [ref=e241] [cursor=pointer]:
                - /url: /users/ryany16
                - img "Ryan Yuen" [ref=e243]
                - generic [ref=e244]: Ryan Yuen
              - generic [ref=e245]: Updated 13d ago
            - generic [ref=e246]: View →
        - article [ref=e247]:
          - link "View TIU Impact Hub" [ref=e248] [cursor=pointer]:
            - /url: /circles/tiu-impact-hub-9f1a1838
          - generic [ref=e249]:
            - img "TIU Impact Hub" [ref=e251]
            - button "Save" [ref=e252]:
              - img [ref=e253]
          - heading "TIU Impact Hub" [level=3] [ref=e255]
          - generic [ref=e257]: Career · 1 members
          - paragraph [ref=e258]: A student-run innovation platform at Tokyo International University that brings Japanese and international students together to build sustainable startups and develop entrepreneurial skills. Partner with Google for Startups Japan and the Tokyo Metropolitan Government.
          - generic [ref=e259]:
            - generic [ref=e260]: Computer Science
            - generic [ref=e261]: Data Science and AI
            - generic [ref=e262]: Hackathons
            - generic [ref=e263]: Startups
            - generic [ref=e264]: Marketing
            - generic [ref=e265]: Content Creation
            - generic [ref=e266]: Career and Networking
          - generic [ref=e267]:
            - generic [ref=e268]: ✅ Recruiting
            - generic [ref=e269]: 🌏 English-friendly
          - generic [ref=e270]:
            - generic [ref=e271]:
              - link "Ryan Yuen Ryan Yuen" [ref=e272] [cursor=pointer]:
                - /url: /users/ryany16
                - img "Ryan Yuen" [ref=e274]
                - generic [ref=e275]: Ryan Yuen
              - generic [ref=e276]: Updated 13d ago
            - generic [ref=e277]: View →
        - article [ref=e278]:
          - link "View Waseda Economics and Finance Forum" [ref=e279] [cursor=pointer]:
            - /url: /circles/waseda-economics-and-finance-forum-2ce50aff
          - generic [ref=e280]:
            - img "Waseda Economics and Finance Forum" [ref=e282]
            - button "Save" [ref=e283]:
              - img [ref=e284]
          - heading "Waseda Economics and Finance Forum" [level=3] [ref=e286]
          - generic [ref=e288]: Career · 1 members
          - paragraph [ref=e289]: Waseda Economics and Finance Forum — the premier economics and finance student organization for international students at Waseda University.
          - generic [ref=e290]:
            - generic [ref=e291]: Consulting
            - generic [ref=e292]: Finance and Economics
            - generic [ref=e293]: Marketing
            - generic [ref=e294]: Career and Networking
          - generic [ref=e296]: 🌏 English-friendly
          - generic [ref=e297]:
            - generic [ref=e298]:
              - link "Ryan Yuen Ryan Yuen" [ref=e299] [cursor=pointer]:
                - /url: /users/ryany16
                - img "Ryan Yuen" [ref=e301]
                - generic [ref=e302]: Ryan Yuen
              - generic [ref=e303]: Updated 13d ago
            - generic [ref=e304]: View →
        - article [ref=e305]:
          - link "View TEDxWasedaU" [ref=e306] [cursor=pointer]:
            - /url: /circles/tedxwasedau-8fb1d95b
          - generic [ref=e307]:
            - generic [ref=e309]: 💻
            - button "Save" [ref=e310]:
              - img [ref=e311]
          - heading "TEDxWasedaU" [level=3] [ref=e313]
          - generic [ref=e315]: Technology · 51 members
          - paragraph [ref=e316]: The first student-organized TEDx at Waseda University and the third in Japan. We produce an annual TEDx conference through Design, Marketing, and Production teams. Founded in 2011.
          - generic [ref=e317]:
            - generic [ref=e318]: Marketing
            - generic [ref=e319]: Content Creation
            - generic [ref=e320]: Career and Networking
            - generic [ref=e321]: Visual Arts and Design
          - generic [ref=e322]:
            - generic [ref=e323]: ✅ Recruiting
            - generic [ref=e324]: 🌏 English-friendly
          - generic [ref=e325]:
            - generic [ref=e326]:
              - link "Ryan Yuen Ryan Yuen" [ref=e327] [cursor=pointer]:
                - /url: /users/ryany16
                - img "Ryan Yuen" [ref=e329]
                - generic [ref=e330]: Ryan Yuen
              - generic [ref=e331]: Updated 13d ago
            - generic [ref=e332]: View →
        - article [ref=e333]:
          - link "View Google Developer Groups on Campus Waseda University" [ref=e334] [cursor=pointer]:
            - /url: /circles/google-developer-groups-on-campus-waseda-university-ed11f4da
          - generic [ref=e335]:
            - img "Google Developer Groups on Campus Waseda University" [ref=e337]
            - button "Save" [ref=e338]:
              - img [ref=e339]
          - heading "Google Developer Groups on Campus Waseda University" [level=3] [ref=e341]
          - generic [ref=e343]: Tech · 4 members
          - paragraph [ref=e344]: Google Developer Group on Campus at Waseda University. We run workshops, hackathons, speaker sessions, and the annual Google Solution Challenge. Open to all universities — no prior coding experience required.
          - generic [ref=e345]:
            - generic [ref=e346]: Computer Science
            - generic [ref=e347]: Data Science and AI
            - generic [ref=e348]: Career and Networking
          - generic [ref=e349]:
            - generic [ref=e350]: ✅ Recruiting
            - generic [ref=e351]: 🌏 English-friendly
            - generic [ref=e352]: Serious
          - generic [ref=e353]:
            - generic [ref=e354]:
              - link "Ryan Yuen Ryan Yuen" [ref=e355] [cursor=pointer]:
                - /url: /users/ryany16
                - img "Ryan Yuen" [ref=e357]
                - generic [ref=e358]: Ryan Yuen
              - generic [ref=e359]: Updated 13d ago
            - generic [ref=e360]: View →
  - contentinfo [ref=e361]:
    - generic [ref=e362]:
      - generic [ref=e363]: © 2026 Konekto
      - generic [ref=e364]:
        - link "Instagram" [ref=e365] [cursor=pointer]:
          - /url: https://www.instagram.com/join.konekto
          - img [ref=e366]
        - link "LinkedIn" [ref=e368] [cursor=pointer]:
          - /url: https://www.linkedin.com/company/joinkonekto
          - img [ref=e369]
        - link "About" [ref=e372] [cursor=pointer]:
          - /url: /about
        - link "Features" [ref=e373] [cursor=pointer]:
          - /url: /features
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | // Navigation and routing — likely failure points:
  4   | // - Handle-based URLs with special characters (Japanese, spaces)
  5   | // - 404 handling for deleted or non-existent posts
  6   | // - Bottom nav active state
  7   | // - Deep-link to a detail page loads correctly
  8   | 
  9   | test("home page loads and shows nav", async ({ page }) => {
  10  |   await page.goto("/");
  11  |   await expect(page.locator("header")).toBeVisible();
  12  |   // Bottom nav on mobile viewport
  13  |   await page.setViewportSize({ width: 390, height: 844 });
  14  |   await expect(page.locator("nav").last()).toBeVisible();
  15  | });
  16  | 
  17  | test("bottom nav Home link is active on /", async ({ page }) => {
  18  |   await page.setViewportSize({ width: 390, height: 844 });
  19  |   await page.goto("/");
  20  |   const homeLink = page.locator("nav a[href='/']").last();
  21  |   await expect(homeLink).toHaveClass(/text-primary/);
  22  | });
  23  | 
  24  | test("bottom nav Circles link is active on /circles", async ({ page }) => {
  25  |   await page.setViewportSize({ width: 390, height: 844 });
  26  |   await page.goto("/circles");
  27  |   const link = page.locator("nav a[href='/circles']").last();
  28  |   await expect(link).toHaveClass(/text-primary/);
  29  | });
  30  | 
  31  | test("navigating to a non-existent circle handle shows 404 or error state", async ({ page }) => {
  32  |   await page.goto("/circles/this-circle-does-not-exist-xyz-999");
  33  |   // Should show 404 page or a 'not found' message — not a blank crash
  34  |   const body = page.locator("body");
  35  |   await expect(
  36  |     body.getByText(/not found|404|doesn't exist|no circle/i)
  37  |       .or(body.getByText(/error/i))
  38  |   ).toBeVisible({ timeout: 10_000 });
  39  | });
  40  | 
  41  | test("navigating to a non-existent event handle shows 404 or error state", async ({ page }) => {
  42  |   await page.goto("/events/fake-event-that-does-not-exist-abc");
  43  |   const body = page.locator("body");
  44  |   await expect(
  45  |     body.getByText(/not found|404|doesn't exist|no event/i)
  46  |       .or(body.getByText(/error/i))
  47  |   ).toBeVisible({ timeout: 10_000 });
  48  | });
  49  | 
  50  | test("navigating to a non-existent deal handle shows 404 or error state", async ({ page }) => {
  51  |   await page.goto("/discounts/fake-deal-xyz-000");
  52  |   const body = page.locator("body");
  53  |   await expect(
  54  |     body.getByText(/not found|404|doesn't exist|no deal/i)
  55  |       .or(body.getByText(/error/i))
  56  |   ).toBeVisible({ timeout: 10_000 });
  57  | });
  58  | 
  59  | test("circles page search/filter does not crash with special characters", async ({ page }) => {
  60  |   await page.goto("/circles");
  61  |   const search = page.getByPlaceholder(/search/i);
  62  |   if (await search.count() > 0) {
> 63  |     await search.fill("テスト!@#$%^&*()");
      |                  ^ Error: locator.fill: Error: strict mode violation: getByPlaceholder(/search/i) resolved to 2 elements:
  64  |     await expect(page.locator("body")).not.toContainText("Something went wrong");
  65  |   }
  66  | });
  67  | 
  68  | test("global search with Japanese characters does not crash", async ({ page }) => {
  69  |   await page.goto("/");
  70  |   const search = page.getByPlaceholder(/search/i).first();
  71  |   await search.fill("日本語");
  72  |   await expect(page.locator("body")).not.toContainText("Something went wrong");
  73  | });
  74  | 
  75  | test("settings page loads without auth (redirects or shows page)", async ({ page }) => {
  76  |   await page.goto("/settings");
  77  |   // Either shows settings or redirects — must not crash
  78  |   await expect(page.locator("body")).not.toContainText("Something went wrong");
  79  |   await expect(page.locator("body")).not.toContainText("TypeError");
  80  | });
  81  | 
  82  | test("about page loads", async ({ page }) => {
  83  |   await page.goto("/about");
  84  |   await expect(page).not.toHaveURL(/404/);
  85  |   await expect(page.locator("header")).toBeVisible();
  86  | });
  87  | 
  88  | test("rapid tab switching does not leave broken state", async ({ page }) => {
  89  |   await page.goto("/circles");
  90  |   await page.goto("/events");
  91  |   await page.goto("/discounts");
  92  |   await page.goto("/circles");
  93  |   await expect(page.locator("body")).not.toContainText("Something went wrong");
  94  |   await expect(page.locator("header")).toBeVisible();
  95  | });
  96  | 
  97  | test("browser back button after visiting a detail page returns to list", async ({ page }) => {
  98  |   await page.goto("/circles");
  99  |   await page.waitForLoadState("networkidle");
  100 |   const firstCircle = page.locator("a[href^='/circles/']").first();
  101 |   if (await firstCircle.count() > 0) {
  102 |     await firstCircle.click();
  103 |     await page.goBack();
  104 |     await expect(page).toHaveURL(/\/circles$/);
  105 |   }
  106 | });
  107 | 
```