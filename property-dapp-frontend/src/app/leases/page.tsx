'use client';

import CreateLease from '@/components/leases/CreateLease';
import LeaseList from '@/components/leases/LeaseList';

export default function LeasesPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '32px', color: '#1f2937' }}>Create New Lease</h1>
          <CreateLease />
        </div>
        
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '32px', color: '#1f2937' }}>Your Leases</h1>
          <LeaseList />
        </div>
      </div>
    </div>
  );
} 