const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

async function debugPropertyManagement() {
  console.log('===== Property Management Debugging Tool =====');
  
  // 1. Setup Web3 connection
  const web3 = new Web3('http://127.0.0.1:8545');
  console.log('Connected to local blockchain');
  
  // 2. Check accounts
  const accounts = await web3.eth.getAccounts();
  console.log(`Found ${accounts.length} accounts. First account: ${accounts[0]}`);
  
  // 3. Load contract JSON
  const contractPath = path.resolve(__dirname, 'build/contracts/PropertyManagement.json');
  if (!fs.existsSync(contractPath)) {
    console.error('Contract JSON not found! Make sure the contract is compiled.');
    return;
  }
  
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  console.log('Contract JSON loaded successfully');
  
  // 4. Check if contract is deployed
  const networkId = await web3.eth.net.getId();
  console.log(`Current network ID: ${networkId}`);
  
  const deployedNetwork = contractJson.networks[networkId];
  if (!deployedNetwork) {
    console.error(`Contract not deployed on network ${networkId}`);
    console.log('Redeploying contract...');
    await redeployContract();
    return;
  }
  
  console.log(`Contract found at address: ${deployedNetwork.address}`);
  
  // 5. Validate contract instance
  try {
    const contract = new web3.eth.Contract(
      contractJson.abi,
      deployedNetwork.address
    );
    
    // Verify contract code exists at the address
    const code = await web3.eth.getCode(deployedNetwork.address);
    if (code === '0x' || code === '0x0') {
      console.error('No contract code found at the address! Need to redeploy.');
      await redeployContract();
      return;
    }
    
    console.log('Contract instance created successfully');
    
    // 6. Test basic contract methods
    try {
      // Try to register a property with higher gas limit for testing
      const result = await contract.methods
        .registerProperty('Debug Test Property', 1000, 'Test')
        .send({
          from: accounts[0],
          gas: 1000000  // Higher gas limit for safety
        });
      
      console.log('Test property registered successfully!');
      console.log('Transaction hash:', result.transactionHash);
      
      if (result.events && result.events.PropertyRegistered) {
        const propertyId = result.events.PropertyRegistered.returnValues.propertyId;
        console.log(`Property ID from event: ${propertyId}`);
      } else {
        console.log('PropertyRegistered event not found in transaction receipt.');
        console.log('Full receipt:', JSON.stringify(result, null, 2));
      }
      
      // Try to get owner properties
      const propertyIds = await contract.methods.getOwnerProperties(accounts[0]).call();
      console.log(`Owner has ${propertyIds.length} properties: ${propertyIds.join(', ')}`);
      
      // Get details of first property
      if (propertyIds.length > 0) {
        const property = await contract.methods.getPropertyById(propertyIds[0]).call();
        console.log('First property details:', property);
      }
      
    } catch (error) {
      console.error('Error testing contract methods:', error);
      console.log('Attempting to fix issues...');
      await fixContractIssues(web3, contractJson, deployedNetwork.address, accounts[0]);
    }
    
  } catch (error) {
    console.error('Error creating contract instance:', error);
  }
}

async function redeployContract() {
  console.log('Running contract redeployment...');
  
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    exec('truffle migrate --reset', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error redeploying contract: ${error.message}`);
        reject(error);
        return;
      }
      
      console.log(stdout);
      console.log('Contract redeployed successfully! Please restart the CLI tool.');
      resolve();
    });
  });
}

async function fixContractIssues(web3, contractJson, contractAddress, account) {
  // Option 1: Check gas price and suggest adjustments
  const gasPrice = await web3.eth.getGasPrice();
  console.log(`Current gas price: ${gasPrice} wei`);
  
  if (parseInt(gasPrice) > 50000000000) {
    console.log('Gas price is high. Consider updating truffle-config.js with a lower gasPrice value.');
  }
  
  // Option 2: Check if network is congested
  const blockNumber = await web3.eth.getBlockNumber();
  console.log(`Current block number: ${blockNumber}`);
  
  // Option 3: Create a new, fixed CLI helper with proper error handling
  console.log('Creating a fixed CLI helper script...');
  
  const fixedCliCode = `
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Load the compiled contract JSON
const contractPath = path.resolve(__dirname, 'build/contracts/PropertyManagement.json');
const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

async function listMyProperties() {
  try {
    // Setup web3 connection
    const web3 = new Web3('http://127.0.0.1:8545');
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0]; // Using the first account
    
    // Get contract instance
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = contractJson.networks[networkId];
    
    if (!deployedNetwork) {
      console.error('Contract not deployed on this network!');
      return;
    }
    
    const contract = new web3.eth.Contract(
      contractJson.abi,
      deployedNetwork.address
    );
    
    // Get properties with explicit error handling
    console.log('Fetching properties for account:', account);
    
    const propertyIds = await contract.methods.getOwnerProperties(account).call({
      from: account,
      gas: 500000 // Explicitly provide higher gas limit
    });
    
    console.log('Property IDs:', propertyIds);
    
    if (propertyIds.length === 0) {
      console.log('No properties found for this account.');
      return;
    }
    
    // Get details for each property
    for (const id of propertyIds) {
      try {
        console.log('Fetching details for property ID:', id);
        const property = await contract.methods.getPropertyById(id).call({
          from: account,
          gas: 500000
        });
        
        console.log('\\nProperty Details:');
        console.log('ID:', property.id);
        console.log('Address:', property.propertyAddress);
        console.log('Size:', property.size, 'sq ft');
        console.log('Type:', property.propertyType);
        console.log('Active:', property.isActive ? 'Yes' : 'No');
        console.log('Created:', new Date(property.createdAt * 1000).toLocaleString());
      } catch (error) {
        console.error('Error fetching property details for ID', id, ':', error.message);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the function
listMyProperties();
`;

  fs.writeFileSync('list-properties.js', fixedCliCode);
  console.log('Created list-properties.js - Run this script to list your properties.');
  
  // Option 4: Update index.js with appropriate CONTRACT_ADDRESS
  try {
    const indexPath = path.resolve(__dirname, 'index.js');
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      indexContent = indexContent.replace(
        /export const CONTRACT_ADDRESS = '.*?';/,
        `export const CONTRACT_ADDRESS = '${contractAddress}';`
      );
      fs.writeFileSync(indexPath, indexContent);
      console.log(`Updated CONTRACT_ADDRESS in index.js to ${contractAddress}`);
    }
  } catch (error) {
    console.error('Error updating index.js:', error.message);
  }
}

// Run the debugging function
debugPropertyManagement().catch(console.error);