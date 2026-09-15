"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "@/lib/account";

const AUTH_PAGES = ["/login", "/signup", "/forgot"];
const NAV = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/create", label: "Create" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/avatar", label: "Avatar" },
  { href: "/friends", label: "Friends" },
];

// Header, nav bar and content box. Sends logged-out visitors to the login page.
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  const pathname = usePathname();
  const router = useRouter();
  const authPage = AUTH_PAGES.includes(pathname);

  useEffect(() => {
    if (!account.ready) return;
    if (!account.session && !authPage) router.replace("/login");
    if (account.session && authPage) router.replace("/");
  }, [account.ready, account.session, authPage, router]);

  if (authPage) {
    return <div className="flex min-h-screen items-center justify-center bg-brand px-4 py-8">{children}</div>;
  }

  if (!account.ready || !account.session || (!account.data && !account.error)) {
    return <div className="flex min-h-screen items-center justify-center bg-brand text-lg font-bold text-white">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center gap-3 border-b border-brand-dark bg-brand px-4 sm:px-10">
        <Link href="/" aria-label="Plyria home">
          <Image src="/images/title.png" alt="Plyria" width={130} height={52} priority />
        </Link>
        <div className="flex-1" />
        <Link href={`/users/${account.userId}`} className="hidden text-sm font-bold text-white hover:underline sm:block">
          Hi, {account.displayName}
        </Link>
        <Link
          href="/plyrium"
          className="flex items-center gap-1.5 rounded-[3px] border border-[#064a85] bg-brand-dark px-2.5 py-1 hover:bg-[#0a63b0]"
        >
          <Image src="/images/plyrium.png" alt="Plyrium" width={20} height={20} />
          <span className="text-[15px] font-bold text-white">{(account.data?.plyrium ?? 0).toLocaleString()}</span>
        </Link>
        <Link href="/settings" className="text-sm font-bold text-white hover:underline">
          Settings
        </Link>
      </header>

      <nav className="flex overflow-x-auto border-b-2 border-[#022b54] bg-nav px-4 sm:px-10">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-9 shrink-0 items-center border-r border-nav-hover px-[18px] text-[15px] font-bold text-white hover:bg-nav-hover ${
                active ? "bg-brand hover:bg-brand" : ""
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="mx-auto mt-5 w-full max-w-[1100px] px-4 sm:px-0">
        <div className="border border-[#c3c3c3] bg-white px-4 py-5 sm:px-6">
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
        </div>
      </main>
      <footer className="my-6 text-center text-xs text-[#777777]">Plyria | Prototype build | Not affiliated with Roblox</footer>
    </div>
  );
}
