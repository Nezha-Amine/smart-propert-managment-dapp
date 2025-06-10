'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useContractRead, useConnect, useDisconnect } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';
import { Button } from './ui/button';

export function Navigation() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Check if current user is notary
  const { data: notaryAddress } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'notary',
  });

  const isNotary = address && notaryAddress && address.toLowerCase() === notaryAddress.toLowerCase();
  const metaMaskConnector = connectors[0];

  return (
    <nav className="border-b mb-4">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <Link
              href="/properties"
              className={`text-lg font-medium ${
                pathname === '/properties' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Properties
            </Link>
            {isNotary && (
              <Link
                href="/notary"
                className={`text-lg font-medium ${
                  pathname === '/notary' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Notary Dashboard
              </Link>
            )}
          </div>
          <div>
            {isConnected ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => disconnect()}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => connect({ connector: metaMaskConnector })}
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 