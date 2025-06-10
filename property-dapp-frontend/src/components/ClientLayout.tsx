'use client';

import { Web3Providers } from './Web3Providers';
import { Navigation } from './Navigation';
import { Toaster } from 'sonner';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <Web3Providers>
      <Navigation />
      <main className="min-h-screen">
        {children}
      </main>
      <Toaster position="top-right" />
    </Web3Providers>
  );
} 