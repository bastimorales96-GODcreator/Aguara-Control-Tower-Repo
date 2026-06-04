import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aguara — Business Control Tower",
  description: "Panel de control de negocios para e-commerce",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#080d14] text-white antialiased`}>
        <Sidebar />
        <main className="ml-[220px] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
