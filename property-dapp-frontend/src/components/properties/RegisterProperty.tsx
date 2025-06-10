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
    onError(error) {
      console.error('Contract write error:', error);
      const errorMessage = error.message || 'Unknown transaction error';
      toast.error('Transaction failed: ' + errorMessage);
    },
    onSuccess(data) {
      console.log('Transaction submitted successfully:', data);
      toast.success('Transaction submitted! Waiting for confirmation...');
    }
  });

  const { 
    isLoading: isWaitingForTransaction,
    isSuccess: isTransactionSuccess,
  } = useWaitForTransaction({
    hash: writeData?.hash,
    onSuccess(data) {
      console.log('Transaction confirmed:', data);
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
      console.error('Transaction confirmation error:', error);
      toast.error('Transaction failed: ' + error.message);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Comprehensive input validation
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!propertyAddress.trim()) {
      toast.error('Please enter a property address');
      return;
    }
    
    if (!propertySize || isNaN(parseFloat(propertySize)) || parseFloat(propertySize) <= 0) {
      toast.error('Please enter a valid property size (positive number)');
      return;
    }
    
    if (!propertyType.trim()) {
      toast.error('Please enter a property type');
      return;
    }
    
    if (!selectedFile) {
      toast.error('Please select a document file');
      return;
    }
    
    // Check file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Check Pinata JWT configuration
      const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
      if (!pinataJWT) {
        throw new Error('Pinata JWT not configured in environment variables');
      }

      console.log('Starting file upload to IPFS...', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });
      
      // Upload file to IPFS
      const ipfsHash = await uploadToPinata(selectedFile, pinataJWT);
      console.log('File successfully uploaded to IPFS:', ipfsHash);
      
      // Prepare transaction arguments with proper typing
      const transactionArgs: [string, bigint, string, string] = [
        propertyAddress.trim(),
        BigInt(Math.floor(parseFloat(propertySize))),
        propertyType.trim(),
        ipfsHash,
      ];
      
      console.log('Preparing blockchain transaction with args:', {
        propertyAddress: propertyAddress.trim(),
        size: Math.floor(parseFloat(propertySize)),
        propertyType: propertyType.trim(),
        documentHash: ipfsHash,
        contractAddress: CONTRACT_ADDRESS,
        userAddress: address
      });
      
      // Validate that registerProperty function exists
      if (!registerProperty) {
        throw new Error('Contract function not available. Please refresh the page and try again.');
      }
      
      // Submit transaction to blockchain
      console.log('Submitting transaction to blockchain...');
      registerProperty({
        args: transactionArgs,
      });

    } catch (error: any) {
      console.error('Error in property registration:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'An unexpected error occurred';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 4001) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.code === -32603) {
        errorMessage = 'Internal blockchain error. Please try again.';
      } else if (error.toString().includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.toString().includes('gas')) {
        errorMessage = 'Gas estimation failed. Please try again with more gas.';
      }
      
      toast.error('Registration failed: ' + errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Log any write errors
  if (writeError) {
    console.error('Write error details:', {
      error: writeError,
      message: writeError.message,
      cause: writeError.cause,
      stack: writeError.stack
    });
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