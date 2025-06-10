'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from './ConnectButton';

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-primary/10' : '';
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link 
              href="/"
              className="text-xl font-bold text-primary"
            >
              Property DApp
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/properties"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/5 ${isActive('/properties')}`}
              >
                Properties
              </Link>
              <Link
                href="/auctions"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/5 ${isActive('/auctions')}`}
              >
                Auctions
              </Link>
              <Link
                href="/notary"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/5 ${isActive('/notary')}`}
              >
                Notary
              </Link>
            </div>
          </div>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
} 