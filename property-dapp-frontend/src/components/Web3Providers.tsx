'use client';

import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/web3Config';

interface Web3ProvidersProps {
  children: React.ReactNode;
}

// Create a client
const queryClient = new QueryClient();

export function Web3Providers({ children }: Web3ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        {children}
      </WagmiConfig>
    </QueryClientProvider>
  );
} 