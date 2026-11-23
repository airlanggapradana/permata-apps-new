import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { CultureProvider } from "@/context/CultureContext";
import { AuthProvider } from "@/context/AuthContext";
import ThemedContent from "@/components/ThemedContent";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PERMATA Nusantara | Ekosistem Resiliensi & PFA Ramah Anak Pascabencana",
  description:
    "Mendampingi kesiapsiagaan darurat, Psychological First Aid (PFA), dan pertumbuhan pascatrauma (Post-Traumatic Growth) melalui kearifan lokal Aceh dan Kalimantan yang berakar kasih.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b4332",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cultureCookie = cookieStore.get("culture")?.value;
  const initialCulture =
    cultureCookie === "kalimantan" ? "kalimantan" : "aceh";

  return (
    <html
      lang="id"
      className={`scroll-smooth ${inter.variable} ${plusJakartaSans.variable}`}
      data-culture={initialCulture}
      suppressHydrationWarning
    >
      <body
        className="bg-canvas text-fg antialiased selection:bg-action selection:text-white"
        suppressHydrationWarning
      >
        <CultureProvider initialCulture={initialCulture}>
          <AuthProvider>
            <ThemedContent>{children}</ThemedContent>
          </AuthProvider>
        </CultureProvider>
        <Analytics />
      </body>
    </html>
  );
}
