'use client';

import { Toaster } from 'sonner';
import { Navigation } from '@/components/Navigation';
import { Web3Providers } from '@/components/providers/Web3Providers';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3Providers>
      <Navigation />
      {children}
      <Toaster />
    </Web3Providers>
  );
} 