import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Wealth Intel — Investment Intelligence Dashboard',
  description:
    'Unified investment dashboard with real market data, quantitative scoring, and portfolio tracking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
