import { useState } from 'react';
import { parseEther } from 'ethers/lib/utils';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useContract } from '@/hooks/useContract';

interface StartAuctionProps {
  propertyId: number;
  propertyAddress: string;
  onAuctionStarted: () => void;
}

export function StartAuction({ propertyId, propertyAddress, onAuctionStarted }: StartAuctionProps) {
  const [startingPrice, setStartingPrice] = useState('');
  const [duration, setDuration] = useState('');
  const { contract } = useContract();

  const handleStartAuction = async () => {
    if (!contract || !startingPrice || !duration) return;

    try {
      const priceInWei = parseEther(startingPrice);
      const durationInSeconds = parseInt(duration) * 3600; // Convert hours to seconds
      const tx = await contract.startAuction(propertyId, priceInWei, durationInSeconds);
      await tx.wait();
      toast.success("Auction started successfully!", {
        description: `Auction started for property ${propertyAddress} with starting price ${startingPrice} ETH`,
      });
      onAuctionStarted();
    } catch (error: any) {
      toast.error("Error starting auction", {
        description: error.message,
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Start Auction for {propertyAddress}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Starting price in ETH"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            step="0.01"
            min="0"
          />
          <Input
            type="number"
            placeholder="Duration in hours (min: 1, max: 720)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            max="720"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleStartAuction} 
          className="w-full"
          disabled={!startingPrice || !duration || 
                   parseFloat(duration) < 1 || parseFloat(duration) > 720}
        >
          Start Auction
        </Button>
      </CardFooter>
    </Card>
  );
} 