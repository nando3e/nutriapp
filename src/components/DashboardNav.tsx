"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

type User = { id?: string; email?: string | null; role?: string };

const navLinks = [
  { href: "/dashboard", label: "Hoy" },
  { href: "/dashboard/summary", label: "Resumen" },
  { href: "/dashboard/foods", label: "Alimentos" },
  { href: "/dashboard/activities", label: "Actividades" },
  { href: "/dashboard/profile", label: "Perfil" },
] as const;

export function DashboardNav({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: horizontal nav */}
      <nav className="hidden md:flex items-center gap-3 flex-wrap justify-end">
        {navLinks.map(({ href, label }) => {
          const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm py-2 px-1 transition-colors ${isActive ? "text-amber-400 font-medium" : "text-white/60 hover:text-white"}`}
            >
              {label}
            </Link>
          );
        })}
        {user?.role === "superadmin" && (
          <Link
            href="/dashboard/admin"
            className="text-accent-orange hover:opacity-90 text-sm py-2 px-1"
          >
            Admin
          </Link>
        )}
        <span
          className="text-white/50 text-sm max-w-[140px] truncate py-2"
          title={user?.email ?? ""}
        >
          {user?.email}
        </span>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-white/50 hover:text-white text-sm py-2 px-1"
        >
          Salir
        </button>
      </nav>

      {/* Mobile: hamburger + dropdown */}
      <div className="md:hidden relative flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06]"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-20 bg-black/40"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-4 top-full mt-2 z-30 w-[min(280px,calc(100vw-2rem))] rounded-2xl border border-white/[0.08] bg-dark-bg shadow-xl py-2">
              {navLinks.map(({ href, label }) => {
                const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`block py-3 px-4 text-sm transition-colors ${isActive ? "text-amber-400 font-medium bg-white/[0.04]" : "text-white/80 hover:text-white hover:bg-white/[0.06]"}`}
                  >
                    {label}
                  </Link>
                );
              })}
              {user?.role === "superadmin" && (
                <Link
                  href="/dashboard/admin"
                  onClick={() => setOpen(false)}
                  className="block py-3 px-4 text-accent-orange hover:opacity-90 text-sm"
                >
                  Admin
                </Link>
              )}
              <div className="border-t border-white/[0.06] mt-2 pt-2 px-4">
                <p className="text-white/50 text-xs truncate" title={user?.email ?? ""}>
                  {user?.email}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="text-white/50 hover:text-white text-sm mt-1"
                >
                  Salir
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
