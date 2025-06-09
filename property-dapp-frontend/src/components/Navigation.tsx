'use client';

import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from './ui/button';

export function Navigation() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const metaMaskConnector = connectors[0];

  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold neon-text">PropertyDApp</span>
          </Link>
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/properties" className="text-sm font-medium hover:text-primary transition-colors">
              Properties
            </Link>
            {address?.toLowerCase() === "YOUR_NOTARY_ADDRESS" && (
              <Link href="/notary" className="text-sm font-medium hover:text-primary transition-colors">
                Notary Panel
              </Link>
            )}
          </div>
        </div>
        
        {isConnected ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <Button
              variant="outline"
              className="neon-border"
              onClick={() => disconnect()}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button 
            className="neon-border bg-primary hover:bg-primary/80"
            onClick={() => connect({ connector: metaMaskConnector })}
          >
            Connect MetaMask
          </Button>
        )}
      </div>
    </nav>
  );
} 