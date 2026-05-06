import { createRootRoute, HeadContent, Link, Scripts } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Konekto — Your campus, connected." },
      {
        name: "description",
        content:
          "Konekto is the all-in-one hub for university students in Japan: circles, events, deals, careers, and life essentials.",
      },
      { property: "og:title", content: "Konekto — Your campus, connected." },
      {
        property: "og:description",
        content: "Find your circles. Everything you need as a student in Japan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Konekto — Your campus, connected." },
      { name: "description", content: "Konekto is an all-in-one web hub for university students in Japan, connecting them to circles, events, deals, careers, and life resources." },
      { property: "og:description", content: "Konekto is an all-in-one web hub for university students in Japan, connecting them to circles, events, deals, careers, and life resources." },
      { name: "twitter:description", content: "Konekto is an all-in-one web hub for university students in Japan, connecting them to circles, events, deals, careers, and life resources." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5c96c6de-8ad2-49b2-8048-2d254b4e44bc/id-preview-fb6dcaf7--e4f7c4ac-92cf-4b4b-8478-ab1f1094910a.lovable.app-1777597583274.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5c96c6de-8ad2-49b2-8048-2d254b4e44bc/id-preview-fb6dcaf7--e4f7c4ac-92cf-4b4b-8478-ab1f1094910a.lovable.app-1777597583274.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/logo-icon-blue.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/logo-icon-blue.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: AppShell,
  notFoundComponent: NotFoundComponent,
});

const themeScript = `
(function(){
  var t=localStorage.getItem('konekto-theme');
  var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(t==='dark'||(t!=='light'&&prefersDark)){document.documentElement.classList.add('dark');}
  var c=localStorage.getItem('konekto-color');
  if(c!=='default'){document.documentElement.classList.add('scheme-blue');}
})();
`.trim();

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
