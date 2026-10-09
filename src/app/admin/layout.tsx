"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, Users, LayoutGrid, Building2, Nfc } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_TABS = [
  { href: "/admin", label: "Overview", icon: BarChart3, exact: true },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/services", label: "Services", icon: LayoutGrid },
  { href: "/admin/facilities", label: "Facilities", icon: Building2 },
  { href: "/admin/readers", label: "Card readers", icon: Nfc },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <header className="border-b bg-background">
        <div className="admin-width flex justify-between items-center py-3">
          <Link href="/" className="flex gap-3 items-center">
            <Image src="/logo.svg" alt="Learn2Earn" width={104} height={40} className="brand-logo" />
            <span className="admin-badge">Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">Student view</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/v1">V1 Portal</Link>
            </Button>
          </div>
        </div>
        <nav className="admin-width overflow-x-auto flex gap-1">
          {NAV_TABS.map((n: any) => {
            const isActive = n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`admin-tab ${isActive ? "active" : ""}`}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="admin-width py-10">{children}</main>
    </div>
  );
}
