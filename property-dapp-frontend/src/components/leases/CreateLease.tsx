'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';
import { parseEther } from 'viem';
import { toast } from 'sonner';

interface Property {
  id: number;
  propertyAddress: string;
  size: number;
  propertyType: string;
  isActive: boolean;
  isApproved: boolean;
  onAuction: boolean;
  isForSale: boolean;
}

interface LeaseFormData {
  propertyId: string;
  tenantAddress: string;
  monthlyRent: string;
  securityDeposit: string;
  duration: string;
  startDate: string;
}

export default function CreateLease() {
  const { address } = useAccount();
  const [formData, setFormData] = useState<LeaseFormData>({
    propertyId: '',
    tenantAddress: '',
    monthlyRent: '',
    securityDeposit: '',
    duration: '',
    startDate: ''
  });
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [approvedProperties, setApprovedProperties] = useState<Property[]>([]);

  // Fetch user's properties
  const { data: ownerProperties, error: ownerPropertiesError } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getOwnerProperties',
    args: [address as `0x${string}`],
    enabled: !!address,
    onError: (error) => {
      console.warn('getOwnerProperties failed, user may have no properties:', error);
    },
  });

  // Prepare the create lease transaction
  const { config: createLeaseConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'createLeaseAgreement',
    args: [
      BigInt(formData.propertyId || 0),
      formData.tenantAddress as `0x${string}`,
      parseEther(formData.monthlyRent || '0'),
      parseEther(formData.securityDeposit || '0'),
      BigInt(Math.floor(new Date(formData.startDate || Date.now()).getTime() / 1000)),
      BigInt(Math.floor(new Date(formData.startDate || Date.now()).getTime() / 1000) + (Number(formData.duration) * 30 * 24 * 60 * 60)) // Convert months to seconds
    ],
    enabled: !!(
      formData.propertyId &&
      formData.tenantAddress &&
      formData.monthlyRent &&
      formData.securityDeposit &&
      formData.duration &&
      formData.startDate
    ),
  });

  // Execute the create lease transaction
  const { write: createLeaseAgreement, isLoading: isCreatingLease } = useContractWrite({
    ...createLeaseConfig,
    onSuccess: (data) => {
      toast.success('🎉 Lease created successfully!');
      // Reset form
      setFormData({
        propertyId: '',
        tenantAddress: '',
        monthlyRent: '',
        securityDeposit: '',
        duration: '',
        startDate: ''
      });
    },
    onError: (error) => {
      console.error('Error creating lease:', error);
      toast.error('❌ Failed to create lease. Please try again.');
    },
  });

  // Fetch property details for user's properties
  useEffect(() => {
    // If there's an error with getOwnerProperties, assume user has no properties
    if (ownerPropertiesError) {
      console.log('User has no properties or getOwnerProperties failed');
      setUserProperties([]);
      setApprovedProperties([]);
      return;
    }

    if (!ownerProperties || (Array.isArray(ownerProperties) && ownerProperties.length === 0)) {
      setUserProperties([]);
      setApprovedProperties([]);
      return;
    }

    const fetchProperties = async () => {
      try {
        const properties: Property[] = [];
        
        for (const propertyId of ownerProperties as readonly bigint[]) {
          try {
            // Use the actual contract read to get property details
            const result = await readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: CONTRACT_ABI,
              functionName: 'properties',
              args: [propertyId],
            });

            if (result && Array.isArray(result) && result.length >= 16) {
              const property: Property = {
                id: Number(result[0]),
                propertyAddress: result[2] as string,
                size: Number(result[3]),
                propertyType: result[4] as string,
                isActive: result[5] as boolean,
                isApproved: result[14] as boolean,
                onAuction: result[9] as boolean,
                isForSale: result[7] as boolean
              };
              
              properties.push(property);
            }
          } catch (error) {
            console.error(`Error fetching property ${propertyId}:`, error);
          }
        }
        
        setUserProperties(properties);
        setApprovedProperties(properties.filter(p => 
          p.isApproved && 
          p.isActive && 
          !p.onAuction && 
          !p.isForSale
        ));
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('❌ Failed to fetch properties');
      }
    };

    fetchProperties();
  }, [ownerProperties]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('🔌 Please connect your wallet first');
      return;
    }

    // Validate form
    if (!formData.propertyId || !formData.tenantAddress || !formData.monthlyRent || 
        !formData.securityDeposit || !formData.duration || !formData.startDate) {
      toast.error('📝 Please fill in all fields');
      return;
    }

    // Validate tenant address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.tenantAddress)) {
      toast.error('📍 Please enter a valid wallet address for tenant');
      return;
    }

    // Validate that tenant is not the same as landlord
    if (formData.tenantAddress.toLowerCase() === address.toLowerCase()) {
      toast.error('🚫 Tenant cannot be the same as landlord');
      return;
    }

    // Validate start date
    const startDate = new Date(formData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      toast.error('📅 Start date cannot be in the past');
      return;
    }

    // Additional validation: check if selected property is available for lease
    const selectedProperty = userProperties.find(p => p.id === Number(formData.propertyId));
    if (selectedProperty) {
      if (selectedProperty.onAuction) {
        toast.error('🚨 Cannot create lease: Property is currently on auction');
        return;
      }
      if (selectedProperty.isForSale) {
        toast.error('💰 Cannot create lease: Property is currently for sale');
        return;
      }
      if (!selectedProperty.isApproved) {
        toast.error('⏳ Cannot create lease: Property is not yet approved');
        return;
      }
    }

    // Execute the blockchain transaction
    try {
      createLeaseAgreement?.();
    } catch (error) {
      console.error('Error creating lease:', error);
      
      // Check for specific error messages from the smart contract
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Property is currently on auction')) {
        toast.error('🚨 Cannot create lease: Property is currently on auction');
      } else if (errorMessage.includes('Property is currently for sale')) {
        toast.error('💰 Cannot create lease: Property is currently for sale');
      } else {
        toast.error('❌ Failed to create lease. Please try again.');
      }
    }
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
          Please connect your wallet to create a new lease
        </p>
      </div>
    );
  }

  if (approvedProperties.length === 0) {
    // Check if user has properties but they're not available for lease
    const hasProperties = userProperties.length > 0;
    const propertiesOnAuction = userProperties.filter(p => p.onAuction).length;
    const propertiesForSale = userProperties.filter(p => p.isForSale).length;
    const unapprovedProperties = userProperties.filter(p => !p.isApproved).length;
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        color: '#8b4513',
        boxShadow: '0 20px 40px rgba(252, 182, 159, 0.3)'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🏠</div>
        <h3 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>
          {hasProperties ? 'No Properties Available for Lease' : 'No Approved Properties'}
        </h3>
        <div style={{ fontSize: '16px', opacity: '0.8', textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          {hasProperties ? (
            <div>
              <p style={{ marginBottom: '12px' }}>You have {userProperties.length} properties, but none are available for lease:</p>
              <ul style={{ listStyle: 'none', padding: '0' }}>
                {propertiesOnAuction > 0 && (
                  <li style={{ marginBottom: '8px' }}>🚨 {propertiesOnAuction} on auction (cannot lease during auction)</li>
                )}
                {propertiesForSale > 0 && (
                  <li style={{ marginBottom: '8px' }}>💰 {propertiesForSale} for sale (cannot lease while selling)</li>
                )}
                {unapprovedProperties > 0 && (
                  <li style={{ marginBottom: '8px' }}>⏳ {unapprovedProperties} pending approval</li>
                )}
              </ul>
            </div>
          ) : (
            <p>You need to have approved properties before creating leases.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 20px 40px rgba(168, 237, 234, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <span style={{ fontSize: '28px', marginRight: '12px' }}>📋</span>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#2d3748', margin: '0' }}>
          Create New Lease
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Property Selection */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#2d3748', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🏢 Select Property
          </label>
          <select
            name="propertyId"
            value={formData.propertyId}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              fontSize: '16px',
              background: 'white',
              color: '#2d3748',
              transition: 'all 0.3s ease',
              outline: 'none',
              cursor: 'pointer'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4299e1';
              e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="">Select a property...</option>
            {approvedProperties.map((property) => (
              <option key={property.id} value={property.id}>
                Property #{property.id} - {property.propertyAddress} ({property.propertyType})
              </option>
            ))}
          </select>
        </div>

        {/* Tenant Address */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#2d3748', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📍 Tenant Wallet Address
          </label>
          <input
            type="text"
            name="tenantAddress"
            value={formData.tenantAddress}
            onChange={handleInputChange}
            placeholder="0x..."
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              fontSize: '16px',
              background: 'white',
              color: '#2d3748',
              transition: 'all 0.3s ease',
              outline: 'none',
              fontFamily: 'monospace',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4299e1';
              e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Monthly Rent */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#2d3748', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💰 Monthly Rent (ETH)
          </label>
          <input
            type="number"
            name="monthlyRent"
            value={formData.monthlyRent}
            onChange={handleInputChange}
            placeholder="0.1"
            step="0.001"
            min="0"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              fontSize: '16px',
              background: 'white',
              color: '#2d3748',
              transition: 'all 0.3s ease',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4299e1';
              e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Security Deposit */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#2d3748', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔐 Security Deposit (ETH)
          </label>
          <input
            type="number"
            name="securityDeposit"
            value={formData.securityDeposit}
            onChange={handleInputChange}
            placeholder="0.2"
            step="0.001"
            min="0"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              fontSize: '16px',
              background: 'white',
              color: '#2d3748',
              transition: 'all 0.3s ease',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4299e1';
              e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
          <p style={{ fontSize: '14px', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
            💡 Security deposit will be locked until lease termination
          </p>
        </div>

        {/* Duration */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#2d3748', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📅 Lease Duration (months)
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="12"
            min="1"
            max="120"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              fontSize: '16px',
              background: 'white',
              color: '#2d3748',
              transition: 'all 0.3s ease',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4299e1';
              e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Start Date */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#2d3748', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📅 Lease Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              fontSize: '16px',
              background: 'white',
              color: '#2d3748',
              transition: 'all 0.3s ease',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4299e1';
              e.target.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isCreatingLease}
          style={{
            padding: '16px 24px',
            borderRadius: '12px',
            border: 'none',
            background: isCreatingLease 
              ? 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '18px',
            fontWeight: '600',
            cursor: isCreatingLease ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: isCreatingLease 
              ? 'none' 
              : '0 10px 20px rgba(102, 126, 234, 0.3)',
            transform: isCreatingLease ? 'none' : 'translateY(0px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!isCreatingLease) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 15px 30px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCreatingLease) {
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.3)';
            }
          }}
        >
          {isCreatingLease ? (
            <>
              <span className="animate-spin">⏳</span>
              Creating Lease...
            </>
          ) : (
            <>
              📝 Create Lease
            </>
          )}
        </button>

        {isCreatingLease && (
          <div style={{
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            color: '#667eea',
            fontSize: '14px'
          }}>
            💫 Please confirm the transaction in MetaMask to create the lease...
          </div>
        )}
      </form>
    </div>
  );
} 