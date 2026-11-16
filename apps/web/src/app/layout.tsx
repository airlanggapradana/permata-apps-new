import type { Metadata } from "next";
import "./globals.css";
import { CultureProvider } from "@/context/CultureContext";
import { AuthProvider } from "@/context/AuthContext";
import ThemedContent from "@/components/ThemedContent";

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
    <html lang="id" className="scroll-smooth" data-culture="aceh" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="bg-[#F8FAF8] text-slate-800 antialiased selection:bg-brand-500 selection:text-white" suppressHydrationWarning>
        <CultureProvider>
          <AuthProvider>
            <ThemedContent>{children}</ThemedContent>
          </AuthProvider>
        </CultureProvider>
      </body>
    </html>
  );
}
