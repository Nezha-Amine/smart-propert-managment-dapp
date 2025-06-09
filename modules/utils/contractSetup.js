const Web3 = require('web3');
const { CONTRACT_ABI } = require('../../frontend/src/contracts/contractAbi');

const setupContract = async () => {
  try {
    // Connect to local Ganache
    const web3 = new Web3('http://127.0.0.1:8545');
    
    // Contract address (make sure this matches your deployed contract)
    const contractAddress = '0xda2ee2ade53f6a4bc0c073779fb999099dd38ae4';
    
    // Create contract instance
    const contract = new web3.eth.Contract(CONTRACT_ABI, contractAddress);
    
    // Verify contract exists
    const code = await web3.eth.getCode(contractAddress);
    if (code === '0x' || code === '0x0') {
      throw new Error('No contract found at the specified address');
    }
    
    // Test contract by calling propertyCounter
    try {
      await contract.methods.propertyCounter().call();
    } catch (error) {
      console.error('Contract verification failed:', error.message);
      throw new Error('Contract verification failed');
    }
    
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found in the network');
    }
    
    return { web3, contract, accounts };
  } catch (error) {
    console.error('Contract setup error:', error.message);
    throw error;
  }
};

module.exports = {
  setupContract
}; 