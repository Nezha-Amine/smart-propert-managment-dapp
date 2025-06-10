'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="container pt-24 pb-8">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <h1 className="text-4xl font-bold tracking-tighter neon-text sm:text-5xl xl:text-6xl">
            Property Management DApp
          </h1>
          <p className="max-w-[600px] text-muted-foreground">
            A decentralized application for managing property records on the blockchain.
            Register, transfer, and verify property ownership with transparency and security.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link href="/properties" className="p-6 border rounded-lg neon-border hover:bg-accent/50 transition-colors">
              <h3 className="mb-2 text-xl font-semibold">Register Property</h3>
              <p className="text-sm text-muted-foreground">
                Add your property to the blockchain with secure documentation.
              </p>
            </Link>
            <Link href="/properties" className="p-6 border rounded-lg neon-border hover:bg-accent/50 transition-colors">
              <h3 className="mb-2 text-xl font-semibold">View Properties</h3>
              <p className="text-sm text-muted-foreground">
                Check your registered properties and their status.
              </p>
            </Link>
            <Link href="/properties" className="p-6 border rounded-lg neon-border hover:bg-accent/50 transition-colors">
              <h3 className="mb-2 text-xl font-semibold">Manage Properties</h3>
              <p className="text-sm text-muted-foreground">
                Manage your properties and track approval status.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
