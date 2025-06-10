'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { readContract } from '@wagmi/core';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getIpfsUrl } from '@/lib/pinataService';
import { toast } from 'sonner';

interface Property {
  id: number;
  owner: `0x${string}`;
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

export function NotaryDashboard() {
  const { address } = useAccount();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNotary, setIsNotary] = useState(false);

  // Check if current user is notary
  const { data: notaryAddress } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'notary',
    watch: true,
  });

  // Get pending property IDs
  const { data: pendingIds, refetch: refetchPendingIds } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getPendingProperties',
    watch: true,
  });

  // Contract write functions for approval/rejection
  const { write: approveProperty, data: approveData } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'approveProperty',
  });

  const { write: rejectProperty, data: rejectData } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'rejectProperty',
  });

  // Check if user is notary
  useEffect(() => {
    if (address && notaryAddress) {
      setIsNotary(address.toLowerCase() === notaryAddress.toLowerCase());
    }
  }, [address, notaryAddress]);

  // Wait for transactions
  useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess: () => {
      toast.success('Property approved successfully!');
      refetchPendingIds(); // Refetch pending properties after approval
    },
  });

  useWaitForTransaction({
    hash: rejectData?.hash,
    onSuccess: () => {
      toast.success('Property rejected successfully!');
      refetchPendingIds(); // Refetch pending properties after rejection
    },
  });

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      if (!pendingIds || !isNotary) return;

      try {
        setLoading(true);
        console.log('Fetching pending properties:', pendingIds);
        
        const propertyPromises = (pendingIds as bigint[]).map(async (id) => {
          try {
            const result = await readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: CONTRACT_ABI,
              functionName: 'properties',
              args: [id],
            });

            if (!result) return null;

            return {
              id: Number(result[0]),
              owner: result[1] as `0x${string}`,
              propertyAddress: result[2],
              size: Number(result[3]),
              propertyType: result[4],
              isActive: result[5],
              createdAt: Number(result[6]),
              isForSale: result[7],
              salePrice: Number(result[8]),
              onAuction: result[9],
              auctionEndTime: Number(result[10]),
              highestBidder: result[11],
              highestBid: Number(result[12]),
              auctionEnded: result[13],
              isApproved: result[14],
              documentHash: result[15],
            } as Property;
          } catch (error) {
            console.error(`Error fetching property ${id}:`, error);
            return null;
          }
        });

        const fetchedProperties = (await Promise.all(propertyPromises))
          .filter((p): p is Property => p !== null);
        console.log('Fetched properties:', fetchedProperties);
        
        setProperties(fetchedProperties);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [pendingIds, isNotary]); // Re-run when pendingIds or isNotary changes

  const handleApprove = async (propertyId: number) => {
    try {
      approveProperty({
        args: [BigInt(propertyId)],
      });
    } catch (error) {
      console.error('Error approving property:', error);
      toast.error('Failed to approve property');
    }
  };

  const handleReject = async (propertyId: number) => {
    try {
      rejectProperty({
        args: [BigInt(propertyId)],
      });
    } catch (error) {
      console.error('Error rejecting property:', error);
      toast.error('Failed to reject property');
    }
  };

  if (!isNotary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Only the notary can access this dashboard.
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
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please wait while we fetch the properties...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Pending Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            There are no properties waiting for approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Properties ({properties.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>{property.id}</TableCell>
                <TableCell>{property.owner.slice(0, 6)}...{property.owner.slice(-4)}</TableCell>
                <TableCell>{property.propertyAddress}</TableCell>
                <TableCell>{property.propertyType}</TableCell>
                <TableCell>{property.size} sq ft</TableCell>
                <TableCell>
                  <a
                    href={getIpfsUrl(property.documentHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View Document
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApprove(property.id)}
                      variant="outline"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(property.id)}
                      variant="outline"
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 