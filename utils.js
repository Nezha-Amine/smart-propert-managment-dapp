/**
 * Utils module for property management system
 * Provides common utility functions used across the application
 */

const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create a single readline interface to be used throughout the application
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Setup Web3 connection
const setupWeb3 = () => {
  const web3 = new Web3('http://127.0.0.1:8545');
  return web3;
};

// Get Ethereum accounts
const getAccounts = async (web3) => {
  try {
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No Ethereum accounts found! Is your blockchain running?');
    }
    return accounts;
  } catch (error) {
    console.error('Error getting accounts:', error.message);
    throw error;
  }
};

// Get contract instance
const getContract = async (web3) => {
  try {
    // Check for deployment info file
    const deploymentInfoPath = path.join(__dirname, 'deployment-info.json');
    if (!fs.existsSync(deploymentInfoPath)) {
      throw new Error('Deployment info file not found. Please deploy the contract first.');
    }
    
    // Load deployment info
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    
    // Load contract ABI
    const contractPath = path.join(__dirname, 'build/contracts', `${deploymentInfo.contractName}.json`);
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract artifact not found at ${contractPath}`);
    }
    
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // Create contract instance
    const contract = new web3.eth.Contract(
      contractJson.abi,
      deploymentInfo.contractAddress
    );
    
    return contract;
  } catch (error) {
    console.error('Error creating contract instance:', error.message);
    throw error;
  }
};

// Format date from timestamp
const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString();
};

// Format ETH value
const formatEth = (wei) => {
  return Web3.utils.fromWei(wei, 'ether');
};

// Utility function to get user input with validation
const getUserInput = (question, validator = null) => {
  return new Promise((resolve) => {
    const askQuestion = () => {
      rl.question(question, (answer) => {
        if (!validator || validator(answer)) {
          resolve(answer);
        } else {
          console.log('Invalid input. Please try again.');
          askQuestion();
        }
      });
    };
    askQuestion();
  });
};

// Export the utilities
module.exports = {
  setupWeb3,
  getAccounts,
  getContract,
  formatDate,
  formatEth,
  getUserInput,
  rl
};