import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Web3Providers } from '@/components/providers/Web3Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PropertyDApp',
  description: 'Decentralized Property Management Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
