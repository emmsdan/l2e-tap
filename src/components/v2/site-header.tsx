import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
    return (
        <header className="site-header">
            <div className="site-width">
                <Link href="/" aria-label="Learn2Earn home" className="flex items-center">
                    <Image src="/logo.svg" alt="Learn2Earn" width={104} height={40} className="brand-logo" priority />
                </Link>
                <nav>
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard">My dashboard</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">Get started</Link>
                    </Button>
                    {/* <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                        <Link href="/v1">V1 Portal</Link>
                    </Button> */}
                </nav>
            </div>
        </header>
    );
}

export function SiteFooter() {
    return (
        <footer className="site-footer">
            <div className="site-width">
                <div className="flex items-center gap-3">
                    <Image src="/logo.svg" alt="Learn2Earn" width={104} height={40} className="brand-logo" />
                </div>
                <span>Learn now. Earn your future.</span>
                <div className="flex items-center gap-4">
                    <Link href="/v1" className="hover:underline">
                        Switch to v1
                    </Link>
                    <span>© 2026 Learn2Earn</span>
                </div>
            </div>
        </footer>
    );
}

