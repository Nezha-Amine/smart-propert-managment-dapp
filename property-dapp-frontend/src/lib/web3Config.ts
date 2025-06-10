'use client';

import { createConfig, configureChains } from 'wagmi';
import { mainnet, sepolia, localhost } from 'wagmi/chains';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [localhost, mainnet, sepolia],
  [publicProvider()]
);

export const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains })
  ],
  publicClient
});

// Contract configuration
export const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "getPropertyCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "properties",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "string", "name": "propertyAddress", "type": "string" },
      { "internalType": "uint256", "name": "size", "type": "uint256" },
      { "internalType": "string", "name": "propertyType", "type": "string" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "bool", "name": "isForSale", "type": "bool" },
      { "internalType": "uint256", "name": "salePrice", "type": "uint256" },
      { "internalType": "bool", "name": "onAuction", "type": "bool" },
      { "internalType": "uint256", "name": "auctionEndTime", "type": "uint256" },
      { "internalType": "address", "name": "highestBidder", "type": "address" },
      { "internalType": "uint256", "name": "highestBid", "type": "uint256" },
      { "internalType": "bool", "name": "auctionEnded", "type": "bool" },
      { "internalType": "bool", "name": "isApproved", "type": "bool" },
      { "internalType": "string", "name": "documentHash", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_propertyAddress", "type": "string" },
      { "internalType": "uint256", "name": "_size", "type": "uint256" },
      { "internalType": "string", "name": "_propertyType", "type": "string" },
      { "internalType": "string", "name": "_documentHash", "type": "string" }
    ],
    "name": "registerProperty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }],
    "name": "getOwnerProperties",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "notary",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPendingProperties",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_propertyId", "type": "uint256" }],
    "name": "approveProperty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_propertyId", "type": "uint256" }],
    "name": "rejectProperty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const; 