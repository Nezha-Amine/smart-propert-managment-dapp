'use client';

import { useEffect, useState } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';
import { formatEther, parseEther } from 'viem';
import { toast } from 'sonner';

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
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [bidHistory, setBidHistory] = useState<{ [key: number]: BidEvent[] }>({});
  const [pendingReturns, setPendingReturns] = useState<{ [key: number]: bigint }>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'manage'>('browse');
  const { address } = useAccount();

  // Get property counter
  const { data: propertyCounter } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getPropertyCounter',
    enabled: true,
  });

  // Prepare place bid transaction
  const { config: placeBidConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'placeBid',
    args: [BigInt(selectedPropertyId || 0)],
    value: selectedPropertyId ? parseEther(bidAmounts[selectedPropertyId] || '0') : BigInt(0),
    enabled: !!(selectedPropertyId && bidAmounts[selectedPropertyId] && parseFloat(bidAmounts[selectedPropertyId]) > 0),
  });

  // Prepare end auction transaction
  const { config: endAuctionConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'endAuction',
    args: selectedPropertyId ? [BigInt(selectedPropertyId)] : undefined,
    enabled: !!selectedPropertyId,
  });

  // Prepare cancel auction transaction
  const { config: cancelAuctionConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'cancelAuction',
    args: selectedPropertyId ? [BigInt(selectedPropertyId)] : undefined,
    enabled: !!selectedPropertyId,
  });

  // Prepare withdraw bid transaction
  const { config: withdrawBidConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'withdrawBid',
    args: [BigInt(selectedPropertyId || 0)],
    enabled: !!selectedPropertyId,
  });

  // Execute place bid transaction
  const { write: placeBid, isLoading: isPlacingBid } = useContractWrite({
    ...placeBidConfig,
    onSuccess: () => {
      toast.success('🎉 Bid placed successfully!');
      setBidAmounts(prev => ({ ...prev, [selectedPropertyId!]: '' }));
      setSelectedPropertyId(null);
      fetchProperties();
    },
    onError: (error) => {
      console.error('Error placing bid:', error);
      toast.error('❌ Failed to place bid. Please try again.');
      setSelectedPropertyId(null);
    },
  });

  // Execute end auction transaction
  const { write: endAuction, isLoading: isEndingAuction } = useContractWrite({
    ...endAuctionConfig,
    onSuccess: () => {
      toast.success('🎉 Auction ended successfully! Property transferred to highest bidder.');
      setSelectedPropertyId(null);
      fetchProperties();
    },
    onError: (error) => {
      console.error('Error ending auction:', error);
      toast.error('❌ Failed to end auction. Please try again.');
      setSelectedPropertyId(null);
    },
  });

  // Execute cancel auction transaction
  const { write: cancelAuction, isLoading: isCancellingAuction } = useContractWrite({
    ...cancelAuctionConfig,
    onSuccess: () => {
      toast.success('🎉 Auction cancelled successfully! All bids have been refunded.');
      setSelectedPropertyId(null);
      fetchProperties();
    },
    onError: (error) => {
      console.error('Error cancelling auction:', error);
      toast.error('❌ Failed to cancel auction. Please try again.');
      setSelectedPropertyId(null);
    },
  });

  // Execute withdraw bid transaction
  const { write: withdrawBid, isLoading: isWithdrawingBid } = useContractWrite({
    ...withdrawBidConfig,
    onSuccess: () => {
      toast.success('💰 Bid withdrawn successfully! Funds returned to your wallet.');
      setSelectedPropertyId(null);
      fetchPendingReturns();
    },
    onError: (error) => {
      console.error('Error withdrawing bid:', error);
      toast.error('❌ Failed to withdraw bid. Please try again.');
      setSelectedPropertyId(null);
    },
  });

  // Fetch pending returns for user
  const fetchPendingReturns = async () => {
    if (!address) return;
    
    try {
      const returns: { [key: number]: bigint } = {};
      for (const property of [...properties, ...myProperties]) {
        try {
          const pendingReturn = await readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'getPendingReturn',
            args: [BigInt(property.id), address as `0x${string}`],
          });
          if (pendingReturn && pendingReturn > 0n) {
            returns[property.id] = pendingReturn as bigint;
          }
        } catch (error) {
          console.error(`Error fetching pending return for property ${property.id}:`, error);
        }
      }
      setPendingReturns(returns);
    } catch (error) {
      console.error('Error fetching pending returns:', error);
    }
  };

  // Fetch all auction properties
  const fetchProperties = async () => {
    if (!propertyCounter) return;
    
    try {
      setLoading(true);
      const allProperties: Property[] = [];
      const ownerProperties: Property[] = [];

      for (let i = 1; i <= Number(propertyCounter); i++) {
        try {
          const result = await readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'properties',
            args: [BigInt(i)],
          });

          if (result && Array.isArray(result) && result.length >= 16) {
            const property: Property = {
              id: Number(result[0]),
              owner: result[1] as string,
              propertyAddress: result[2] as string,
              size: Number(result[3]),
              propertyType: result[4] as string,
              isActive: result[5] as boolean,
              onAuction: result[9] as boolean,
              auctionEndTime: Number(result[10]),
              highestBidder: result[11] as string,
              highestBid: result[12] as bigint,
              auctionEnded: result[13] as boolean,
              startingPrice: result[12] as bigint
            };

            // Only include properties that are on auction and not ended
            if (property.onAuction && !property.auctionEnded) {
              if (property.owner.toLowerCase() === address?.toLowerCase()) {
                ownerProperties.push(property);
              } else {
                allProperties.push(property);
              }
              // Create real bid history from current bid data
              await getBidHistory(property.id, property);
            }
          }
        } catch (error) {
          console.error(`Error fetching property ${i}:`, error);
        }
      }

      setProperties(allProperties);
      setMyProperties(ownerProperties);
      
      // Fetch pending returns after properties are loaded
      await fetchPendingReturns();
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('❌ Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  // Get real bid history from blockchain events
  const getBidHistory = async (propertyId: number, property: Property) => {
    try {
      const bids: BidEvent[] = [];
      
      // Try to fetch bid events from the blockchain
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Create web3 provider to query events
          const { createPublicClient, http } = await import('viem');
          const { mainnet, sepolia, hardhat, localhost } = await import('viem/chains');
          
          const client = createPublicClient({
            chain: localhost, // Use localhost for development
            transport: http('http://127.0.0.1:8545')
          });

                     // Query BidPlaced events for this specific property only
           const bidEvents = await client.getLogs({
             address: CONTRACT_ADDRESS as `0x${string}`,
             event: {
               type: 'event',
               name: 'BidPlaced',
               inputs: [
                 { name: 'propertyId', type: 'uint256', indexed: true },
                 { name: 'bidder', type: 'address', indexed: true },
                 { name: 'amount', type: 'uint256', indexed: false }
               ]
             },
             args: {
               propertyId: BigInt(propertyId)
             },
             fromBlock: 'earliest',
             toBlock: 'latest'
           });

           console.log(`Fetched ${bidEvents.length} bid events for property ${propertyId}`);

           // Convert events to our format with strict property ID filtering
           for (const event of bidEvents) {
             if (event.args && 
                 event.args.propertyId && 
                 event.args.bidder && 
                 event.args.amount &&
                 Number(event.args.propertyId) === propertyId) { // Double-check propertyId matches
               
               console.log(`Adding bid: Property ${Number(event.args.propertyId)}, Bidder: ${event.args.bidder}, Amount: ${event.args.amount}`);
               
               bids.push({
                 bidder: event.args.bidder as string,
                 amount: event.args.amount as bigint,
                 timestamp: Date.now() - (bidEvents.length - bidEvents.indexOf(event)) * 60000, // Approximate timestamps
                 blockNumber: Number(event.blockNumber)
               });
             } else if (event.args && event.args.propertyId && Number(event.args.propertyId) !== propertyId) {
               console.log(`Skipping bid for different property: ${Number(event.args.propertyId)} (looking for ${propertyId})`);
             }
           }

          // Sort by amount (highest first)
          bids.sort((a, b) => Number(b.amount - a.amount));
          
                 } catch (eventError) {
           console.warn('Could not fetch bid events, falling back to current state:', eventError);
           
           // Fallback: show only current highest bid if events fail
           if (property.highestBidder && 
               property.highestBidder !== '0x0000000000000000000000000000000000000000' &&
               property.highestBid > 0n) {
             bids.push({
               bidder: property.highestBidder,
               amount: property.highestBid,
               timestamp: Date.now(),
               blockNumber: 0
             });
           }
         }
         
                 } else {
          // Fallback for when ethereum is not available
          if (property.highestBidder && 
              property.highestBidder !== '0x0000000000000000000000000000000000000000' &&
              property.highestBid > 0n) {
            bids.push({
              bidder: property.highestBidder,
              amount: property.highestBid,
              timestamp: Date.now(),
              blockNumber: 0
            });
          }
        }
        
        // Additional safety check: ensure the highest bid matches the property state
        // Remove any bids that are higher than the current highest bid (indicates cross-property contamination)
        const validBids = bids.filter(bid => {
          return bid.amount <= property.highestBid || bid.bidder === property.highestBidder;
        });
        
        console.log(`Property ${propertyId}: Filtered ${bids.length} down to ${validBids.length} valid bids`);
        
        setBidHistory(prev => ({ ...prev, [propertyId]: validBids }));
    } catch (error) {
      console.error('Error fetching bid history:', error);
      
      // Final fallback: show current state only
      const bids: BidEvent[] = [];
      if (property.highestBidder && 
          property.highestBidder !== '0x0000000000000000000000000000000000000000' &&
          property.highestBid > 0n) {
        bids.push({
          bidder: property.highestBidder,
          amount: property.highestBid,
          timestamp: Date.now(),
          blockNumber: 0
        });
      }
      setBidHistory(prev => ({ ...prev, [propertyId]: bids }));
    }
  };

  useEffect(() => {
    fetchProperties();
    
    // Auto refresh every 15 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchProperties, 15000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [propertyCounter, autoRefresh, address]);

  const isAuctionExpired = (endTime: number) => {
    return Date.now() / 1000 >= endTime;
  };

  const getTimeLeft = (endTime: number) => {
    const now = Date.now() / 1000;
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'EXPIRED';
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handlePlaceBid = (propertyId: number) => {
    const bidAmount = bidAmounts[propertyId];
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error('📝 Please enter a valid bid amount');
      return;
    }

    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    if (isAuctionExpired(property.auctionEndTime)) {
      toast.error('⏰ This auction has expired');
      return;
    }

    const bidWei = parseEther(bidAmount);
    if (bidWei <= property.highestBid) {
      toast.error('💰 Bid must be higher than current highest bid');
      return;
    }

    if (property.owner.toLowerCase() === address?.toLowerCase()) {
      toast.error('🚫 You cannot bid on your own property');
      return;
    }

    setSelectedPropertyId(propertyId);
    placeBid?.();
  };

  const handleEndAuction = (propertyId: number) => {
    const property = myProperties.find(p => p.id === propertyId);
    if (!property) {
      toast.error('❌ Property not found');
      return;
    }

    if (property.owner.toLowerCase() !== address?.toLowerCase()) {
      toast.error('🚫 Only the property owner can end the auction');
      return;
    }

    // Owner can end auction early, others must wait for expiration
    const now = Math.floor(Date.now() / 1000);
    const isEarly = now < property.auctionEndTime;
    
    if (isEarly) {
      // Show confirmation for early ending
      if (property.highestBidder === '0x0000000000000000000000000000000000000000') {
        toast.error('⚠️ No bids yet! You can cancel the auction instead to avoid any issues.');
        return;
      }
      
      const confirmEarlyEnd = window.confirm(
        `🚨 End Auction Early?\n\n` +
        `The auction still has ${getTimeLeft(property.auctionEndTime)} remaining.\n` +
        `Current highest bid: ${formatEther(property.highestBid)} ETH\n\n` +
        `If you proceed:\n` +
        `• The property will be transferred to the highest bidder\n` +
        `• You will receive the highest bid amount\n` +
        `• This action cannot be undone\n\n` +
        `Are you sure you want to end the auction early?`
      );
      
      if (!confirmEarlyEnd) {
        return;
      }
    }

    console.log('Ending auction for property:', propertyId, isEarly ? '(early)' : '(on time)');
    setSelectedPropertyId(propertyId);
    
    if (endAuction) {
      try {
        endAuction();
      } catch (error) {
        console.error('Error calling endAuction:', error);
        toast.error('❌ Failed to end auction. Please try again.');
        setSelectedPropertyId(null);
      }
    } else {
      toast.error('❌ End auction function not ready. Please try again.');
      setSelectedPropertyId(null);
    }
  };

  const handleCancelAuction = (propertyId: number) => {
    const property = myProperties.find(p => p.id === propertyId);
    if (!property) {
      toast.error('❌ Property not found');
      return;
    }

    if (property.owner.toLowerCase() !== address?.toLowerCase()) {
      toast.error('🚫 Only the property owner can cancel the auction');
      return;
    }

    // Show confirmation for cancellation
    const totalRefund = property.highestBid > 0n ? formatEther(property.highestBid) : '0';
    const confirmCancel = window.confirm(
      `🚨 Cancel Auction?\n\n` +
      `Property: ${property.propertyAddress}\n` +
      `Time remaining: ${getTimeLeft(property.auctionEndTime)}\n` +
      `Highest bid: ${totalRefund} ETH\n\n` +
      `If you proceed:\n` +
      `• The auction will be cancelled immediately\n` +
      `• All bidders will be refunded automatically\n` +
      `• The property will remain yours\n` +
      `• This action cannot be undone\n\n` +
      `Are you sure you want to cancel the auction?`
    );
    
    if (!confirmCancel) {
      return;
    }

    console.log('Cancelling auction for property:', propertyId);
    setSelectedPropertyId(propertyId);
    
    if (cancelAuction) {
      try {
        cancelAuction();
      } catch (error) {
        console.error('Error calling cancelAuction:', error);
        toast.error('❌ Failed to cancel auction. Please try again.');
        setSelectedPropertyId(null);
      }
    } else {
      toast.error('❌ Cancel auction function not ready. Please try again.');
      setSelectedPropertyId(null);
    }
  };

  const handleWithdrawBid = (propertyId: number) => {
    setSelectedPropertyId(propertyId);
    withdrawBid?.();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderPropertyCard = (property: Property, isOwner: boolean = false) => (
    <div
      key={property.id}
      style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Property Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
              🏠 {property.propertyAddress}
            </h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', opacity: '0.9' }}>
              <span>📐 {property.size} m²</span>
              <span>🏢 {property.propertyType}</span>
              <span>👤 {formatAddress(property.owner)}</span>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', opacity: '0.8', marginBottom: '4px' }}>Time Left</div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              padding: '4px 12px',
              background: isAuctionExpired(property.auctionEndTime) 
                ? 'rgba(239, 68, 68, 0.2)' 
                : 'rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              color: isAuctionExpired(property.auctionEndTime) ? '#ef4444' : '#10b981'
            }}>
              {getTimeLeft(property.auctionEndTime)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '24px' }}>
        {/* Auction Info & Actions */}
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            💰 Current Auction
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Highest Bid:</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>
                {formatEther(property.highestBid)} ETH
              </span>
            </div>
            
            {property.highestBidder !== '0x0000000000000000000000000000000000000000' && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Leading Bidder:</span>
                <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#374151' }}>
                  {formatAddress(property.highestBidder)}
                </span>
              </div>
            )}
          </div>

          {/* Owner Controls */}
          {isOwner ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => handleEndAuction(property.id)}
                disabled={isEndingAuction && selectedPropertyId === property.id}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isEndingAuction && selectedPropertyId === property.id
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isEndingAuction && selectedPropertyId === property.id ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!(isEndingAuction && selectedPropertyId === property.id)) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(isEndingAuction && selectedPropertyId === property.id)) {
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {isEndingAuction && selectedPropertyId === property.id 
                  ? 'Ending...' 
                  : isAuctionExpired(property.auctionEndTime)
                    ? '🔨 End Auction'
                    : '⚡ End Early'
                }
              </button>
              
              <button
                onClick={() => handleCancelAuction(property.id)}
                disabled={isCancellingAuction && selectedPropertyId === property.id}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isCancellingAuction && selectedPropertyId === property.id
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isCancellingAuction && selectedPropertyId === property.id ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!(isCancellingAuction && selectedPropertyId === property.id)) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(isCancellingAuction && selectedPropertyId === property.id)) {
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {isCancellingAuction && selectedPropertyId === property.id ? 'Cancelling...' : '🚫 Cancel Auction'}
              </button>
            </div>
          ) : (
            <>
              {/* Bidding Section */}
              {!isAuctionExpired(property.auctionEndTime) && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    💵 Your Bid (ETH)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="Enter bid amount..."
                      value={bidAmounts[property.id] || ''}
                      onChange={(e) => setBidAmounts(prev => ({ ...prev, [property.id]: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#667eea';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                      }}
                    />
                    <button
                      onClick={() => handlePlaceBid(property.id)}
                      disabled={isPlacingBid && selectedPropertyId === property.id}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isPlacingBid && selectedPropertyId === property.id
                          ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: isPlacingBid && selectedPropertyId === property.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isPlacingBid && selectedPropertyId === property.id ? 'Placing...' : 'Place Bid'}
                    </button>
                  </div>
                </div>
              )}

              {/* Withdraw Bid Section */}
              {pendingReturns[property.id] && pendingReturns[property.id] > 0n && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <p style={{ fontSize: '14px', color: '#92400e', margin: '0 0 8px 0' }}>
                    💰 You have {formatEther(pendingReturns[property.id])} ETH to withdraw
                  </p>
                  <button
                    onClick={() => handleWithdrawBid(property.id)}
                    disabled={isWithdrawingBid && selectedPropertyId === property.id}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: isWithdrawingBid && selectedPropertyId === property.id
                        ? '#9ca3af'
                        : '#f59e0b',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: isWithdrawingBid && selectedPropertyId === property.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isWithdrawingBid && selectedPropertyId === property.id ? 'Withdrawing...' : 'Withdraw Bid'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Real-time Bids Table */}
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            📊 Bid History
          </h4>
          
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    BIDDER
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    AMOUNT
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    TIME
                  </th>
                </tr>
              </thead>
              <tbody>
                {bidHistory[property.id]?.length > 0 ? (
                  bidHistory[property.id].map((bid, index) => (
                    <tr 
                      key={`${bid.bidder}-${bid.timestamp}`}
                      style={{
                        background: index === 0 ? '#f0fdf4' : 'white',
                        borderBottom: index < bidHistory[property.id].length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: '12px', 
                        fontFamily: 'monospace',
                        color: '#374151'
                      }}>
                        {index === 0 && (
                          <span style={{ 
                            background: '#10b981', 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontSize: '10px', 
                            marginRight: '8px' 
                          }}>
                            TOP
                          </span>
                        )}
                        {formatAddress(bid.bidder)}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: '14px', 
                        fontWeight: index === 0 ? '600' : '400',
                        color: index === 0 ? '#059669' : '#374151'
                      }}>
                        {formatEther(bid.amount)} ETH
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: '12px', 
                        color: '#6b7280' 
                      }}>
                        {new Date(bid.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td 
                      colSpan={3} 
                      style={{ 
                        padding: '24px', 
                        textAlign: 'center', 
                        color: '#9ca3af', 
                        fontSize: '14px' 
                      }}
                    >
                      No bids yet. Be the first to bid! 🚀
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ fontSize: '18px', color: '#6b7280' }}>Loading active auctions...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', margin: '0' }}>
            🔥 Property Auctions
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginTop: '8px' }}>
            Transparent, blockchain-based property trading
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchProperties}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {!address ? (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔌</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: '600' }}>Connect Your Wallet</h2>
          <p style={{ fontSize: '16px', opacity: '0.9' }}>
            Connect your wallet to view and participate in auctions
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              background: '#f1f5f9',
              borderRadius: '12px',
              padding: '4px',
              gap: '4px'
            }}>
              <button
                onClick={() => setActiveTab('browse')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'browse' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'transparent',
                  color: activeTab === 'browse' ? 'white' : '#64748b',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Browse Auctions ({properties.length})
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'manage' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'transparent',
                  color: activeTab === 'manage' ? 'white' : '#64748b',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                My Auctions ({myProperties.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'browse' ? (
            properties.length === 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
                borderRadius: '20px',
                padding: '48px',
                textAlign: 'center',
                color: '#92400e'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏛️</div>
                <h2 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: '600' }}>No Active Auctions</h2>
                <p style={{ fontSize: '16px', opacity: '0.8' }}>
                  There are currently no active auctions to bid on. Check back later!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {properties.map((property) => renderPropertyCard(property, false))}
              </div>
            )
          ) : (
            myProperties.length === 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, #e0f2fe 0%, #03a9f4 100%)',
                borderRadius: '20px',
                padding: '48px',
                textAlign: 'center',
                color: '#01579b'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏠</div>
                <h2 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: '600' }}>No Active Auctions</h2>
                <p style={{ fontSize: '16px', opacity: '0.8', marginBottom: '24px' }}>
                  You don't have any active auctions. Start your first auction!
                </p>
                <button
                  onClick={() => window.location.href = '/auctions'}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'white',
                    color: '#01579b',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Start New Auction
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {myProperties.map((property) => renderPropertyCard(property, true))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
} 