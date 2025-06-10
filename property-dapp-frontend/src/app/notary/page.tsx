'use client';

import { NotaryDashboard } from '@/components/properties/NotaryDashboard';

export default function NotaryPage() {
  return (
    <main style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 16px 32px 16px' }}>
        <h1 style={{ 
          marginBottom: '32px', 
          fontSize: '30px', 
          fontWeight: 'bold',
          color: '#1f2937',
          textShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
        }}>
          Notary Dashboard
        </h1>
        <NotaryDashboard />
      </div>
    </main>
  );
} 