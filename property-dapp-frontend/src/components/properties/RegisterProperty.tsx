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
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Please connect your wallet to register a property.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="propertyAddress">Property Address</Label>
          <Input
            id="propertyAddress"
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            placeholder="Enter property address"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertySize">Size (in square meters)</Label>
          <Input
            id="propertySize"
            type="number"
            value={propertySize}
            onChange={(e) => setPropertySize(e.target.value)}
            placeholder="Enter property size"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type</Label>
          <Input
            id="propertyType"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            placeholder="e.g., Residential, Commercial"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document">Ownership Document</Label>
          <Input
            id="document"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            required
          />
          <p className="text-sm text-muted-foreground">
            Upload proof of ownership (PDF, DOC, or image files)
          </p>
        </div>

        <Button 
          type="submit" 
          disabled={isUploading || isWritePending || isWaitingForTransaction}
          className="w-full"
        >
          {isUploading ? 'Uploading Document...' : 
           isWritePending || isWaitingForTransaction ? 'Registering Property...' : 
           'Register Property'}
        </Button>
      </form>
    </Card>
  );
} 