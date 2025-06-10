'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Navigation />
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '96px', paddingBottom: '32px', paddingLeft: '16px', paddingRight: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            letterSpacing: '-0.05em',
            color: '#1f2937',
            textShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
            margin: '0'
          }}>
            Property Management DApp
          </h1>
          <p style={{ 
            maxWidth: '600px', 
            color: '#6b7280',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: '0'
          }}>
            A decentralized application for managing property records on the blockchain.
            Register, transfer, and verify property ownership with transparency and security.
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px',
            width: '100%',
            maxWidth: '900px'
          }}>
            <Link 
              href="/properties" 
              style={{ 
                padding: '24px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.3s ease',
                background: '#ffffff',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <h3 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>Register Property</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                Add your property to the blockchain with secure documentation.
              </p>
            </Link>
            <Link 
              href="/properties" 
              style={{ 
                padding: '24px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.3s ease',
                background: '#ffffff',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <h3 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>View Properties</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                Check your registered properties and their status.
              </p>
            </Link>
            <Link 
              href="/properties" 
              style={{ 
                padding: '24px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.3s ease',
                background: '#ffffff',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <h3 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>Manage Properties</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                Manage your properties and track approval status.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
