import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { getSettings } from "@/lib/services/settings";
import "./globals.css";

const sans = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });

export const dynamic = "force-dynamic"; // every page is data-driven; never serve a stale build-time snapshot

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.name} — Events & Volunteering`, template: `%s · ${s.name}` },
    description: s.tagline,
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1F5D45" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable}`}
      suppressHydrationWarning
      style={{ "--brand": s.primaryColor, "--accent": s.accentColor } as React.CSSProperties}
    >
      <head>
        {/* Enables scroll-reveal only when JS runs, so content is never hidden for no-JS or crawlers. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
