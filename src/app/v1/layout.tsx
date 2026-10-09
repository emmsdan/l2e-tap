import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/l2e/AppShell";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "L2E Campus Operations",
  description: "Learn to Earn roster, subscriptions, payroll and gate access dashboard.",
  icons: {
    icon: "/logo.svg",
    shortcut: '/logo.svg',
    apple: '/logo.svg',
    other: [
      {
        url: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
