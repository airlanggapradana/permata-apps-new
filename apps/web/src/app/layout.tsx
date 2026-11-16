import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
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
    "Mendampingi kesiapsiagaan darurat, Psychological First Aid (PFA), dan pertumbuhan pascatrauma (Post-Traumatic Growth) melalui kearifan lokal Aceh dan Minangkabau yang berakar kasih.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`scroll-smooth ${inter.variable} ${plusJakartaSans.variable}`}
      data-culture="aceh"
      suppressHydrationWarning
    >
      <body
        className="bg-canvas text-fg antialiased selection:bg-action selection:text-white"
        suppressHydrationWarning
      >
        <CultureProvider>
          <AuthProvider>
            <ThemedContent>{children}</ThemedContent>
          </AuthProvider>
        </CultureProvider>
      </body>
    </html>
  );
}
