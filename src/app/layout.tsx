import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aguara — Business Control Tower",
  description: "Panel de control de negocios para e-commerce",
};

// ─── Viewport correcto para mobile-first ────────────────────────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // NO desactivamos el zoom para accesibilidad
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-white text-[#0f0f12] antialiased overflow-x-hidden`}>
        <ToastProvider>
          <ErrorBoundary>
            <Sidebar />
            {/*
              Mobile: sin margen izquierdo (sidebar es drawer)
              Desktop (lg+): ml-[220px] para el sidebar fijo
              Padding-bottom en mobile para el bottom nav (h-16)
            */}
            <main className="lg:ml-[220px] min-h-dvh pb-16 lg:pb-0">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}
