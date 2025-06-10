'use client';

import { Navigation } from '@/components/Navigation';
import { NotaryDashboard } from '@/components/properties/NotaryDashboard';

export default function NotaryPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="container py-20">
        <h1 className="mb-8 text-3xl font-bold neon-text">Notary Dashboard</h1>
        <NotaryDashboard />
      </div>
    </main>
  );
} 