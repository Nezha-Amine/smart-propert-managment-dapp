'use client';

import { useEffect, useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';

interface Property {
  id: number;
  owner: string;
  propertyAddress: string;
  size: number;
  propertyType: string;
  documentHash: string;
  isApproved: boolean;
}

export function PropertyList() {
  const { address } = useAccount();
  const [properties, setProperties] = useState<Property[]>([]);

  // Get user's properties
  const { data: propertyIds } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPropertiesByOwner',
    args: [address],
  });

  useEffect(() => {
    const fetchProperties = async () => {
      if (!propertyIds) return;
      
      const fetchedProperties = await Promise.all(
        propertyIds.map(async (id: number) => {
          const property = await useContractRead({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getPropertyById',
            args: [id],
          });
          return { ...property, id };
        })
      );
      
      setProperties(fetchedProperties);
    };

    fetchProperties();
  }, [propertyIds]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Properties</CardTitle>
        <CardDescription>
          View and manage your registered properties
        </CardDescription>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <p className="text-muted-foreground">No properties found.</p>
        ) : (
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
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        property.isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {property.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 