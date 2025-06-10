'use client';

import { useEffect, useState } from 'react';
import { Web3Providers } from './Web3Providers';
import { Navigation } from './Navigation';
import { Toaster } from 'sonner';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Web3Providers>
      {mounted && <Navigation />}
      <main style={{ minHeight: '100vh' }}>
        {mounted ? children : null}
      </main>
      <Toaster position="top-right" />
    </Web3Providers>
  );
} 