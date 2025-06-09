const Web3 = require('web3');
const rl = require('../utils/readline').getInterface();

// View pending properties
const viewPendingProperties = async (web3, contract, account) => {
  try {
    // Check if the current account is the notary
    const notaryAddress = await contract.methods.notary().call();
    if (account.toLowerCase() !== notaryAddress.toLowerCase()) {
      console.log('Only the notary can view pending properties.');
      return;
    }

    console.log('\n===== PENDING PROPERTIES FOR APPROVAL =====');
    const pendingProperties = await contract.methods.getPendingProperties().call();

    if (pendingProperties.length === 0) {
      console.log('No properties pending approval.');
      return;
    }

    for (const propertyId of pendingProperties) {
      const property = await contract.methods.getPropertyById(propertyId).call();
      console.log(`\nProperty ID: ${propertyId}`);
      console.log(`Owner: ${property.owner}`);
      console.log(`Address: ${property.propertyAddress}`);
      console.log(`Size: ${property.size} sq ft`);
      console.log(`Type: ${property.propertyType}`);
      console.log(`Document Hash: ${property.documentHash}`);
      console.log('------------------------');
    }
  } catch (error) {
    console.error('Error viewing pending properties:', error.message);
    throw error;
  }
};

// Approve property
const approveProperty = async (web3, contract, account) => {
  try {
    // Check if the current account is the notary
    const notaryAddress = await contract.methods.notary().call();
    if (account.toLowerCase() !== notaryAddress.toLowerCase()) {
      console.log('Only the notary can approve properties.');
      return;
    }

    // Get and display pending properties
    await viewPendingProperties(web3, contract, account);

    return new Promise((resolve) => {
      rl.question('\nEnter the Property ID to approve (or 0 to cancel): ', async (propertyId) => {
        try {
          if (propertyId === '0') {
            console.log('Operation cancelled.');
            resolve();
            return;
          }

          // Estimate gas for the transaction
          const gas = await contract.methods.approveProperty(propertyId)
            .estimateGas({ from: account });

          // Add 50% buffer to estimated gas
          const gasLimit = Math.floor(gas * 1.5);

          await contract.methods.approveProperty(propertyId)
            .send({ 
              from: account,
              gas: gasLimit
            });

          console.log(`Property ${propertyId} has been approved.`);
          resolve();
        } catch (error) {
          console.error('Error approving property:', error.message);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error in property approval process:', error.message);
    throw error;
  }
};

// Reject property
const rejectProperty = async (web3, contract, account) => {
  try {
    // Check if the current account is the notary
    const notaryAddress = await contract.methods.notary().call();
    if (account.toLowerCase() !== notaryAddress.toLowerCase()) {
      console.log('Only the notary can reject properties.');
      return;
    }

    // Get and display pending properties
    await viewPendingProperties(web3, contract, account);

    return new Promise((resolve) => {
      rl.question('\nEnter the Property ID to reject (or 0 to cancel): ', async (propertyId) => {
        try {
          if (propertyId === '0') {
            console.log('Operation cancelled.');
            resolve();
            return;
          }

          // Estimate gas for the transaction
          const gas = await contract.methods.rejectProperty(propertyId)
            .estimateGas({ from: account });

          // Add 50% buffer to estimated gas
          const gasLimit = Math.floor(gas * 1.5);

          await contract.methods.rejectProperty(propertyId)
            .send({ 
              from: account,
              gas: gasLimit
            });

          console.log(`Property ${propertyId} has been rejected.`);
          resolve();
        } catch (error) {
          console.error('Error rejecting property:', error.message);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error in property rejection process:', error.message);
    throw error;
  }
};

// Change notary
const changeNotary = async (web3, contract, account) => {
  try {
    // Check if the current account is the notary
    const notaryAddress = await contract.methods.notary().call();
    if (account.toLowerCase() !== notaryAddress.toLowerCase()) {
      console.log('Only the current notary can change the notary address.');
      return;
    }

    return new Promise((resolve) => {
      rl.question('\nEnter the new notary address (or press enter to cancel): ', async (newNotaryAddress) => {
        try {
          if (!newNotaryAddress) {
            console.log('Operation cancelled.');
            resolve();
            return;
          }

          await contract.methods.changeNotary(newNotaryAddress).send({ from: account });
          console.log(`Notary has been changed to ${newNotaryAddress}`);
          resolve();
        } catch (error) {
          console.error('Error changing notary:', error.message);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error in notary change process:', error.message);
    throw error;
  }
};

module.exports = {
  viewPendingProperties,
  approveProperty,
  rejectProperty,
  changeNotary
}; 