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
  const { propertyCount, getPropertyById } = useContract();
  const { address } = useAccount();

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading properties...</div>
      </div>
    );
  }

  const userApprovedProperties = properties.filter(
    (property) => property.owner === address && property.isApproved && !property.onAuction
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Start an Auction</h1>

      {!address ? (
        <div className="text-center py-8">
          <p className="text-lg mb-4">Please connect your wallet to view your properties</p>
        </div>
      ) : userApprovedProperties.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg mb-4">You don't have any approved properties to auction</p>
          <Button
            onClick={() => window.location.href = '/properties'}
            className="bg-primary text-white"
          >
            Register New Property
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userApprovedProperties.map((property) => (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle>{property.propertyAddress}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>Type: {property.propertyType}</p>
                  <p>Size: {property.size} sq ft</p>
                  <div className="mt-4">
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