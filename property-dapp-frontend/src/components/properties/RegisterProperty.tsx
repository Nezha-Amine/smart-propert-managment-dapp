import { useState } from 'react';
import { useAccount, useContractWrite } from 'wagmi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';

const formSchema = z.object({
  propertyAddress: z.string().min(5, 'Address must be at least 5 characters'),
  size: z.string().transform((val) => parseInt(val, 10)),
  propertyType: z.string().min(2, 'Property type must be at least 2 characters'),
  documentHash: z.string().min(32, 'Document hash must be at least 32 characters'),
});

export function RegisterProperty() {
  const { address } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyAddress: '',
      size: '',
      propertyType: '',
      documentHash: '',
    },
  });

  const { write: registerProperty } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'registerProperty',
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await registerProperty({
        args: [
          values.propertyAddress,
          values.size,
          values.propertyType,
          values.documentHash,
        ],
      });
      form.reset();
    } catch (error) {
      console.error('Error registering property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <Card>
      <CardHeader>
        <CardTitle>Register New Property</CardTitle>
        <CardDescription>
          Submit your property details for notary approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size (sq ft)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Residential, Commercial, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentHash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Hash</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="IPFS hash or document identifier"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full neon-border"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register Property'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 