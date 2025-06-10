import { createPublicClient, http, createWalletClient, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';

const CONTRACT_ADDRESS = '0xda2ee2ade53f6a4bc0c073779fb999099dd38ae4';
const CONTRACT_ABI = parseAbi([
  'function registerProperty(string _propertyAddress, uint256 _size, string _propertyType, string _documentHash) returns (uint256)',
  'function getPropertyCounter() view returns (uint256)',
  'function properties(uint256) view returns (uint256 id, address owner, string propertyAddress, uint256 size, string propertyType, bool isActive, uint256 createdAt, bool isForSale, uint256 salePrice, bool onAuction, uint256 auctionEndTime, address highestBidder, uint256 highestBid, bool auctionEnded, bool isApproved, string documentHash)',
]);

async function main() {
  try {
    // Create a public client to interact with the blockchain
    const publicClient = createPublicClient({
      chain: localhost,
      transport: http()
    });

    // Check if we can get the contract code
    const contractCode = await publicClient.getBytecode({
      address: CONTRACT_ADDRESS as `0x${string}`,
    });

    console.log('Contract code exists:', !!contractCode);

    // Try to call getPropertyCounter
    try {
      const counter = await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'getPropertyCounter',
      });
      console.log('Property counter:', counter);
    } catch (error) {
      console.error('Error calling getPropertyCounter:', error);
    }

    // Try to simulate the registerProperty call
    try {
      const testData = {
        propertyAddress: "123 Main Street",
        size: BigInt(100),
        propertyType: "Residential",
        documentHash: "QmYourIPFSHashHere1234567890123456789012"
      };

      const result = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'registerProperty',
        args: [
          testData.propertyAddress,
          testData.size,
          testData.propertyType,
          testData.documentHash,
        ],
        account: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      });

      console.log('Simulation successful:', result);
    } catch (error) {
      console.error('Error simulating registerProperty:', error);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 