'use client';

import { useEffect, useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StartAuction } from '@/components/StartAuction';

interface Property {
  id: number;
  owner: string;
  propertyAddress: string;
  size: number;
  propertyType: string;
  isActive: boolean;
  isApproved: boolean;
  onAuction: boolean;
  auctionEndTime: number;
}

export default function AuctionsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertiesWithActiveLeases, setPropertiesWithActiveLeases] = useState<Set<number>>(new Set());
  const { propertyCount, getPropertyById, getLandlordLeases, getLeaseById } = useContract();
  const { address } = useAccount();

  const checkActiveLeases = async () => {
    if (!address) return;
    
    try {
      const leaseIds = await getLandlordLeases(address);
      const propertiesWithLeases = new Set<number>();
      
      for (const leaseId of leaseIds) {
        const lease = await getLeaseById(leaseId);
        if (lease && lease.isActive) {
          propertiesWithLeases.add(Number(lease.propertyId));
        }
      }
      
      setPropertiesWithActiveLeases(propertiesWithLeases);
    } catch (error) {
      console.error('Error checking active leases:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const propertiesData = [];

      for (let i = 1; i <= propertyCount; i++) {
        const property = await getPropertyById(i);
        if (property) {
          propertiesData.push({
            id: Number(property.id),
            owner: property.owner,
            propertyAddress: property.propertyAddress,
            size: Number(property.size),
            propertyType: property.propertyType,
            isActive: property.isActive,
            isApproved: property.isApproved,
            onAuction: property.onAuction,
            auctionEndTime: Number(property.auctionEndTime),
          });
        }
      }

      setProperties(propertiesData);
      await checkActiveLeases();
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyCount > 0) {
      fetchProperties();
    }
  }, [propertyCount]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ fontSize: '18px' }}>Loading properties...</div>
      </div>
    );
  }

  const userProperties = properties.filter(
    (property) => property.owner === address && property.isApproved
  );

  const userApprovedProperties = userProperties.filter(
    (property) => !property.onAuction && !propertiesWithActiveLeases.has(property.id)
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '32px', color: '#1f2937' }}>Start an Auction</h1>

      {!address ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: '18px', marginBottom: '16px', color: '#6b7280' }}>Please connect your wallet to view your properties</p>
        </div>
      ) : userApprovedProperties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: '18px', marginBottom: '16px', color: '#6b7280' }}>
            You don't have any approved properties available for auction
          </p>
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'left' }}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              <strong>Properties are not available for auction if they:</strong>
            </p>
            <ul style={{ fontSize: '14px', color: '#6b7280', paddingLeft: '20px' }}>
              <li>Are not yet approved by the notary</li>
              <li>Are already on auction</li>
              <li>Have active lease agreements</li>
            </ul>
          </div>
          <Button
            onClick={() => window.location.href = '/properties'}
            style={{ 
              backgroundColor: '#3b82f6', 
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Register New Property
          </Button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px' 
        }}>
          {userApprovedProperties.map((property) => (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle>{property.propertyAddress}</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p>Type: {property.propertyType}</p>
                  <p>Size: {property.size} sq ft</p>
                  <div style={{ marginTop: '16px' }}>
                    <StartAuction
                      propertyId={property.id}
                      onAuctionStarted={fetchProperties}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 