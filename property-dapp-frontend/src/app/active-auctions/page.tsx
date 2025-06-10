'use client';

import { useEffect, useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ethers } from 'ethers';

interface Property {
  id: number;
  owner: string;
  propertyAddress: string;
  size: number;
  propertyType: string;
  isActive: boolean;
  onAuction: boolean;
  auctionEndTime: number;
  highestBidder: string;
  highestBid: bigint;
  auctionEnded: boolean;
  startingPrice?: bigint;
}

interface BidEvent {
  bidder: string;
  amount: bigint;
  timestamp: number;
  blockNumber: number;
}

export default function ActiveAuctionsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmounts, setBidAmounts] = useState<{ [key: number]: string }>({});
  const [endingAuction, setEndingAuction] = useState<{ [key: number]: boolean }>({});
  const [bidHistory, setBidHistory] = useState<{ [key: number]: BidEvent[] }>({});
  const { propertyCount, getPropertyById, placeBid, endAuction } = useContract();
  const { address } = useAccount();

  const isAuctionExpired = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    return now >= endTime;
  };

  const getBidHistory = async (propertyId: number) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const contract = new ethers.Contract(
        '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // CONTRACT_ADDRESS
        [
          "event BidPlaced(uint256 indexed propertyId, address indexed bidder, uint256 amount, uint256 timestamp)"
        ],
        provider
      );

      const filter = contract.filters.BidPlaced(propertyId);
      const events = await contract.queryFilter(filter);
      
      const bids: BidEvent[] = events.map((event: any) => ({
        bidder: event.args.bidder,
        amount: BigInt(event.args.amount.toString()),
        timestamp: Number(event.args.timestamp),
        blockNumber: event.blockNumber
      }));

      // Sort by amount (highest first)
      bids.sort((a, b) => Number(b.amount - a.amount));
      
      setBidHistory(prev => ({ ...prev, [propertyId]: bids }));
    } catch (error) {
      console.error('Error fetching bid history:', error);
    }
  };

  const fetchProperties = async () => {
    if (!propertyCount) return;
    
    try {
      setLoading(true);
      const allPropertiesData = [];
      const myPropertiesData = [];

      for (let i = 1; i <= propertyCount; i++) {
        const property = await getPropertyById(i);
        if (property && property.onAuction && !property.auctionEnded) {
          const expired = isAuctionExpired(Number(property.auctionEndTime));
          
          const propertyData = {
            id: Number(property.id),
            owner: property.owner,
            propertyAddress: property.propertyAddress,
            size: Number(property.size),
            propertyType: property.propertyType,
            isActive: property.isActive,
            onAuction: property.onAuction,
            auctionEndTime: Number(property.auctionEndTime),
            highestBidder: property.highestBidder,
            highestBid: BigInt(property.highestBid.toString()),
            auctionEnded: property.auctionEnded,
            startingPrice: BigInt(property.salePrice?.toString() || '0') // Assuming starting price is stored in salePrice
          };

          if (property.owner === address) {
            // Owner's properties (show even if expired for management)
            myPropertiesData.push(propertyData);
            // Get bid history for owner's properties
            await getBidHistory(propertyData.id);
          } else if (!expired) {
            // Other users' properties (only show active ones)
            allPropertiesData.push(propertyData);
          }
        }
      }

      setProperties(allPropertiesData);
      setMyProperties(myPropertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load auctions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchProperties, 30000);
    
    return () => clearInterval(interval);
  }, [propertyCount, address]);

  const validateBid = (bidAmount: string, property: Property): string | null => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      return 'Please enter a valid bid amount';
    }

    const bidInWei = ethers.utils.parseEther(bidAmount);
    const bidBigInt = BigInt(bidInWei);

    // Check if bid is higher than starting price
    if (property.startingPrice && bidBigInt <= property.startingPrice) {
      return `Bid must be higher than starting price (${ethers.utils.formatEther(property.startingPrice)} ETH)`;
    }

    // Check if bid is higher than current highest bid
    if (bidBigInt <= property.highestBid) {
      return `Bid must be higher than current highest bid (${ethers.utils.formatEther(property.highestBid)} ETH)`;
    }

    // Minimum increment check (0.01 ETH)
    const minIncrement = ethers.utils.parseEther('0.01');
    if (bidBigInt < property.highestBid + BigInt(minIncrement)) {
      return 'Bid must be at least 0.01 ETH higher than current highest bid';
    }

    return null;
  };

  const handleBid = async (propertyId: number, property: Property) => {
    if (isAuctionExpired(property.auctionEndTime)) {
      toast.error('This auction has expired. You cannot place a bid.');
      fetchProperties();
      return;
    }

    const bidAmount = bidAmounts[propertyId];
    const validationError = validateBid(bidAmount, property);
    
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await placeBid(propertyId, bidAmount);
      toast.success('Bid placed successfully!');
      setBidAmounts(prev => ({ ...prev, [propertyId]: '' }));
      await fetchProperties();
      await getBidHistory(propertyId); // Refresh bid history
    } catch (error: any) {
      toast.error(error.message || 'Failed to place bid');
    }
  };

  const handleEndAuction = async (propertyId: number) => {
    try {
      setEndingAuction(prev => ({ ...prev, [propertyId]: true }));
      await endAuction(propertyId);
      toast.success('Auction ended successfully! Property transferred to highest bidder.');
      await fetchProperties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to end auction');
    } finally {
      setEndingAuction(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  const formatTimeLeft = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'Expired';

    const days = Math.floor(timeLeft / (24 * 60 * 60));
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTimeLeftStatus = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'expired';
    if (timeLeft <= 3600) return 'urgent';
    if (timeLeft <= 24 * 60 * 60) return 'warning';
    return 'normal';
  };

  const renderPropertyCard = (property: Property, isOwner: boolean = false) => {
    const timeStatus = getTimeLeftStatus(property.auctionEndTime);
    const isExpired = timeStatus === 'expired';
    const bids = bidHistory[property.id] || [];
    
    return (
      <Card key={property.id} style={{ borderColor: isExpired ? '#fca5a5' : '#e5e7eb' }}>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <CardTitle style={{ fontSize: '18px' }}>{property.propertyAddress}</CardTitle>
            <Badge variant={
              timeStatus === 'expired' ? 'destructive' :
              timeStatus === 'urgent' ? 'destructive' :
              timeStatus === 'warning' ? 'secondary' : 'default'
            }>
              {formatTimeLeft(property.auctionEndTime)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p><span style={{ fontWeight: '500' }}>Type:</span> {property.propertyType}</p>
            <p><span style={{ fontWeight: '500' }}>Size:</span> {property.size} sq ft</p>
            {property.startingPrice && (
              <p><span style={{ fontWeight: '500' }}>Starting Price:</span> {ethers.utils.formatEther(property.startingPrice)} ETH</p>
            )}
            <p><span style={{ fontWeight: '500' }}>Current Highest Bid:</span> {ethers.utils.formatEther(property.highestBid)} ETH</p>
            
            {isOwner ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p><span style={{ fontWeight: '500' }}>Highest Bidder:</span> {property.highestBidder}</p>
                <p><span style={{ fontWeight: '500' }}>Total Bids:</span> {bids.length}</p>
                {bids.length > 0 && (
                  <div style={{ 
                    maxHeight: '128px', 
                    overflowY: 'auto', 
                    backgroundColor: '#f9fafb', 
                    padding: '8px', 
                    borderRadius: '6px' 
                  }}>
                    <p style={{ fontWeight: '500', fontSize: '14px', marginBottom: '8px' }}>Bid History:</p>
                    {bids.slice(0, 5).map((bid, index) => (
                      <div key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500' }}>{ethers.utils.formatEther(bid.amount)} ETH</span> by{' '}
                        <span style={{ color: '#6b7280' }}>{bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}</span>
                      </div>
                    ))}
                    {bids.length > 5 && <p style={{ fontSize: '12px', color: '#6b7280' }}>+{bids.length - 5} more bids</p>}
                  </div>
                )}
              </div>
            ) : (
              <p><span style={{ fontWeight: '500' }}>Highest Bidder:</span> {
                property.highestBidder === address ? 'You' : 
                `${property.highestBidder.slice(0, 6)}...${property.highestBidder.slice(-4)}`
              }</p>
            )}
          </div>

          {!isOwner && !isExpired && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Input
                type="number"
                placeholder={`Min: ${ethers.utils.formatEther(property.highestBid + BigInt(ethers.utils.parseEther('0.01')))} ETH`}
                value={bidAmounts[property.id] || ''}
                onChange={(e) => setBidAmounts(prev => ({
                  ...prev,
                  [property.id]: e.target.value
                }))}
                min={ethers.utils.formatEther(property.highestBid + BigInt(ethers.utils.parseEther('0.01')))}
                step="0.01"
              />
            </div>
          )}

          {isExpired && (
            <div style={{ 
              textAlign: 'center', 
              padding: '12px', 
              backgroundColor: '#fef2f2', 
              borderRadius: '6px', 
              border: '1px solid #fecaca' 
            }}>
              <p style={{ color: '#b91c1c', fontWeight: '600' }}>⏰ Auction Expired</p>
              <p style={{ fontSize: '14px', color: '#dc2626' }}>Anyone can end this auction to finalize the transfer</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!isOwner && !isExpired ? (
            <Button
              onClick={() => handleBid(property.id, property)}
              disabled={!bidAmounts[property.id]}
              style={{ width: '100%' }}
            >
              Place Bid
            </Button>
          ) : isExpired ? (
            <Button
              onClick={() => handleEndAuction(property.id)}
              disabled={endingAuction[property.id]}
              variant="destructive"
              style={{ width: '100%' }}
            >
              {endingAuction[property.id] ? 'Ending Auction...' : 'End Auction & Transfer'}
            </Button>
          ) : (
            <div style={{ 
              width: '100%', 
              textAlign: 'center', 
              padding: '8px', 
              backgroundColor: '#eff6ff', 
              borderRadius: '6px' 
            }}>
              <p style={{ fontSize: '14px', color: '#1d4ed8' }}>You own this property</p>
            </div>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (!address) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 16px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>🏠 Decentralized Property Auctions</h1>
          <p>Connect your wallet to participate in transparent, blockchain-based property auctions</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 16px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>🏠 Decentralized Property Auctions</h1>
          <p>Loading auctions from blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '32px 16px' 
    }}>
      <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '8px' }}>🏠 Decentralized Property Auctions</h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>Transparent, blockchain-based property trading</p>

      <Tabs defaultValue="browse" style={{ width: '100%' }}>
        <TabsList style={{ display: 'grid', width: '100%', gridTemplateColumns: '1fr 1fr' }}>
          <TabsTrigger value="browse">Browse Auctions ({properties.length})</TabsTrigger>
          <TabsTrigger value="manage">My Auctions ({myProperties.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" style={{ marginTop: '24px' }}>
          {properties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ color: '#6b7280' }}>No active auctions available.</p>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>Check back later or start your own auction!</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '24px' 
            }}>
              {properties.map((property) => renderPropertyCard(property, false))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="manage" style={{ marginTop: '24px' }}>
          {myProperties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ color: '#6b7280' }}>You don't have any active auctions.</p>
              <Button 
                onClick={() => window.location.href = '/auctions'}
                style={{ marginTop: '16px' }}
              >
                Start New Auction
              </Button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '24px' 
            }}>
              {myProperties.map((property) => renderPropertyCard(property, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 