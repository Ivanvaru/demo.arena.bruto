import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liga de Brutos — Demo",
  description: "Crea tu bruto, conoce a tu rival y contempla el combate.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
