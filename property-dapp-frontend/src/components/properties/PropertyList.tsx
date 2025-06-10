'use client';

import { useEffect, useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { readContract } from '@wagmi/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
  const { data: userPropertyIds } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getOwnerProperties',
    args: [address as `0x${string}`],
    enabled: !!address,
    watch: true,
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
    if (!address || !userPropertyIds) {
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
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Please connect your wallet to view your properties.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Properties</CardTitle>
          <CardDescription>
            Please wait while we fetch your properties...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Properties Found</CardTitle>
          <CardDescription>
            You haven't registered any properties yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Properties</CardTitle>
            <CardDescription>
              Here are all the properties you have registered.
            </CardDescription>
          </div>
          {isNotary && (
            <Button onClick={() => router.push('/notary')} variant="outline">
              Go to Notary Dashboard
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>{property.id}</TableCell>
                <TableCell>{property.propertyAddress}</TableCell>
                <TableCell>{property.propertyType}</TableCell>
                <TableCell>{property.size} sq ft</TableCell>
                <TableCell>
                  {property.isApproved ? 'Approved' : 'Pending'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}