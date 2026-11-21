"use client";

import {
  HeartPulse,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/AuthProvider";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

// গাঢ় teal পটভূমিতে বসে, তাই লেখা সাদা
function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
        <HeartPulse className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-white">Doctor Tracker</span>
        <span className="block text-xs text-brand-200">Care Guide BD</span>
      </span>
    </Link>
  );
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        // /doctors/view ও "Doctors" হিসেবে চিহ্নিত হবে
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              active ? "bg-white/15 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// লগইন করা ব্যবহারকারীর নাম, email ও Logout বোতাম
function AccountBox() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async (): Promise<void> => {
    setLoggingOut(true);
    try {
      // সফল হলে guard নিজেই login পাতায় নিয়ে যায়
      await logout();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setLoggingOut(false);
    }
  };

  return (
    <div className="border-t border-white/10 pt-4">
      <div className="mb-3 px-1">
        <p className="truncate text-sm font-medium text-white">{user?.name}</p>
        <p className="truncate text-xs text-brand-200">{user?.email}</p>
      </div>
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
        aria-busy={loggingOut || undefined}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogOut className="h-4 w-4" aria-hidden="true" />
        )}
        Log out
      </button>
    </div>
  );
}

// ডেস্কটপে বাঁ পাশে sidebar, মোবাইলে উপরে বার + স্লাইড মেনু
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // পাতা বদলালে মোবাইল মেনু বন্ধ
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // মেনু খোলা থাকলে Esc চাপলে বন্ধ
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* ডেস্কটপ sidebar (গাঢ় teal) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-900 px-4 py-5 lg:flex">
        <div className="mb-8 px-1">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
        <div className="mt-auto">
          <AccountBox />
        </div>
      </aside>

      {/* মোবাইল উপরের বার */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-brand-900 px-4 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="rounded-lg p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </header>

      {/* মোবাইল স্লাইড মেনু */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-brand-900 px-4 py-5 shadow-xl">
            <div className="mb-8 flex items-center justify-between px-1">
              <Brand />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <NavLinks pathname={pathname} />
            <div className="mt-auto">
              <AccountBox />
            </div>
          </div>
        </div>
      )}

      <main id="main-content" className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
