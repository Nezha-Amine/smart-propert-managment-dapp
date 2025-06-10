import { useState } from 'react';
import { ethers } from 'ethers';
import { useContract } from '@/hooks/useContract';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';

interface Property {
  id: number;
  owner: string;
  propertyAddress: string;
  size: number;
  propertyType: string;
  onAuction: boolean;
  auctionEndTime: number;
  highestBidder: string;
  highestBid: number;
  auctionEnded: boolean;
}

interface AuctionCardProps {
  property: Property;
  onBidPlaced?: () => void;
  onAuctionEnded?: () => void;
}

export function AuctionCard({ property, onBidPlaced, onAuctionEnded }: AuctionCardProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { contract } = useContract();
  const { address } = useAccount();

  const isOwner = address === property.owner;
  const isHighestBidder = address === property.highestBidder;
  const auctionEnded = property.auctionEnded || Date.now() / 1000 > property.auctionEndTime;
  const timeLeft = Math.max(0, property.auctionEndTime - Date.now() / 1000);

  const handlePlaceBid = async () => {
    if (!contract || !bidAmount) return;

    try {
      setIsLoading(true);
      const bidInWei = ethers.utils.parseEther(bidAmount);
      
      if (bidInWei.lte(ethers.BigNumber.from(property.highestBid))) {
        toast.error('Bid must be higher than the current highest bid');
        return;
      }

      const tx = await contract.placeBid(property.id, { value: bidInWei });
      
      toast.promise(tx.wait(), {
        loading: 'Placing bid...',
        success: 'Bid placed successfully!',
        error: 'Failed to place bid'
      });

      await tx.wait();
      setBidAmount('');
      onBidPlaced?.();
    } catch (error: any) {
      console.error('Error placing bid:', error);
      toast.error(error.message || 'Failed to place bid');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndAuction = async () => {
    if (!contract) return;

    try {
      setIsLoading(true);
      const tx = await contract.endAuction(property.id);
      
      toast.promise(tx.wait(), {
        loading: 'Ending auction...',
        success: 'Auction ended successfully!',
        error: 'Failed to end auction'
      });

      await tx.wait();
      onAuctionEnded?.();
    } catch (error: any) {
      console.error('Error ending auction:', error);
      toast.error(error.message || 'Failed to end auction');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return 'Ended';
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{property.propertyAddress}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p>Type: {property.propertyType}</p>
          <p>Size: {property.size} sq ft</p>
          <p>Current Bid: {ethers.utils.formatEther(property.highestBid.toString())} ETH</p>
          <p>Highest Bidder: {property.highestBidder}</p>
          <p>Time Left: {formatTimeLeft(timeLeft)}</p>
        </div>

        {!auctionEnded && !isOwner && (
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Bid amount (ETH)"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min={ethers.utils.formatEther(property.highestBid.toString())}
              step="0.01"
            />
            <Button
              onClick={handlePlaceBid}
              disabled={isLoading || !bidAmount}
              className="w-full"
            >
              {isLoading ? 'Placing Bid...' : 'Place Bid'}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {auctionEnded ? (
          <div className="w-full text-center">
            <p className="text-lg font-semibold">Auction Ended</p>
            {isHighestBidder && (
              <p className="text-green-600">Congratulations! You won the auction!</p>
            )}
          </div>
        ) : (
          isOwner && (
            <Button
              onClick={handleEndAuction}
              disabled={isLoading || timeLeft > 0}
              className="w-full"
            >
              {timeLeft > 0 ? 'Cannot End Yet' : 'End Auction'}
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
} 