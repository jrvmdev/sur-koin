import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sur-Koin | Radar Cripto Venezuela",
  description: "Cotización USDT/VES en tiempo real y mercado cripto global",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="
        min-h-screen
        bg-slate-900
        text-slate-200
        antialiased
      ">
        {children}
      </body>
    </html>
  );
}