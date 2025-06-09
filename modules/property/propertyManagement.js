const Web3 = require('web3');
const rl = require('../utils/readline').getInterface();
const crypto = require('crypto');

// Helper function to generate document hash
const generateDocumentHash = (propertyDetails) => {
  const data = JSON.stringify(propertyDetails);
  return '0x' + crypto.createHash('sha256').update(data).digest('hex');
};

// Register property
const registerProperty = async (web3, contract, account) => {
  try {
    return new Promise((resolve) => {
      console.log('\n===== REGISTER PROPERTY =====');
      
      let propertyDetails = {};
      
      rl.question('Enter property address: ', (address) => {
        propertyDetails.address = address;
        
        rl.question('Enter property size (in sq ft): ', (size) => {
          if (isNaN(size)) {
            console.log('Invalid size. Please enter a number.');
            resolve();
            return;
          }
          propertyDetails.size = size;
          
          rl.question('Enter property type (e.g., Apartment, House, Commercial): ', async (type) => {
            propertyDetails.type = type;
            
            // Generate document hash from property details
            const documentHash = generateDocumentHash(propertyDetails);
            
            try {
              const gas = await contract.methods.registerProperty(
                propertyDetails.address,
                propertyDetails.size,
                propertyDetails.type,
                documentHash
              ).estimateGas({ from: account });

              await contract.methods.registerProperty(
                propertyDetails.address,
                propertyDetails.size,
                propertyDetails.type,
                documentHash
              ).send({ 
                from: account,
                gas: Math.floor(gas * 1.5) // Add 50% buffer to estimated gas
              });
              
              console.log('\nProperty registration submitted successfully!');
              console.log('Waiting for notary approval...');
              console.log('Document Hash:', documentHash);
              resolve();
            } catch (error) {
              console.error('Error registering property:', error.message);
              resolve();
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in property registration process:', error.message);
    throw error;
  }
};

// List properties
const listProperties = async (web3, contract, account) => {
  try {
    console.log('Fetching properties...');
    const propertyIds = await contract.methods.getOwnerProperties(account).call();
    
    if (propertyIds.length === 0) {
      console.log('You have no registered properties.');
      return [];
    }
    
    console.log('\n===== YOUR PROPERTIES =====');
    const properties = [];
    for (const id of propertyIds) {
      const property = await contract.methods.getPropertyById(id).call();
      if (property.owner === account) { // Only show properties still owned by the user
        console.log(`\nID: ${property.id}`);
        console.log(`Address: ${property.propertyAddress}`);
        console.log(`Size: ${property.size} sq ft`);
        console.log(`Type: ${property.propertyType}`);
        console.log(`Status: ${property.isApproved ? 'Approved' : 'Pending Approval'}`);
        console.log(`Active: ${property.isActive ? 'Yes' : 'No'}`);
        console.log(`Document Hash: ${property.documentHash}`);
        console.log(`Created: ${new Date(property.createdAt * 1000).toLocaleString()}`);
        properties.push(property);
      }
    }
    return properties;
  } catch (error) {
    console.error('Error listing properties:', error.message);
    throw error;
  }
};

module.exports = {
  registerProperty,
  listProperties
}; 