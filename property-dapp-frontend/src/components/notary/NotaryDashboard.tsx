'use client';

import { useEffect, useState } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';

interface Property {
  id: number;
  owner: string;
  propertyAddress: string;
  size: number;
  propertyType: string;
  documentHash: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function NotaryDashboard() {
  const { address } = useAccount();
  const [isNotary, setIsNotary] = useState(false);
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);

  // Check if current user is notary
  const { data: notaryAddress } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'notary',
  });

  // Get pending properties
  const { data: pendingIds } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPendingProperties',
  });

  // Contract writes
  const { write: approveProperty } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'approveProperty',
  });

  const { write: rejectProperty } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'rejectProperty',
  });

  useEffect(() => {
    if (address && notaryAddress) {
      setIsNotary(address.toLowerCase() === notaryAddress.toLowerCase());
    }
  }, [address, notaryAddress]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!pendingIds) return;
      
      const properties = await Promise.all(
        pendingIds.map(async (id: number) => {
          const property = await useContractRead({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getPropertyById',
            args: [id],
          });
          return { ...property, id, status: 'pending' };
        })
      );
      
      setPendingProperties(properties);
    };

    fetchProperties();
  }, [pendingIds]);

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

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Properties</CardTitle>
          <CardDescription>
            Review and manage property registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingProperties.length === 0 ? (
            <p className="text-muted-foreground">No properties pending approval.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>{property.id}</TableCell>
                    <TableCell>{property.propertyAddress}</TableCell>
                    <TableCell>{property.owner.slice(0, 6)}...{property.owner.slice(-4)}</TableCell>
                    <TableCell>{property.propertyType}</TableCell>
                    <TableCell>{property.size} sq ft</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="neon-border"
                          onClick={() => approveProperty({ args: [property.id] })}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => rejectProperty({ args: [property.id] })}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 