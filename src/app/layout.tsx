import type { Metadata } from "next";
import "./globals.css";
import { AccountProvider } from "@/lib/account";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Plyria",
  description: "Play, create and hang out with friends in Plyria.",
  icons: { icon: "/images/logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AccountProvider>
          <SiteShell>{children}</SiteShell>
        </AccountProvider>
      </body>
    </html>
  );
}
