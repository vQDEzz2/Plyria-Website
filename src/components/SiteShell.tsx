"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "@/lib/account";

const AUTH_PAGES = ["/login", "/signup", "/forgot"];
const PUBLIC_PAGES = ["/download"]; // open to everyone, logged in or not
const NAV = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/create", label: "Create" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/avatar", label: "Avatar" },
  { href: "/friends", label: "Friends" },
];

// Classic spinning logo while loading, like the old game loading screens.
export function LoadingScreen() {
  return (
    <div className="brand-backdrop flex min-h-screen flex-col items-center justify-center gap-3 text-white">
      <Image src="/images/logo.png" alt="" width={72} height={72} className="animate-logo-spin" priority />
      <span className="animate-fade-in text-lg font-bold">Loading...</span>
    </div>
  );
}

// Header, nav bar and content box. Also used by /dev/shell to preview the look without logging in.
export function ShellFrame({
  displayName,
  userId,
  plyrium,
  children,
}: {
  displayName: string;
  userId: string;
  plyrium: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="site-header flex h-16 items-center gap-3 px-4 sm:px-10">
        <Link href="/" aria-label="Plyria home" className="transition-transform duration-200 hover:-rotate-2 hover:scale-105">
          <Image src="/images/title.png" alt="Plyria" width={130} height={52} priority />
        </Link>
        <div className="flex-1" />
        <Link href={`/users/${userId}`} className="hidden text-sm font-bold text-white hover:underline sm:block">
          Hi, {displayName}
        </Link>
        <Link href="/plyrium" className="header-pill">
          <Image src="/images/plyrium.png" alt="Plyrium" width={20} height={20} />
          <span className="text-[15px] font-bold">{plyrium.toLocaleString()}</span>
        </Link>
        <Link href="/download" className="hidden text-sm font-bold text-white hover:underline sm:block">
          Download
        </Link>
        <Link href="/settings" className="text-sm font-bold text-white hover:underline">
          Settings
        </Link>
      </header>

      <nav className="site-nav flex overflow-x-auto px-4 sm:px-10">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`nav-link ${active ? "nav-link-active" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="mx-auto mt-5 w-full max-w-[1100px] px-4 sm:px-0">
        {/* Keyed by page, so each page fades in when you navigate. */}
        <div key={pathname} className="content-box">
          {children}
        </div>
      </main>
      <footer className="my-6 text-center text-xs text-[#6f6680]">Plyria | Prototype build | Not affiliated with Roblox</footer>
    </div>
  );
}

// Sends logged-out visitors to the login page.
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  const pathname = usePathname();
  const router = useRouter();
  const authPage = AUTH_PAGES.includes(pathname);
  const devPage = pathname.startsWith("/dev/");
  const publicPage = PUBLIC_PAGES.includes(pathname);

  useEffect(() => {
    if (!account.ready) return;
    if (devPage && process.env.NODE_ENV === "production") return router.replace("/");
    if (devPage || publicPage) return;
    if (!account.session && !authPage) router.replace("/login");
    if (account.session && authPage) router.replace("/");
  }, [account.ready, account.session, authPage, devPage, publicPage, router]);

  if (devPage) return process.env.NODE_ENV === "production" ? null : children;

  if (authPage) {
    return <div className="brand-backdrop flex min-h-screen items-center justify-center px-4 py-8">{children}</div>;
  }

  // Public pages bring their own content box, so they skip the header and nav even when logged in.
  if (publicPage) {
    return <div className="brand-backdrop flex min-h-screen items-center justify-center px-4 py-8">{children}</div>;
  }

  if (!account.ready || !account.session || (!account.data && !account.error)) return <LoadingScreen />;

  return (
    <ShellFrame displayName={account.displayName} userId={account.userId} plyrium={account.data?.plyrium ?? 0}>
      {account.error ? (
        <div>
          <h1 className="h1">Something went wrong</h1>
          <p className="muted mb-3">{account.error}</p>
          <button className="btn" onClick={() => account.refresh()}>
            Try Again
          </button>
        </div>
      ) : (
        children
      )}
    </ShellFrame>
  );
}
