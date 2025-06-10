'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';
import { formatEther } from 'viem';
import { toast } from 'sonner';

interface Lease {
  id: number;
  propertyId: number;
  landlord: string;
  tenant: string;
  monthlyRent: bigint;
  securityDeposit: bigint;
  leaseDuration: number;
  startDate: number;
  createdAt: number;
  isActive: boolean;
  isTerminated: boolean;
}

export default function LeaseList() {
  const { address } = useAccount();
  const [userLeases, setUserLeases] = useState<Lease[]>([]);
  const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);
  const [paymentLeaseId, setPaymentLeaseId] = useState<number | null>(null);

  // Fetch user's leases (both as landlord and tenant)
  const { data: landlordLeaseIds, refetch: refetchLandlordLeases } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getLandlordLeases',
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  const { data: tenantLeaseIds, refetch: refetchTenantLeases } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getTenantLeases',
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  // Prepare terminate lease transaction
  const { config: terminateConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'terminateLease',
    args: [BigInt(selectedLeaseId || 0)],
    enabled: !!selectedLeaseId,
  });

  // Prepare pay rent transaction
  const { config: payRentConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'makePayment',
    args: [BigInt(paymentLeaseId || 0), "RENT"],
    value: paymentLeaseId ? userLeases.find(l => l.id === paymentLeaseId)?.monthlyRent || BigInt(0) : BigInt(0),
    enabled: !!paymentLeaseId && userLeases.some(l => l.id === paymentLeaseId),
  });

  // Execute terminate lease transaction
  const { write: terminateLease, isLoading: isTerminating } = useContractWrite({
    ...terminateConfig,
    onSuccess: () => {
      toast.success('🎉 Lease terminated successfully!');
      setSelectedLeaseId(null);
      refetchLandlordLeases();
      refetchTenantLeases();
    },
    onError: (error) => {
      console.error('Error terminating lease:', error);
      toast.error('❌ Failed to terminate lease. Please try again.');
      setSelectedLeaseId(null);
    },
  });

  // Execute pay rent transaction
  const { write: payRent, isLoading: isPayingRent } = useContractWrite({
    ...payRentConfig,
    onSuccess: () => {
      toast.success('💰 Rent payment successful!');
      setPaymentLeaseId(null);
      refetchLandlordLeases();
      refetchTenantLeases();
    },
    onError: (error) => {
      console.error('Error paying rent:', error);
      toast.error('❌ Failed to pay rent. Please try again.');
      setPaymentLeaseId(null);
    },
  });

  // Fetch lease details
  useEffect(() => {
    const allLeaseIds = [
      ...(landlordLeaseIds as readonly bigint[] || []),
      ...(tenantLeaseIds as readonly bigint[] || [])
    ];

    // Remove duplicates
    const uniqueLeaseIds = Array.from(new Set(allLeaseIds.map(id => Number(id))));

    if (uniqueLeaseIds.length === 0) {
      setUserLeases([]);
      return;
    }

    const fetchLeases = async () => {
      try {
        const leases: Lease[] = [];
        
        for (const leaseId of uniqueLeaseIds) {
          try {
            // Use the actual contract read to get lease details
            const result = await readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: CONTRACT_ABI,
              functionName: 'getLeaseById',
              args: [BigInt(leaseId)],
            });

            if (result && typeof result === 'object') {
              const lease: Lease = {
                id: Number(result.id),
                propertyId: Number(result.propertyId),
                landlord: result.landlord as string,
                tenant: result.tenant as string,
                monthlyRent: result.monthlyRent as bigint,
                securityDeposit: result.securityDeposit as bigint,
                leaseDuration: Math.floor((Number(result.endDate) - Number(result.startDate)) / (30 * 24 * 60 * 60)), // Convert seconds to months
                startDate: Number(result.startDate),
                createdAt: Number(result.createdAt),
                isActive: result.isActive as boolean,
                isTerminated: !result.isActive as boolean
              };
              leases.push(lease);
            }
          } catch (error) {
            console.error(`Error fetching lease ${leaseId}:`, error);
          }
        }
        
        setUserLeases(leases);
      } catch (error) {
        console.error('Error fetching leases:', error);
        toast.error('❌ Failed to fetch leases');
      }
    };

    fetchLeases();
  }, [landlordLeaseIds, tenantLeaseIds, address]);

  const handleTerminateLease = (leaseId: number) => {
    setSelectedLeaseId(leaseId);
    terminateLease?.();
  };

  const handlePayRent = (leaseId: number) => {
    setPaymentLeaseId(leaseId);
    payRent?.();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getLeaseStatus = (lease: Lease) => {
    if (lease.isTerminated) return 'terminated';
    
    const endDate = lease.startDate + lease.leaseDuration * 30 * 24 * 60 * 60; // Calculate end date from start + duration
    const now = Math.floor(Date.now() / 1000);
    
    if (now > endDate) return 'expired';
    return 'active';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white'
        };
      case 'expired':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white'
        };
      case 'terminated':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white'
        };
      default:
        return {
          background: '#e5e7eb',
          color: '#374151'
        };
    }
  };

  const getUserRole = (lease: Lease) => {
    if (!address) return null;
    return lease.landlord.toLowerCase() === address.toLowerCase() ? 'landlord' : 'tenant';
  };

  if (!address) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔌</div>
        <h3 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>Connect Your Wallet</h3>
        <p style={{ fontSize: '16px', opacity: '0.9' }}>
          Please connect your wallet to view your leases
        </p>
      </div>
    );
  }

  if (userLeases.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        color: '#92400e',
        boxShadow: '0 20px 40px rgba(252, 211, 77, 0.3)'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>📄</div>
        <h3 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>No Leases Found</h3>
        <p style={{ fontSize: '16px', opacity: '0.8' }}>
          You don't have any leases yet. Create your first lease agreement!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 20px 40px rgba(14, 165, 233, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <span style={{ fontSize: '28px', marginRight: '12px' }}>📋</span>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0' }}>
          Your Leases
        </h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>🆔 Lease ID</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>🏢 Property</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>👤 Role</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>💰 Monthly Rent</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>🔐 Security Deposit</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>📅 Duration</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>📊 Status</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>⚡ Actions</th>
            </tr>
          </thead>
          <tbody>
            {userLeases.map((lease, index) => {
              const status = getLeaseStatus(lease);
              const userRole = getUserRole(lease);
              const statusStyle = getStatusStyle(status);
              
              return (
                <tr 
                  key={lease.id}
                  style={{
                    background: index % 2 === 0 ? '#f8fafc' : 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? '#f8fafc' : 'white';
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }}
                >
                  <td style={{ 
                    padding: '16px', 
                    fontFamily: 'monospace', 
                    fontWeight: '600',
                    color: '#3730a3'
                  }}>
                    #{lease.id}
                  </td>
                  <td style={{ padding: '16px', color: '#1e293b' }}>
                    Property #{lease.propertyId}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: userRole === 'landlord' 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white'
                    }}>
                      {userRole === 'landlord' ? '🏠 Landlord' : '🏡 Tenant'}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    fontFamily: 'monospace', 
                    fontWeight: '600',
                    color: '#059669'
                  }}>
                    {formatEther(lease.monthlyRent)} ETH
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    fontFamily: 'monospace', 
                    fontWeight: '600',
                    color: '#dc2626'
                  }}>
                    {formatEther(lease.securityDeposit)} ETH
                  </td>
                  <td style={{ padding: '16px', color: '#1e293b' }}>
                    {lease.leaseDuration} months
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      ...statusStyle
                    }}>
                      {status === 'active' && '✅'}
                      {status === 'expired' && '⏰'}
                      {status === 'terminated' && '❌'}
                      {' '}{status}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Landlord Actions */}
                      {userRole === 'landlord' && status === 'active' && (
                        <button
                          onClick={() => handleTerminateLease(lease.id)}
                          disabled={isTerminating && selectedLeaseId === lease.id}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isTerminating && selectedLeaseId === lease.id
                              ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: isTerminating && selectedLeaseId === lease.id ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => {
                            if (!(isTerminating && selectedLeaseId === lease.id)) {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!(isTerminating && selectedLeaseId === lease.id)) {
                              e.target.style.transform = 'translateY(0px)';
                              e.target.style.boxShadow = 'none';
                            }
                          }}
                        >
                          {isTerminating && selectedLeaseId === lease.id ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Terminating...
                            </>
                          ) : (
                            <>
                              🚫 Terminate
                            </>
                          )}
                        </button>
                      )}

                      {/* Tenant Actions */}
                      {userRole === 'tenant' && status === 'active' && (
                        <button
                          onClick={() => handlePayRent(lease.id)}
                          disabled={isPayingRent && paymentLeaseId === lease.id}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isPayingRent && paymentLeaseId === lease.id
                              ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: isPayingRent && paymentLeaseId === lease.id ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => {
                            if (!(isPayingRent && paymentLeaseId === lease.id)) {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!(isPayingRent && paymentLeaseId === lease.id)) {
                              e.target.style.transform = 'translateY(0px)';
                              e.target.style.boxShadow = 'none';
                            }
                          }}
                        >
                          {isPayingRent && paymentLeaseId === lease.id ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Paying...
                            </>
                          ) : (
                            <>
                              💰 Pay Rent ({formatEther(lease.monthlyRent)} ETH)
                            </>
                          )}
                        </button>
                      )}

                      {/* No actions available */}
                      {status !== 'active' && (
                        <span style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          fontStyle: 'italic'
                        }}>
                          No actions available
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isTerminating && (
        <div style={{
          marginTop: '20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          color: '#ef4444',
          fontSize: '14px'
        }}>
          💫 Please confirm the transaction in MetaMask to terminate the lease...
        </div>
      )}

      {isPayingRent && (
        <div style={{
          marginTop: '20px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          color: '#10b981',
          fontSize: '14px'
        }}>
          💫 Please confirm the rent payment transaction in MetaMask...
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <h4 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1e40af', 
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          💡 Lease Management Tips
        </h4>
        <ul style={{ 
          fontSize: '14px', 
          color: '#1e40af', 
          margin: '0',
          paddingLeft: '20px',
          lineHeight: '1.6'
        }}>
          <li>🏠 <strong>Landlords</strong> can terminate active leases</li>
          <li>🏡 <strong>Tenants</strong> can pay monthly rent directly through smart contracts</li>
          <li>💰 Rent payments are transferred automatically to landlords</li>
          <li>🔐 Security deposits are automatically handled by smart contracts</li>
          <li>⏰ Leases automatically expire after the specified duration</li>
          <li>📊 All payments are recorded on the blockchain for transparency</li>
        </ul>
      </div>
    </div>
  );
} 