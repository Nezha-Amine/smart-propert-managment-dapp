'use client';

import { WagmiConfig } from 'wagmi';
import { config } from '@/lib/web3Config';

interface Web3ProvidersProps {
  children: React.ReactNode;
}

export function Web3Providers({ children }: Web3ProvidersProps) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>;
} 