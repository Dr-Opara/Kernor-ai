"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#apply", label: "Apply" },
  { href: "#live", label: "Live" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
];

export default function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="marketing-nav">
      <div className="marketing-nav-inner shell">
        <Link href="/" className="marketing-wordmark">ODYSSEUS</Link>

        <nav className="marketing-nav-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>

        <div className="marketing-nav-actions">
          <Link className="btn btn-secondary" href="/login">Sign In</Link>
          <Link className="btn btn-primary" href="/onboarding">Get Started →</Link>
        </div>

        <button
          type="button"
          className="marketing-nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open ? (
        <div className="marketing-nav-mobile-panel shell">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="marketing-nav-mobile-actions">
            <Link className="btn btn-secondary" href="/login" onClick={() => setOpen(false)}>
              Sign In
            </Link>
            <Link className="btn btn-primary" href="/onboarding" onClick={() => setOpen(false)}>
              Get Started →
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
