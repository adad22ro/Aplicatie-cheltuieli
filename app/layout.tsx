import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

// Nunito — sans-serif cald și rotund, potrivit direcției „prietenos" (DESIGN.md §4).
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gospodărie — finanțe",
  description: "Evidența veniturilor și cheltuielilor gospodăriei.",
  applicationName: "Gospodărie",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gospodărie",
  },
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2db3a6",
};

/**
 * Script inline anti-flash: setează clasa `.dark` pe <html> ÎNAINTE de randare, pe
 * baza preferinței salvate (localStorage) sau a setării sistemului. Evită „licărirea"
 * temei la încărcare. Comutatorul complet (Luminos/Întunecat/Sistem) vine în Setări.
 */
const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${nunito.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
