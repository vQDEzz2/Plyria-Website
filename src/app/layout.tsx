import type { Metadata } from "next";
import "./globals.css";
import { AccountProvider } from "@/lib/account";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Plyria",
  description: "Play, create and hang out with friends in Plyria.",
  // favicon.ico (src/app) is linked automatically. Google Search shows an icon 48x48 or larger.
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/logo.png", sizes: "256x256", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
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
