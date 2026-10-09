import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./v2-theme.css";
import { WorkspaceProvider } from "@/lib/v2/workspace";
import { Toaster } from "@/components/ui/sonner";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Learn2Earn — Support Menu & Stipend Operations",
  description: "Take only the support you need. Zero tuition upfront. Choose onsite or online.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <WorkspaceProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </WorkspaceProvider>
      </body>
    </html>
  );
}
