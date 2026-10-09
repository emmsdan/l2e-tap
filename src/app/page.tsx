"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, CreditCard, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/v2/site-header";
import { money, getServiceIcon } from "@/lib/v2/support";
import { useWorkspace } from "@/lib/v2/workspace";

export default function Home() {
  const { data } = useWorkspace();
  const liveServices = data.catalog.filter((c) => !c.archived);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="home-hero">
          <div className="model-badge">
            <Sparkles size={16} />
            New operating model — support is now a menu, not a package
          </div>
          <h1>
            TAKE ONLY THE<span>SUPPORT YOU NEED</span>
          </h1>
          <p>
            Zero tuition upfront. Choose onsite or online, tell us what you need — a laptop, meals, a desk, a bed, a
            ride — and we subscribe you to exactly that. Change it any month.
          </p>
          <div className="hero-actions">
            <Button size="lg" asChild>
              <Link href="/register">
                Start registration <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard">View student dashboard</Link>
            </Button>
          </div>
        </section>

        <section className="stat-band">
          <div className="site-width stat-grid">
            {[
              ["₦150,000", "Monthly stipend"],
              [liveServices.length ? String(liveServices.length) : "Live", "Support services"],
              ["Any month", "Cancel or resume"],
              ["1 card", "Tap for hub, bus, meals"],
            ].map(([a, b]) => (
              <div key={a}>
                <strong>{a}</strong>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="support-section">
          <div className="site-width">
            <h2>The support menu</h2>
            <p className="section-caption">
              Every service you take is billed monthly against your stipend. Take less, keep more.
            </p>
            <div className="service-grid">
              {liveServices.map((s) => {
                const Icon = getServiceIcon(s.id || s.name);
                return (
                  <article className="service-card" key={s.id}>
                    <div className="service-icon">
                      <Icon />
                    </div>
                    <h3>{s.name}</h3>
                    <p>{s.description}</p>
                    <div className="service-price">
                      {money(s.price)}
                      <small>/mo</small>
                    </div>
                  </article>
                );
              })}
              {!liveServices.length && (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  Loading live service menu…
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="feature-band">
          <div className="site-width feature-grid">
            {[
              {
                icon: ToggleLeft,
                title: "Subscribe like a product",
                text: "Turn any service off when you no longer need it and back on when you do. Your balance updates instantly.",
              },
              {
                icon: CreditCard,
                title: "One NFC card",
                text: "Your student card opens the learning hub, pays for the shuttle and picks up your meals.",
              },
              {
                icon: Sparkles,
                title: "See the true cost",
                text: "Track exactly what your training has cost month by month, so you graduate knowing your number.",
              },
            ].map((f) => (
              <div key={f.title}>
                <div className="feature-icon">
                  <f.icon size={20} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
