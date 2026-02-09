import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PWAHandler } from '@/components/layout/PWAHandler';
import { AppShell } from '@/components/layout/AppShell';
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Football Dashboard',
  description: 'Amateur Football Management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FutDashboard',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
        <PWAHandler />
        <Analytics />
      </body>
    </html>
  );
}
