import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/web3Config';

export function useContract() {
  const { data: propertyCount } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPropertyCounter',
  });

  const getPropertyById = useCallback(async (id: number) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const property = await contract.getPropertyById(id);
      return property;
    } catch (error) {
      console.error('Error getting property:', error);
      throw error;
    }
  }, []);

  const startAuction = async (propertyId: number, startingPrice: string, durationInHours: number) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const priceInWei = ethers.utils.parseEther(startingPrice);
      const durationInSeconds = durationInHours * 60 * 60; // Convert hours to seconds
      
      const tx = await contract.startAuction(propertyId, priceInWei, durationInSeconds);
      const receipt = await tx.wait();
      
      if (receipt.status === 0) {
        throw new Error('Transaction failed');
      }
      
      return receipt;
    } catch (error: any) {
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected by user');
      }
      if (error.message.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      }
      throw new Error(error.message || 'Failed to start auction');
    }
  };

  const placeBid = async (propertyId: number, bidAmount: string) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const bidInWei = ethers.utils.parseEther(bidAmount);
      const tx = await contract.placeBid(propertyId, { value: bidInWei });
      const receipt = await tx.wait();
      
      if (receipt.status === 0) {
        throw new Error('Transaction failed');
      }
      
      return receipt;
    } catch (error: any) {
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected by user');
      }
      if (error.message.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      }
      throw new Error(error.message || 'Failed to place bid');
    }
  };

  const endAuction = async (propertyId: number) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.endAuction(propertyId);
      const receipt = await tx.wait();
      
      if (receipt.status === 0) {
        throw new Error('Transaction failed');
      }
      
      return receipt;
    } catch (error: any) {
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected by user');
      }
      if (error.message.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      }
      throw new Error(error.message || 'Failed to end auction');
    }
  };

  const getLandlordLeases = useCallback(async (landlordAddress: string) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const leaseIds = await contract.getLandlordLeases(landlordAddress);
      return leaseIds.map((id: any) => Number(id));
    } catch (error) {
      console.error('Error getting landlord leases:', error);
      throw error;
    }
  }, []);

  const getLeaseById = useCallback(async (leaseId: number) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const lease = await contract.getLeaseById(leaseId);
      return lease;
    } catch (error) {
      console.error('Error getting lease:', error);
      throw error;
    }
  }, []);

  return {
    propertyCount: propertyCount ? Number(propertyCount) : 0,
    getPropertyById,
    startAuction,
    placeBid,
    endAuction,
    getLandlordLeases,
    getLeaseById,
  };
} 