'use client';

import { PropertyList } from '@/components/properties/PropertyList';
import { RegisterProperty } from '@/components/properties/RegisterProperty';

export default function PropertiesPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '32px', color: '#1f2937' }}>Register New Property</h1>
          <RegisterProperty />
        </div>
        
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '32px', color: '#1f2937' }}>Your Properties</h1>
          <PropertyList />
        </div>
      </div>
    </div>
  );
} 