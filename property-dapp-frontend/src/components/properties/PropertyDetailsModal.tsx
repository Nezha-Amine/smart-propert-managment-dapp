'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';
import { formatEther } from 'viem';

interface Property {
  id: number;
  owner: string;
  propertyAddress: string;
  size: number;
  propertyType: string;
  isActive: boolean;
  createdAt: number;
  isForSale: boolean;
  salePrice: bigint;
  onAuction: boolean;
  auctionEndTime: number;
  highestBidder: string;
  highestBid: bigint;
  auctionEnded: boolean;
  isApproved: boolean;
  documentHash: string;
}

interface Lease {
  id: number;
  propertyId: number;
  landlord: string;
  tenant: string;
  monthlyRent: bigint;
  securityDeposit: bigint;
  startDate: number;
  endDate: number;
  isActive: boolean;
  createdAt: number;
  isRenewal: boolean;
}

interface OwnershipRecord {
  owner: string;
  transferDate: number;
  salePrice: bigint;
}

interface PropertyDetailsModalProps {
  propertyId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyDetailsModal({ propertyId, isOpen, onClose }: PropertyDetailsModalProps) {
  const { address } = useAccount();
  const [property, setProperty] = useState<Property | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [ownershipHistory, setOwnershipHistory] = useState<OwnershipRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'leases' | 'history'>('info');

  // Fetch property details
  useEffect(() => {
    if (isOpen && propertyId) {
      fetchPropertyDetails();
    }
  }, [isOpen, propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch property information
      const result = await readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'properties',
        args: [BigInt(propertyId)],
      });

      if (result && Array.isArray(result) && result.length >= 16) {
        const propertyData: Property = {
          id: Number(result[0]),
          owner: result[1] as string,
          propertyAddress: result[2] as string,
          size: Number(result[3]),
          propertyType: result[4] as string,
          isActive: result[5] as boolean,
          createdAt: Number(result[6]),
          isForSale: result[7] as boolean,
          salePrice: result[8] as bigint,
          onAuction: result[9] as boolean,
          auctionEndTime: Number(result[10]),
          highestBidder: result[11] as string,
          highestBid: result[12] as bigint,
          auctionEnded: result[13] as boolean,
          isApproved: result[14] as boolean,
          documentHash: result[15] as string,
        };
        setProperty(propertyData);
      }

      // Fetch lease history
      try {
        const leaseIds = await readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'getPropertyLeases',
          args: [BigInt(propertyId)],
        });

        if (leaseIds && Array.isArray(leaseIds)) {
          const leasePromises = leaseIds.map(async (leaseId: bigint) => {
            const leaseDetails = await readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: CONTRACT_ABI,
              functionName: 'getLeaseDetails',
              args: [leaseId],
            });

            if (leaseDetails && Array.isArray(leaseDetails)) {
              return {
                id: Number(leaseId),
                propertyId: Number(leaseDetails[0]),
                landlord: leaseDetails[1] as string,
                tenant: leaseDetails[2] as string,
                monthlyRent: leaseDetails[3] as bigint,
                securityDeposit: leaseDetails[4] as bigint,
                startDate: Number(leaseDetails[5]),
                endDate: Number(leaseDetails[6]),
                isActive: leaseDetails[7] as boolean,
                createdAt: Number(leaseDetails[8]),
                isRenewal: leaseDetails[9] as boolean,
              };
            }
            return null;
          });

          const fetchedLeases = await Promise.all(leasePromises);
          setLeases(fetchedLeases.filter(lease => lease !== null) as Lease[]);
        }
      } catch (error) {
        console.error('Error fetching lease history:', error);
        setLeases([]);
      }

      // Fetch ownership history
      try {
        const ownershipData = await readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'getPropertyOwnershipHistory',
          args: [BigInt(propertyId)],
        });

        if (ownershipData && Array.isArray(ownershipData) && ownershipData.length === 3) {
          const owners = ownershipData[0] as string[];
          const dates = ownershipData[1] as bigint[];
          const prices = ownershipData[2] as bigint[];

          const history: OwnershipRecord[] = owners.map((owner, index) => ({
            owner,
            transferDate: Number(dates[index]),
            salePrice: prices[index],
          }));

          setOwnershipHistory(history);
        }
      } catch (error) {
        console.error('Error fetching ownership history:', error);
        setOwnershipHistory([]);
      }
      
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusBadge = () => {
    if (!property) return null;
    
    if (property.onAuction) {
      return (
        <span style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          🔥 ON AUCTION
        </span>
      );
    }
    
    if (property.isForSale) {
      return (
        <span style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          💰 FOR SALE
        </span>
      );
    }
    
    if (property.isActive) {
      return (
        <span style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          ✅ ACTIVE
        </span>
      );
    }
    
    return (
      <span style={{
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        ⏳ PENDING
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>
              🏠 Property #{propertyId}
            </h2>
            {property && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px', opacity: '0.9' }}>
                  {property.propertyAddress}
                </span>
                {getStatusBadge()}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px',
              color: 'white',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          {[
            { key: 'info', label: '📋 Property Info', icon: '📋' },
            { key: 'leases', label: '📝 Lease History', icon: '📝' },
            { key: 'history', label: '📊 Ownership History', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                padding: '16px',
                border: 'none',
                background: activeTab === tab.key ? 'white' : 'transparent',
                borderBottom: activeTab === tab.key ? '3px solid #667eea' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: activeTab === tab.key ? '#667eea' : '#6b7280',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          flex: 1,
          overflow: 'auto'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
              <p style={{ color: '#6b7280' }}>Loading property details...</p>
            </div>
          ) : property ? (
            <>
              {activeTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Basic Information */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #0ea5e9'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0c4a6e', marginBottom: '16px' }}>
                      📋 Basic Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>ADDRESS</label>
                        <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>{property.propertyAddress}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>TYPE</label>
                        <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>{property.propertyType}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SIZE</label>
                        <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>{property.size} m²</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>CREATED</label>
                        <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>{formatDate(property.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ownership Information */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #f59e0b'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#92400e', marginBottom: '16px' }}>
                      👤 Ownership Information
                    </h3>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>CURRENT OWNER</label>
                      <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                        {formatAddress(property.owner)}
                        {property.owner.toLowerCase() === address?.toLowerCase() && (
                          <span style={{ marginLeft: '8px', color: '#059669', fontWeight: '600' }}>(You)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Sale/Auction Information */}
                  {(property.onAuction || property.isForSale) && (
                    <div style={{
                      background: property.onAuction 
                        ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                        : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      padding: '20px',
                      borderRadius: '12px',
                      border: property.onAuction ? '1px solid #ef4444' : '1px solid #22c55e'
                    }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: property.onAuction ? '#991b1b' : '#166534', 
                        marginBottom: '16px' 
                      }}>
                        {property.onAuction ? '🔥 Auction Information' : '💰 Sale Information'}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {property.onAuction ? (
                          <>
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>HIGHEST BID</label>
                              <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>
                                {formatEther(property.highestBid)} ETH
                              </p>
                            </div>
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>AUCTION ENDS</label>
                              <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>
                                {new Date(property.auctionEndTime * 1000).toLocaleString()}
                              </p>
                            </div>
                            {property.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                              <div>
                                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>HIGHEST BIDDER</label>
                                <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                                  {formatAddress(property.highestBidder)}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SALE PRICE</label>
                            <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>
                              {formatEther(property.salePrice)} ETH
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Document Information */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #8b5cf6'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#5b21b6', marginBottom: '16px' }}>
                      📄 Documentation
                    </h3>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>IPFS DOCUMENT HASH</label>
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#1f2937', 
                        margin: '4px 0 0 0', 
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}>
                        {property.documentHash}
                      </p>
                      <a
                        href={`https://ipfs.io/ipfs/${property.documentHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          marginTop: '8px',
                          padding: '6px 12px',
                          background: '#8b5cf6',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        📎 View Document
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'leases' && (
                <div>
                  {leases.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ fontSize: '60px', marginBottom: '16px' }}>📝</div>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                        No Lease History
                      </h3>
                      <p style={{ color: '#6b7280' }}>
                        This property has never been leased or no lease agreements have been found.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                        📝 Lease History ({leases.length} agreements)
                      </h3>
                      {leases
                        .sort((a, b) => b.createdAt - a.createdAt) // Sort by newest first
                        .map((lease, index) => (
                        <div
                          key={lease.id}
                          style={{
                            background: lease.isActive 
                              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                              : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: lease.isActive ? '1px solid #22c55e' : '1px solid #cbd5e1'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                            <div>
                              <h4 style={{ 
                                fontSize: '16px', 
                                fontWeight: '600', 
                                color: lease.isActive ? '#166534' : '#475569',
                                margin: '0 0 4px 0'
                              }}>
                                Lease Agreement #{lease.id}
                                {lease.isRenewal && (
                                  <span style={{
                                    marginLeft: '8px',
                                    padding: '2px 8px',
                                    background: '#fbbf24',
                                    color: 'white',
                                    fontSize: '10px',
                                    borderRadius: '4px',
                                    fontWeight: '600'
                                  }}>
                                    RENEWAL
                                  </span>
                                )}
                              </h4>
                              <p style={{ 
                                fontSize: '12px', 
                                color: lease.isActive ? '#059669' : '#64748b',
                                margin: '0'
                              }}>
                                Created: {formatDate(lease.createdAt)}
                              </p>
                            </div>
                            <span style={{
                              background: lease.isActive 
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {lease.isActive ? '🟢 ACTIVE' : '🔴 ENDED'}
                            </span>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>TENANT</label>
                              <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                                {formatAddress(lease.tenant)}
                                {lease.tenant.toLowerCase() === address?.toLowerCase() && (
                                  <span style={{ marginLeft: '8px', color: '#059669', fontWeight: '600' }}>(You)</span>
                                )}
                              </p>
                            </div>
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>MONTHLY RENT</label>
                              <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>
                                {formatEther(lease.monthlyRent)} ETH
                              </p>
                            </div>
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SECURITY DEPOSIT</label>
                              <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>
                                {formatEther(lease.securityDeposit)} ETH
                              </p>
                            </div>
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>LEASE PERIOD</label>
                              <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>
                                {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  {ownershipHistory.length <= 1 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ fontSize: '60px', marginBottom: '16px' }}>📊</div>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                        No Ownership Transfers
                      </h3>
                      <p style={{ color: '#6b7280' }}>
                        This property has had only one owner since registration. No transfers have occurred.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                        📊 Ownership History ({ownershipHistory.length} records)
                      </h3>
                      {ownershipHistory.map((record, index) => (
                        <div
                          key={index}
                          style={{
                            background: index === 0 
                              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                              : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: index === 0 ? '1px solid #f59e0b' : '1px solid #cbd5e1'
                          }}
                        >
                                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                             <div>
                               <h4 style={{ 
                                 fontSize: '16px', 
                                 fontWeight: '600', 
                                 color: index === 0 ? '#92400e' : (index === ownershipHistory.length - 1) ? '#166534' : '#475569',
                                 margin: '0 0 4px 0'
                               }}>
                                 {index === 0 
                                   ? '👑 Current Owner' 
                                   : index === ownershipHistory.length - 1 
                                     ? '🏠 Original Owner' 
                                     : `📋 Previous Owner #${ownershipHistory.length - index - 1}`
                                 }
                               </h4>
                               <p style={{ 
                                 fontSize: '12px', 
                                 color: index === 0 ? '#d97706' : (index === ownershipHistory.length - 1) ? '#059669' : '#64748b',
                                 margin: '0'
                               }}>
                                 {index === 0 
                                   ? 'Acquired Property' 
                                   : index === ownershipHistory.length - 1 
                                     ? 'Property Registration' 
                                     : 'Ownership Transfer'
                                 }: {formatDate(record.transferDate)}
                               </p>
                             </div>
                            {index === 0 && (
                              <span style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                🟢 ACTIVE
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: record.salePrice > 0 ? '1fr 1fr' : '1fr', gap: '16px' }}>
                            <div>
                              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>OWNER ADDRESS</label>
                              <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                                {formatAddress(record.owner)}
                                {record.owner.toLowerCase() === address?.toLowerCase() && (
                                  <span style={{ marginLeft: '8px', color: '#059669', fontWeight: '600' }}>(You)</span>
                                )}
                              </p>
                            </div>
                            {record.salePrice > 0 && (
                              <div>
                                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SALE PRICE</label>
                                <p style={{ fontSize: '14px', color: '#1f2937', margin: '4px 0 0 0' }}>
                                  {formatEther(record.salePrice)} ETH
                                </p>
                              </div>
                            )}
                          </div>
                          
                                                     {index === ownershipHistory.length - 1 && record.salePrice === 0n && (
                             <div style={{
                               marginTop: '12px',
                               padding: '12px',
                               background: 'rgba(16, 185, 129, 0.1)',
                               borderRadius: '8px',
                               border: '1px solid rgba(16, 185, 129, 0.2)'
                             }}>
                               <p style={{ fontSize: '12px', color: '#065f46', margin: 0, fontWeight: '600' }}>
                                 🏠 This is the original owner who first registered the property on the blockchain.
                               </p>
                             </div>
                           )}
                           {index === 0 && record.salePrice > 0n && (
                             <div style={{
                               marginTop: '12px',
                               padding: '12px',
                               background: 'rgba(249, 115, 22, 0.1)',
                               borderRadius: '8px',
                               border: '1px solid rgba(249, 115, 22, 0.2)'
                             }}>
                               <p style={{ fontSize: '12px', color: '#ea580c', margin: 0, fontWeight: '600' }}>
                                 🎯 {record.owner.toLowerCase() === address?.toLowerCase() 
                                   ? `You acquired this property through ${record.salePrice > 0n ? 'auction/purchase' : 'initial registration'} for ${formatEther(record.salePrice)} ETH.`
                                   : `This property was acquired through ${record.salePrice > 0n ? 'auction/purchase' : 'initial registration'} for ${formatEther(record.salePrice)} ETH.`
                                 }
                               </p>
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>❌</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                Property Not Found
              </h3>
              <p style={{ color: '#6b7280' }}>
                Could not load details for property #{propertyId}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 