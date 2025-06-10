'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from './ConnectButton';

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navLinkStyle = (path: string): React.CSSProperties => ({
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
    color: '#374151',
    transition: 'all 0.2s ease',
    backgroundColor: isActive(path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
  });

  const navLinkHoverStyle: React.CSSProperties = {
    backgroundColor: 'rgba(59, 130, 246, 0.05)'
  };

  return (
    <nav style={{ borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        paddingLeft: '16px', 
        paddingRight: '16px' 
      }}>
        <div style={{ 
          display: 'flex', 
          height: '64px', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link
              href="/"
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#3b82f6',
                textDecoration: 'none'
              }}
            >
              Property DApp
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link
                href="/properties"
                style={navLinkStyle('/properties')}
                onMouseEnter={(e) => {
                  if (!isActive('/properties')) {
                    e.currentTarget.style.backgroundColor = navLinkHoverStyle.backgroundColor!;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/properties')) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Properties
              </Link>
              <Link
                href="/leases"
                style={navLinkStyle('/leases')}
                onMouseEnter={(e) => {
                  if (!isActive('/leases')) {
                    e.currentTarget.style.backgroundColor = navLinkHoverStyle.backgroundColor!;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/leases')) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Leases
              </Link>
              <Link
                href="/auctions"
                style={navLinkStyle('/auctions')}
                onMouseEnter={(e) => {
                  if (!isActive('/auctions')) {
                    e.currentTarget.style.backgroundColor = navLinkHoverStyle.backgroundColor!;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/auctions')) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Start Auction
              </Link>
              <Link
                href="/active-auctions"
                style={navLinkStyle('/active-auctions')}
                onMouseEnter={(e) => {
                  if (!isActive('/active-auctions')) {
                    e.currentTarget.style.backgroundColor = navLinkHoverStyle.backgroundColor!;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/active-auctions')) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Active Auctions
              </Link>
              <Link
                href="/notary"
                style={navLinkStyle('/notary')}
                onMouseEnter={(e) => {
                  if (!isActive('/notary')) {
                    e.currentTarget.style.backgroundColor = navLinkHoverStyle.backgroundColor!;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/notary')) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
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