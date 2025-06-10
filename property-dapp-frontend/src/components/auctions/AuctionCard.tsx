import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'ethers/lib/utils';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useContract } from '@/hooks/useContract';

interface AuctionCardProps {
  propertyId: number;
  propertyAddress: string;
  startingPrice: string;
  endTime: number;
  highestBid: string;
  highestBidder: string;
  currentUserAddress: string;
  isOwner: boolean;
  onAuction: boolean;
  onRefresh: () => void;
}

export function AuctionCard({
  propertyId,
  propertyAddress,
  startingPrice,
  endTime,
  highestBid,
  highestBidder,
  currentUserAddress,
  isOwner,
  onAuction,
  onRefresh
}: AuctionCardProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { contract } = useContract();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      if (endTime > now) {
        const diff = endTime - now;
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Auction ended');
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const handleBid = async () => {
    if (!contract || !bidAmount) return;

    try {
      const bidValue = parseEther(bidAmount);
      const tx = await contract.placeBid(propertyId, { value: bidValue });
      await tx.wait();
      toast.success("Bid placed successfully!", {
        description: `You have bid ${bidAmount} ETH on property ${propertyAddress}`,
      });
      onRefresh();
    } catch (error: any) {
      toast.error("Error placing bid", {
        description: error.message,
      });
    }
  };

  const handleEndAuction = async () => {
    if (!contract) return;

    try {
      const tx = await contract.endAuction(propertyId);
      await tx.wait();
      toast.success("Auction ended successfully!", {
        description: `The auction for property ${propertyAddress} has been ended`,
      });
      onRefresh();
    } catch (error: any) {
      toast.error("Error ending auction", {
        description: error.message,
      });
    }
  };

  const canEndAuction = (isOwner || currentUserAddress.toLowerCase() === highestBidder.toLowerCase()) && 
                       onAuction && 
                       endTime < Math.floor(Date.now() / 1000);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Property: {propertyAddress}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p>Starting Price: {formatEther(startingPrice)} ETH</p>
          <p>Highest Bid: {formatEther(highestBid)} ETH</p>
          <p>Highest Bidder: {highestBidder === '0x0000000000000000000000000000000000000000' ? 'No bids yet' : 
            `${highestBidder.slice(0, 6)}...${highestBidder.slice(-4)}`}</p>
          <p>Time Left: {timeLeft}</p>
        </div>
        {onAuction && endTime > Math.floor(Date.now() / 1000) && !isOwner && (
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Bid amount in ETH"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              step="0.01"
              min={formatEther(highestBid)}
            />
            <Button onClick={handleBid}>Place Bid</Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {canEndAuction && (
          <Button onClick={handleEndAuction} variant="secondary" className="w-full">
            End Auction
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 