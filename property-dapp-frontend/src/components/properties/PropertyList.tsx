'use client';

import { useEffect, useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { readContract } from '@wagmi/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PropertyDetailsModal from './PropertyDetailsModal';

interface Property {
  id: number;
  owner: string;
  propertyAddress: string;
  size: number;
  propertyType: string;
  isActive: boolean;
  createdAt: number;
  isForSale: boolean;
  salePrice: number;
  onAuction: boolean;
  auctionEndTime: number;
  highestBidder: string;
  highestBid: number;
  auctionEnded: boolean;
  isApproved: boolean;
  documentHash: string;
}

export function PropertyList() {
  const { address } = useAccount();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNotary, setIsNotary] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(0);

  // Check if current user is notary
  const { data: notaryAddress } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'notary',
  });

  // Get total number of properties
  const { data: propertyCounter } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getPropertyCounter',
    watch: true,
  });

  // Get property IDs owned by the current user
  const { data: userPropertyIds, error: ownerPropertiesError } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getOwnerProperties',
    args: [address as `0x${string}`],
    enabled: !!address,
    watch: true,
    onError: (error) => {
      console.warn('getOwnerProperties failed, user may have no properties:', error);
    },
  });

  // Check if user is notary
  useEffect(() => {
    if (address && notaryAddress) {
      const isUserNotary = address.toLowerCase() === notaryAddress.toLowerCase();
      setIsNotary(isUserNotary);
      
      // If user is notary, show a notification about the dashboard
      if (isUserNotary) {
        router.push('/notary');
      }
    }
  }, [address, notaryAddress, router]);

  // Process properties when they change
  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    // If there's an error with getOwnerProperties, assume user has no properties
    if (ownerPropertiesError) {
      console.log('User has no properties or getOwnerProperties failed');
      setProperties([]);
      setLoading(false);
      return;
    }

    // If userPropertyIds is still loading or empty
    if (!userPropertyIds || (Array.isArray(userPropertyIds) && userPropertyIds.length === 0)) {
      setProperties([]);
      setLoading(false);
      return;
    }

    const fetchProperties = async () => {
      try {
        console.log('Property counter:', propertyCounter);
        console.log('User property IDs:', userPropertyIds);
        console.log('Current user address:', address);

        const propertyPromises = (userPropertyIds as unknown as number[]).map(async (id) => {
          const result = await readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'properties',
            args: [BigInt(id)],
          });

          return {
            id: Number(result[0]),          // id
            owner: result[1],               // owner
            propertyAddress: result[2],     // propertyAddress
            size: Number(result[3]),        // size
            propertyType: result[4],        // propertyType
            isActive: result[5],            // isActive
            createdAt: Number(result[6]),   // createdAt
            isForSale: result[7],           // isForSale
            salePrice: Number(result[8]),   // salePrice
            onAuction: result[9],           // onAuction
            auctionEndTime: Number(result[10]), // auctionEndTime
            highestBidder: result[11],      // highestBidder
            highestBid: Number(result[12]), // highestBid
            auctionEnded: result[13],       // auctionEnded
            isApproved: result[14],         // isApproved
            documentHash: result[15],       // documentHash
          };
        });

        const fetchedProperties = await Promise.all(propertyPromises);
        console.log('Fetched properties:', fetchedProperties);
        setProperties(fetchedProperties);
      } catch (error) {
        console.error('Error processing properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [address, userPropertyIds, propertyCounter]);

  if (!address) {
    return (
      <Card style={{ 
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        border: 'none',
        textAlign: 'center',
        padding: '40px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔐</div>
        <CardTitle style={{ color: '#8b5a3c', fontSize: '24px', marginBottom: '8px' }}>Connect Your Wallet</CardTitle>
        <CardDescription style={{ color: '#d4a574', fontSize: '16px' }}>
          Please connect your wallet to view your property portfolio.
        </CardDescription>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card style={{ 
        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        border: 'none',
        textAlign: 'center',
        padding: '40px'
      }}>
        <div style={{ 
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <CardTitle style={{ color: '#5a67d8', fontSize: '20px', marginBottom: '8px' }}>Loading Properties</CardTitle>
        <CardDescription style={{ color: '#a0aec0' }}>
          Fetching your properties from the blockchain...
        </CardDescription>
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card style={{ 
        background: 'linear-gradient(135deg, #fad0c4 0%, #fad0c4 1%, #ffd1ff 100%)',
        border: 'none',
        textAlign: 'center',
        padding: '48px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏠</div>
        <CardTitle style={{ color: '#8b5a83', fontSize: '24px', marginBottom: '8px' }}>No Properties Found</CardTitle>
        <CardDescription style={{ color: '#b794a1', fontSize: '16px', marginBottom: '24px' }}>
          Start building your property portfolio by registering your first property.
        </CardDescription>
        <Button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Register First Property
        </Button>
      </Card>
    );
  }

  const getStatusBadge = (property: Property) => {
    if (property.onAuction) {
      return <Badge variant="destructive">🔥 On Auction</Badge>;
    } else if (property.isApproved) {
      return <Badge variant="default">✅ Approved</Badge>;
    } else {
      return <Badge variant="secondary">⏳ Pending</Badge>;
    }
  };

  const getPropertyIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('residential')) return '🏡';
    if (lowerType.includes('commercial')) return '🏢';
    if (lowerType.includes('industrial')) return '🏭';
    if (lowerType.includes('land')) return '🌍';
    return '🏠';
  };

  return (
    <Card style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
    }}>
      <CardHeader style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ fontSize: '24px' }}>📊</div>
              <CardTitle style={{ color: 'white', fontSize: '20px', margin: '0' }}>Your Property Portfolio</CardTitle>
            </div>
            <CardDescription style={{ color: 'rgba(255, 255, 255, 0.9)', margin: '0' }}>
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} registered on the blockchain
            </CardDescription>
          </div>
          {isNotary && (
            <Button 
              onClick={() => router.push('/notary')} 
              variant="outline"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white'
              }}
            >
              Go to Notary Dashboard
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent style={{ padding: '0', backgroundColor: 'white' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ color: '#374151', fontWeight: '700' }}>ID</TableHead>
              <TableHead style={{ color: '#374151', fontWeight: '700' }}>Property</TableHead>
              <TableHead style={{ color: '#374151', fontWeight: '700' }}>Type</TableHead>
              <TableHead style={{ color: '#374151', fontWeight: '700' }}>Size</TableHead>
              <TableHead style={{ color: '#374151', fontWeight: '700' }}>Status</TableHead>
              <TableHead style={{ color: '#374151', fontWeight: '700' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property, index) => (
              <TableRow 
                key={property.id}
                style={{ 
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                }}
              >
                <TableCell style={{ 
                  fontWeight: '600', 
                  color: '#667eea',
                  fontSize: '16px'
                }}>
                  #{property.id}
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{getPropertyIcon(property.propertyType)}</span>
                    <span style={{ fontWeight: '500', color: '#374151' }}>
                      {property.propertyAddress}
                    </span>
                  </div>
                </TableCell>
                <TableCell style={{ 
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {property.propertyType}
                </TableCell>
                <TableCell style={{ 
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📐</span>
                    <span>{property.size.toLocaleString()} m²</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(property)}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => {
                      setSelectedPropertyId(property.id);
                      setDetailsModalOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    ℹ️ Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div style={{ 
          padding: '16px 24px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#9ca3af', 
            margin: '0'
          }}>
            💡 Properties marked as "Pending" require notary approval before they can be used for auctions
          </p>
        </div>
      </CardContent>
      
      {/* Property Details Modal */}
      <PropertyDetailsModal
        propertyId={selectedPropertyId}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />
    </Card>
  );
}