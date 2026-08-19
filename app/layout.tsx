import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arena de Brutos — Demo",
  description: "Demo privada de un combate automático entre dos luchadores.",
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
