import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// A confident editorial display face for the hero numbers.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ooze — Find the money oozing out of your accounts",
  description:
    "Upload a bank or card statement and see exactly how much you're silently spending on subscriptions every month — forgotten trials, duplicates, price creep. Statements are processed in-session and never stored.",
  applicationName: "Ooze",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
