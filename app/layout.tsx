import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { RouteProgress } from "@/components/ui/route-progress";
import "./globals.css";

export const metadata: Metadata = {
  title: "POSGRAM Belajar",
  description: "Misi belajar personal berbasis checkpoint."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
