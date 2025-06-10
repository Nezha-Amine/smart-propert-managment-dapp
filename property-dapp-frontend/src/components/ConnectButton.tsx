'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from './ui/button';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline">
        Loading...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ 
          fontSize: '14px', 
          color: '#6b7280',
          fontFamily: 'monospace'
        }}>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button
          variant="outline"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  const metaMaskConnector = connectors[0];

  return (
    <Button 
      onClick={() => connect({ connector: metaMaskConnector })}
    >
      Connect Wallet
    </Button>
  );
} 