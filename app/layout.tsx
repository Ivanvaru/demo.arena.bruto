import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://arena-brutos-demo.ivanvaru.chatgpt.site"),
  title: "Liga de Brutos — Demo",
  description: "Crea tu bruto, conoce a tu rival y contempla el combate.",
  openGraph: {
    title: "Liga de Brutos",
    description: "Crea tu bruto, conoce a tu rival y contempla el combate.",
    images: [{ url: "/og.jpg", width: 1200, height: 675, alt: "Logo de Liga de Brutos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Liga de Brutos",
    description: "Crea tu bruto, conoce a tu rival y contempla el combate.",
    images: ["/og.jpg"],
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/brand/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
