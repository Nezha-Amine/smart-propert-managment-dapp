import { useState } from 'react';
import { ethers } from 'ethers';
import { useContract } from '@/hooks/useContract';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface StartAuctionProps {
  propertyId: number;
  onAuctionStarted?: () => void;
}

export function StartAuction({ propertyId, onAuctionStarted }: StartAuctionProps) {
  const [startingPrice, setStartingPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { startAuction } = useContract();

  const handleStartAuction = async () => {
    if (!startingPrice || !duration) {
      toast.error('Please fill in both starting price and duration');
      return;
    }

    if (parseFloat(startingPrice) <= 0) {
      toast.error('Starting price must be greater than 0');
      return;
    }

    if (parseInt(duration) <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }

    try {
      setIsLoading(true);
      await startAuction(
        propertyId,
        startingPrice,
        parseInt(duration)
      );
      
      toast.success('Auction started successfully!');
      setStartingPrice('');
      setDuration('');
      onAuctionStarted?.();
    } catch (error: any) {
      console.error('Error starting auction:', error);
      toast.error(error.message || 'Failed to start auction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="startingPrice">Starting Price (ETH)</Label>
        <Input
          id="startingPrice"
          type="number"
          placeholder="0.1"
          value={startingPrice}
          onChange={(e) => setStartingPrice(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="duration">Duration (Hours)</Label>
        <Input
          id="duration"
          type="number"
          placeholder="24"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min="1"
          step="1"
          required
        />
      </div>

      <Button
        onClick={handleStartAuction}
        disabled={isLoading || !startingPrice || !duration}
        className="w-full"
      >
        {isLoading ? 'Starting Auction...' : 'Start Auction'}
      </Button>
    </div>
  );
} 