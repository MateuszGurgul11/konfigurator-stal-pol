"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts", label: "Słupki" },
  { href: "/admin/panels", label: "Panele" },
  { href: "/admin/textures", label: "Tekstury" },
  { href: "/admin/elements", label: "Elementy" },
  { href: "/admin/spacers", label: "Dystanse" },
  { href: "/admin/heights", label: "Wysokości" },
  { href: "/admin/colors", label: "Kolory" },
  { href: "/admin/footing-heights", label: "Podmur. wys." },
  { href: "/admin/footing-materials", label: "Podmur. mat." },
  { href: "/admin/pricing", label: "Wycena" },
];

export function AdminNav() {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-[#e5e7eb] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-heading flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9ca3af] transition-colors hover:text-[#e30311]"
          >
            <span className="text-[#e30311]">←</span>
            <span className="hidden sm:inline">Konfigurator</span>
          </Link>
          <div className="mr-1 h-4 w-px bg-[#e5e7eb]" />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] lg:hidden"
            aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="ml-auto flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-xs text-[#9ca3af] sm:inline">
                {user.email}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] hover:text-[#303638]"
              onClick={() => logout()}
            >
              Wyloguj
            </Button>
          </div>
        </div>

        <div className="mt-2 hidden flex-wrap items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
                pathname === link.href
                  ? "bg-[#e30311] text-white"
                  : "text-[#6b7280] hover:bg-[#f4f5f5] hover:text-[#303638]",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {menuOpen && (
          <div className="mt-3 grid grid-cols-2 gap-1 border-t border-[#e5e7eb] pt-3 lg:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
                  pathname === link.href
                    ? "bg-[#e30311] text-white"
                    : "text-[#6b7280] hover:bg-[#f4f5f5] hover:text-[#303638]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
