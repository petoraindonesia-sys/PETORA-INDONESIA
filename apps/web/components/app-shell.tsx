"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

const navigation = [
  { href: "#overview", label: "Ringkasan", section: "Workspace", icon: "grid" },
  { href: "#clinic", label: "Klinik hewan", section: "Area kerja", icon: "clinic" },
  { href: "#petshop", label: "Pet shop", section: "Area kerja", icon: "shop" },
  { href: "#organization", label: "Organisasi", section: "Area kerja", icon: "people" },
];

function Brand() {
  return (
    <Link href="/" className="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
      <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-xl bg-accent text-base font-semibold text-white shadow-sm">P</span>
      <span className="text-sm font-semibold tracking-tight text-primary">PETORA <span className="font-normal text-secondary">Indonesia</span></span>
    </Link>
  );
}

function NavigationIcon({ name }: { name: string }) {
  if (name === "grid") return <svg viewBox="0 0 20 20" fill="none" className="size-[18px]"><rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>;
  if (name === "clinic") return <svg viewBox="0 0 20 20" fill="none" className="size-[18px]"><path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><rect x="2.5" y="2.5" width="15" height="15" rx="4" stroke="currentColor" strokeWidth="1.3"/></svg>;
  if (name === "shop") return <svg viewBox="0 0 20 20" fill="none" className="size-[18px]"><path d="M3 7.5h14l-1 9H4l-1-9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="m6 7.5 1.5-4h5l1.5 4M7 11v2m6-2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
  return <svg viewBox="0 0 20 20" fill="none" className="size-[18px]"><circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="14" cy="7" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 16c.3-2.5 2-4 4.5-4s4.2 1.5 4.5 4M12 12c2.8-.4 4.7 1 5.3 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}

function NavigationContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Navigasi workspace" className="grid gap-6">
      {["Workspace", "Area kerja"].map((section) => (
        <div key={section}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-tertiary">{section}</p>
          <ul className="grid gap-1">
            {navigation.filter((item) => item.section === section).map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={item.href === "#overview" ? "location" : undefined}
                  className={[
                    "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors motion-reduce:transition-none",
                    item.href === "#overview"
                      ? "bg-accent-subtle font-semibold text-accent-strong"
                      : "font-medium text-secondary hover:bg-surface-subtle hover:text-primary",
                  ].join(" ")}
                >
                  <span aria-hidden="true" className="flex size-5 items-center justify-center text-current">
                    <NavigationIcon name={item.icon} />
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-primary">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-surface px-4 py-2 text-sm font-semibold text-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:shadow-card">
        Lewati ke konten utama
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface px-5 py-6 lg:flex">
        <Brand />
        <div className="mt-10 flex-1"><NavigationContent /></div>
        <div className="border-t border-border pt-4">
          <p className="px-3 text-xs leading-5 text-secondary">Platform operasional klinik hewan dan pet shop.</p>
        </div>
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-primary/25 lg:hidden" onClick={() => setMenuOpen(false)}>
          <aside
            id="mobile-workspace-navigation"
            className="flex h-full w-[min(19rem,86vw)] flex-col border-r border-border bg-surface px-5 py-6 shadow-2xl"
            aria-label="Menu workspace"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Brand />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Tutup navigasi" className="flex size-10 items-center justify-center rounded-xl text-secondary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-accent">
                <svg viewBox="0 0 20 20" fill="none" className="size-5"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="mt-10 flex-1"><NavigationContent onNavigate={() => setMenuOpen(false)} /></div>
          </aside>
        </div>
      ) : null}

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[4.25rem] items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka navigasi"
              aria-expanded={menuOpen}
              aria-controls="mobile-workspace-navigation"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-secondary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-accent lg:hidden"
            >
              <svg viewBox="0 0 20 20" fill="none" className="size-5"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
            <p className="truncate text-sm font-semibold text-primary">{title}</p>
          </div>
          <span className="hidden text-xs text-secondary sm:block">PETORA Indonesia</span>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
