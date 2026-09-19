"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";

const AUTH_PAGES = ["/login", "/signup", "/forgot"];
const PUBLIC_PAGES = ["/download"]; // open to everyone, logged in or not
const NAV = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/create", label: "Create" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/earn", label: "Earn Plyrium" },
  { href: "/avatar", label: "Avatar" },
  { href: "/friends", label: "Friends" },
];

const ICONS: Record<string, string> = {
  Home: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z",
  Games: "M7 6h10l4 12-3 2-4-4h-4l-4 4-3-2ZM6 11h6m-3-3v6m7-3h2",
  Create: "M12 3v18M3 12h18",
  Marketplace: "M4 9h16l-1 12H5ZM8 9V6a4 4 0 0 1 8 0v3",
  "Earn Plyrium": "m12 2 9 10-9 10L3 12Zm0 5 4 5-4 5-4-5Z",
  Avatar: "M8 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM4 22v-5a8 8 0 0 1 16 0v5",
  Friends: "M3 21v-4a6 6 0 0 1 12 0v4m3-10a5 5 0 0 1 4 5v5M5 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0m11-3a4 4 0 0 1 0 7",
};

// Classic spinning logo while loading, like the old game loading screens. If loading drags on, offers a way out.
export function LoadingScreen({ onLogOut }: { onLogOut?: () => void }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="brand-backdrop flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center text-white">
      <Image src="/images/logo.png" alt="" width={72} height={72} className="animate-logo-spin" priority />
      <span className="animate-fade-in text-lg font-bold">Loading...</span>
      {slow && onLogOut && (
        <div className="animate-fade-in text-sm">
          <p className="mb-2">This is taking a while. A browser extension may be blocking Plyria, or your saved login may have expired.</p>
          <button className="btn" onClick={onLogOut}>
            Log Out and Try Again
          </button>
        </div>
      )}
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
    <div className="site-layout">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="site-header app-header">
        <Link href="/" aria-label="Plyria home" className="transition-transform duration-200 hover:-rotate-2 hover:scale-105">
          <Image src="/images/title.png" alt="Plyria" width={130} height={52} priority />
        </Link>
        <nav aria-label="Explore" className="header-explore">
          <Link href="/games">Games</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/create">Create</Link>
        </nav>
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

      <aside className="app-sidebar">
        <Link href={`/users/${userId}`} className="sidebar-profile">
          <span className="profile-initial" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0"><strong className="block truncate">{displayName}</strong><span className="muted">View profile</span></span>
        </Link>
      <nav aria-label="Main navigation" className="sidebar-nav">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[item.label]} /></svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
        <div className="sidebar-bottom"><Link href="/download" className="btn btn-primary w-full">Download Plyria</Link><p className="muted mt-2 text-center">Build. Play. Make friends.</p></div>
      </aside>

      <main id="main-content" tabIndex={-1} className="app-main">
        {/* Keyed by page, so each page fades in when you navigate. */}
        <div key={pathname} className="content-box app-content">
          {children}
        </div>
      </main>
      <footer className="app-footer">Plyria | Prototype build | Not affiliated with Roblox</footer>
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

  const logOutAndRetry = () => {
    account.logOut();
    router.replace("/login");
  };

  if (!account.ready || !account.session || (!account.data && !account.error)) return <LoadingScreen onLogOut={logOutAndRetry} />;

  return (
    <ShellFrame displayName={account.displayName} userId={account.userId} plyrium={account.data?.plyrium ?? 0}>
      {account.error ? (
        <div>
          <h1 className="h1">Something went wrong</h1>
          <p className="muted mb-3">{account.error}</p>
          <div className="flex gap-1.5">
            <button className="btn btn-primary" onClick={() => account.refresh()}>
              Try Again
            </button>
            <button className="btn" onClick={logOutAndRetry}>
              Log Out
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </ShellFrame>
  );
}
