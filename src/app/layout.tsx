import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PWAHandler } from '@/components/layout/PWAHandler';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Football Dashboard',
  description: 'Amateur Football Management',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
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
  themeColor: '#0f172a',
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
      </body>
    </html>
  );
}
