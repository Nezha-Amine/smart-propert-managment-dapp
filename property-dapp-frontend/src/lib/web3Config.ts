'use client';

import { createConfig, configureChains } from 'wagmi';
import { mainnet, sepolia, localhost } from 'wagmi/chains';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

// Configure chains and providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [localhost, mainnet, sepolia],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: 'http://127.0.0.1:8545',
      }),
    }),
    publicProvider(),
  ]
);

// Create wagmi config
export const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains })
  ],
  publicClient,
  webSocketPublicClient,
});

// Contract configuration
export const CONTRACT_ADDRESS = '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c';

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
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_propertyId", "type": "uint256" }],
    "name": "getPropertyById",
    "outputs": [
      {
        "components": [
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
        "internalType": "struct PropertyManagement.Property",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
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
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_propertyId", "type": "uint256" },
      { "internalType": "uint256", "name": "_startingPrice", "type": "uint256" },
      { "internalType": "uint256", "name": "_durationInSeconds", "type": "uint256" }
    ],
    "name": "startAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_propertyId", "type": "uint256" }],
    "name": "placeBid",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_propertyId", "type": "uint256" }],
    "name": "endAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_propertyId", "type": "uint256" }],
    "name": "cancelAuction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_propertyId", "type": "uint256" }],
    "name": "withdrawBid",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_propertyId", "type": "uint256" }],
    "name": "getAuctionDetails",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_propertyId", "type": "uint256" },
      { "internalType": "address", "name": "_bidder", "type": "address" }
    ],
    "name": "getPendingReturn",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  // LEASE FUNCTIONS
  {
    "inputs": [
      { "internalType": "uint256", "name": "_propertyId", "type": "uint256" },
      { "internalType": "address", "name": "_tenant", "type": "address" },
      { "internalType": "uint256", "name": "_monthlyRent", "type": "uint256" },
      { "internalType": "uint256", "name": "_securityDeposit", "type": "uint256" },
      { "internalType": "uint256", "name": "_startDate", "type": "uint256" },
      { "internalType": "uint256", "name": "_endDate", "type": "uint256" }
    ],
    "name": "createLeaseAgreement",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_leaseId", "type": "uint256" }],
    "name": "terminateLease",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_leaseId", "type": "uint256" },
      { "internalType": "string", "name": "_transactionType", "type": "string" }
    ],
    "name": "makePayment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_landlord", "type": "address" }],
    "name": "getLandlordLeases",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_tenant", "type": "address" }],
    "name": "getTenantLeases",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_leaseId", "type": "uint256" }],
    "name": "getLeaseById",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "uint256", "name": "propertyId", "type": "uint256" },
          { "internalType": "address", "name": "landlord", "type": "address" },
          { "internalType": "address", "name": "tenant", "type": "address" },
          { "internalType": "uint256", "name": "monthlyRent", "type": "uint256" },
          { "internalType": "uint256", "name": "securityDeposit", "type": "uint256" },
          { "internalType": "uint256", "name": "startDate", "type": "uint256" },
          { "internalType": "uint256", "name": "endDate", "type": "uint256" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
          { "internalType": "uint256", "name": "previousLeaseId", "type": "uint256" },
          { "internalType": "bool", "name": "isRenewal", "type": "bool" }
        ],
        "internalType": "struct PropertyManagement.LeaseAgreement",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "leaseAgreements",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "uint256", "name": "propertyId", "type": "uint256" },
      { "internalType": "address", "name": "landlord", "type": "address" },
      { "internalType": "address", "name": "tenant", "type": "address" },
      { "internalType": "uint256", "name": "monthlyRent", "type": "uint256" },
      { "internalType": "uint256", "name": "securityDeposit", "type": "uint256" },
      { "internalType": "uint256", "name": "startDate", "type": "uint256" },
      { "internalType": "uint256", "name": "endDate", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "uint256", "name": "previousLeaseId", "type": "uint256" },
      { "internalType": "bool", "name": "isRenewal", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // HISTORY FUNCTIONS
  {
    "inputs": [{ "internalType": "uint256", "name": "_propertyId", "type": "uint256" }],
    "name": "getPropertyLeases",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_leaseId", "type": "uint256" }],
    "name": "getLeaseDetails",
    "outputs": [
      { "internalType": "uint256", "name": "propertyId", "type": "uint256" },
      { "internalType": "address", "name": "landlord", "type": "address" },
      { "internalType": "address", "name": "tenant", "type": "address" },
      { "internalType": "uint256", "name": "monthlyRent", "type": "uint256" },
      { "internalType": "uint256", "name": "securityDeposit", "type": "uint256" },
      { "internalType": "uint256", "name": "startDate", "type": "uint256" },
      { "internalType": "uint256", "name": "endDate", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "bool", "name": "isRenewal", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_propertyId", "type": "uint256" }],
    "name": "getPropertyOwnershipHistory",
    "outputs": [
      { "internalType": "address[]", "name": "owners", "type": "address[]" },
      { "internalType": "uint256[]", "name": "transferDates", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "salePrices", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // EVENTS
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "bidder", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "BidPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "startingPrice", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256" }
    ],
    "name": "AuctionStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "winningBid", "type": "uint256" }
    ],
    "name": "AuctionEnded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "refundedAmount", "type": "uint256" }
    ],
    "name": "AuctionCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "leaseId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "landlord", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "tenant", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "monthlyRent", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "securityDeposit", "type": "uint256" }
    ],
    "name": "LeaseCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "leaseId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "terminatedBy", "type": "address" }
    ],
    "name": "LeaseTerminated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "leaseId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "tenant", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "month", "type": "uint256" }
    ],
    "name": "RentPaid",
    "type": "event"
  }
] as const; 