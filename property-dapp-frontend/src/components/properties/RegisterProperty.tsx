'use client';

import { useState } from 'react';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { uploadToPinata } from '@/lib/pinataService';

export function RegisterProperty() {
  const { address } = useAccount();
  const router = useRouter();
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertySize, setPropertySize] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { 
    write: registerProperty,
    data: writeData,
    error: writeError,
    isLoading: isWritePending,
  } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'registerProperty',
  });

  const { 
    isLoading: isWaitingForTransaction,
    isSuccess: isTransactionSuccess,
  } = useWaitForTransaction({
    hash: writeData?.hash,
    onSuccess() {
      toast.success('Property registered successfully!');
      // Reset form
      setPropertyAddress('');
      setPropertySize('');
      setPropertyType('');
      setSelectedFile(null);
      // Refresh the page to update the property list
      router.refresh();
    },
    onError(error) {
      toast.error('Failed to register property: ' + error.message);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a document file');
      return;
    }

    try {
      setIsUploading(true);
      // Replace with your Pinata JWT
      const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
      
      if (!pinataJWT) {
        throw new Error('Pinata JWT not configured');
      }

      // Upload file to IPFS
      const ipfsHash = await uploadToPinata(selectedFile, pinataJWT);

      // Register property with IPFS hash
      registerProperty({
        args: [
          propertyAddress,
          BigInt(Math.floor(parseFloat(propertySize))),
          propertyType,
          ipfsHash,
        ],
      });

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload document or register property');
    } finally {
      setIsUploading(false);
    }
  };

  // Show write operation errors
  if (writeError) {
    console.error('Write error:', writeError);
    toast.error('Failed to submit transaction: ' + writeError.message);
  }

  if (!address) {
    return (
      <Card style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none'
      }}>
        <CardHeader style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
          <CardTitle style={{ color: 'white', fontSize: '24px', marginBottom: '8px' }}>Connect Your Wallet</CardTitle>
          <CardDescription style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
            Please connect your wallet to register a property on the blockchain.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '0',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
    }}>
      <CardHeader style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px 12px 0 0',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
        <CardTitle style={{ color: 'white', fontSize: '20px', marginBottom: '8px' }}>Property Registration</CardTitle>
        <CardDescription style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Register your property on the blockchain with secure documentation
        </CardDescription>
      </CardHeader>
      
      <CardContent style={{ padding: '32px', backgroundColor: 'white', borderRadius: '0 0 12px 12px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label 
              htmlFor="propertyAddress" 
              style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📍 Property Address
            </Label>
            <Input
              id="propertyAddress"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="Enter property address"
              required
              style={{ 
                fontSize: '16px',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label 
              htmlFor="propertySize" 
              style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📐 Size (in square meters)
            </Label>
            <Input
              id="propertySize"
              type="number"
              value={propertySize}
              onChange={(e) => setPropertySize(e.target.value)}
              placeholder="Enter property size"
              required
              style={{ 
                fontSize: '16px',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label 
              htmlFor="propertyType" 
              style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🏢 Property Type
            </Label>
            <Input
              id="propertyType"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              placeholder="e.g., Residential, Commercial"
              required
              style={{ 
                fontSize: '16px',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label 
              htmlFor="document" 
              style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📄 Ownership Document
            </Label>
            <div style={{ 
              position: 'relative',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              backgroundColor: '#f9fafb'
            }}>
              <Input
                id="document"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                required
                style={{ 
                  position: 'absolute',
                  inset: '0',
                  opacity: '0',
                  cursor: 'pointer'
                }}
              />
              <div style={{ pointerEvents: 'none' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                  PDF, DOC, or image files (Max 10MB)
                </p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isUploading || isWritePending || isWaitingForTransaction}
            style={{ 
              width: '100%',
              background: isUploading || isWritePending || isWaitingForTransaction 
                ? '#9ca3af' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '8px',
              cursor: isUploading || isWritePending || isWaitingForTransaction ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!isUploading && !isWritePending && !isWaitingForTransaction) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            {isUploading ? '📤 Uploading Document...' : 
             isWritePending || isWaitingForTransaction ? '⏳ Registering Property...' : 
             '🚀 Register Property'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 