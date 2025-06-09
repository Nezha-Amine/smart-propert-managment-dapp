'use client';

import { WagmiConfig } from 'wagmi';
import { config } from '@/lib/web3Config';
import { useEffect, useState } from 'react';

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <WagmiConfig config={config}>
      {children}
    </WagmiConfig>
  );
} 