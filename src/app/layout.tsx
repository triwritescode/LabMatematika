import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "LabMatematika",
  title: "LabMatematika — Latih, uji, kuasai.",
  description:
    "Latihan berhitung berbasis deliberate practice untuk anak SD. Diagnostik, latihan terarah, ujian kenaikan level.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LabMatematika",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom left enabled for accessibility (WCAG 1.4.4). Portrait is enforced
  // via the manifest's `orientation`, not by blocking the user from zooming.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
