import { useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { useContract } from './useContract';

export function useAuctions() {
  const [loading, setLoading] = useState(false);
  const { contract } = useContract();

  const startAuction = async (propertyId: number, startingPrice: string, durationInHours: number) => {
    if (!contract) return;
    setLoading(true);

    try {
      const priceInWei = ethers.parseEther(startingPrice);
      const durationInSeconds = durationInHours * 3600;
      const tx = await contract.startAuction(propertyId, priceInWei, durationInSeconds);
      await tx.wait();
      toast.success("Auction started successfully!", {
        description: `Your property is now up for auction starting at ${startingPrice} ETH`,
      });
      return true;
    } catch (error: any) {
      toast.error("Error starting auction", {
        description: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async (propertyId: number, bidAmount: string) => {
    if (!contract) return;
    setLoading(true);

    try {
      const bidInWei = ethers.parseEther(bidAmount);
      const tx = await contract.placeBid(propertyId, { value: bidInWei });
      await tx.wait();
      toast.success("Bid placed successfully!", {
        description: `Your bid of ${bidAmount} ETH has been placed`,
      });
      return true;
    } catch (error: any) {
      toast.error("Error placing bid", {
        description: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const endAuction = async (propertyId: number) => {
    if (!contract) return;
    setLoading(true);

    try {
      const tx = await contract.endAuction(propertyId);
      await tx.wait();
      toast.success("Auction ended successfully!", {
        description: "The auction has been ended and the property has been transferred to the highest bidder",
      });
      return true;
    } catch (error: any) {
      toast.error("Error ending auction", {
        description: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const withdrawBid = async (propertyId: number) => {
    if (!contract) return;
    setLoading(true);

    try {
      const tx = await contract.withdrawBid(propertyId);
      await tx.wait();
      toast.success("Bid withdrawn successfully!", {
        description: "Your bid has been withdrawn and the funds have been returned",
      });
      return true;
    } catch (error: any) {
      toast.error("Error withdrawing bid", {
        description: error.message,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAuctionDetails = async (propertyId: number) => {
    if (!contract) return null;

    try {
      const details = await contract.getAuctionDetails(propertyId);
      return {
        onAuction: details[0],
        auctionEndTime: Number(details[1]),
        highestBidder: details[2],
        highestBid: details[3].toString(),
        ended: details[4]
      };
    } catch (error) {
      console.error('Error fetching auction details:', error);
      return null;
    }
  };

  return {
    loading,
    startAuction,
    placeBid,
    endAuction,
    withdrawBid,
    getAuctionDetails
  };
} 