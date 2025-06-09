const Web3 = require('web3');
const rl = require('../utils/readline').getInterface();

// List property for sale
const listPropertyForSale = async (web3, contract, account) => {
  try {
    const properties = await contract.methods.getOwnerProperties(account).call();
    
    if (properties.length === 0) {
      console.log('You do not own any properties.');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      console.log('\nYour properties:');
      properties.forEach(async (propertyId) => {
        const property = await contract.methods.getPropertyById(propertyId).call();
        console.log(`ID: ${property.id}, Address: ${property.propertyAddress}, Type: ${property.propertyType}, Size: ${property.size} sqft`);
        console.log(`Status: ${property.isActive ? 'Active' : 'Inactive'}${property.isForSale ? ', For Sale at ' + web3.utils.fromWei(property.salePrice, 'ether') + ' ETH' : ''}`);
        console.log('------------------------');
      });
      
      rl.question('\nEnter property ID to list for sale: ', (propertyId) => {
        rl.question('Enter sale price (in ETH): ', async (price) => {
          try {
            const priceInWei = web3.utils.toWei(price, 'ether');
            const result = await contract.methods.listPropertyForSale(propertyId, priceInWei)
              .send({ from: account });
            console.log(`\nProperty listed for sale successfully. Transaction hash: ${result.transactionHash}`);
            resolve(result);
          } catch (error) {
            console.error('Error listing property for sale:', error.message);
            reject(error);
          }
        });
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};

// Cancel property sale
const cancelPropertySale = async (web3, contract, account) => {
  try {
    const properties = await contract.methods.getOwnerProperties(account).call();
    const forSaleProperties = [];
    
    for (const propertyId of properties) {
      const property = await contract.methods.getPropertyById(propertyId).call();
      if (property.isForSale) {
        forSaleProperties.push(property);
      }
    }
    
    if (forSaleProperties.length === 0) {
      console.log('You do not have any properties listed for sale.');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      console.log('\nYour properties for sale:');
      forSaleProperties.forEach(property => {
        console.log(`ID: ${property.id}, Address: ${property.propertyAddress}, Price: ${web3.utils.fromWei(property.salePrice, 'ether')} ETH`);
        console.log('------------------------');
      });
      
      rl.question('\nEnter property ID to cancel sale: ', async (propertyId) => {
        try {
          const result = await contract.methods.cancelPropertySale(propertyId)
            .send({ from: account });
          console.log(`\nProperty sale listing cancelled successfully. Transaction hash: ${result.transactionHash}`);
          resolve(result);
        } catch (error) {
          console.error('Error cancelling property sale:', error.message);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};

// View properties for sale
const viewPropertiesForSale = async (web3, contract) => {
  try {
    const forSalePropertyIds = await contract.methods.getPropertiesForSale().call();
    
    if (forSalePropertyIds.length === 0) {
      console.log('No properties are currently for sale.');
      return [];
    }
    
    console.log('\nProperties available for purchase:');
    const properties = [];
    for (const propertyId of forSalePropertyIds) {
      const property = await contract.methods.getPropertyById(propertyId).call();
      
      console.log(`ID: ${property.id}, Address: ${property.propertyAddress}`);
      console.log(`Type: ${property.propertyType}, Size: ${property.size} sqft`);
      console.log(`Owner: ${property.owner}`);
      console.log(`Price: ${web3.utils.fromWei(property.salePrice, 'ether')} ETH`);
      console.log('------------------------');
      
      properties.push(property);
    }
    return properties;
  } catch (error) {
    console.error('Error viewing properties for sale:', error.message);
    throw error;
  }
};

// Purchase property
const purchaseProperty = async (web3, contract, account) => {
  try {
    const forSalePropertyIds = await contract.methods.getPropertiesForSale().call();
    const availableProperties = [];
    
    for (const propertyId of forSalePropertyIds) {
      const property = await contract.methods.getPropertyById(propertyId).call();
      if (property.owner.toLowerCase() !== account.toLowerCase()) {
        availableProperties.push(property);
      }
    }
    
    if (availableProperties.length === 0) {
      console.log('No properties are available for purchase.');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      console.log('\nProperties available for purchase:');
      availableProperties.forEach(property => {
        console.log(`ID: ${property.id}, Address: ${property.propertyAddress}`);
        console.log(`Type: ${property.propertyType}, Size: ${property.size} sqft`);
        console.log(`Owner: ${property.owner}`);
        console.log(`Price: ${web3.utils.fromWei(property.salePrice, 'ether')} ETH`);
        console.log('------------------------');
      });
      
      rl.question('\nEnter property ID to purchase (or 0 to cancel): ', async (propertyId) => {
        if (propertyId === '0') {
          resolve(null);
          return;
        }
        
        try {
          const property = await contract.methods.getPropertyById(propertyId).call();
          const balance = await web3.eth.getBalance(account);
          
          if (BigInt(balance) < BigInt(property.salePrice)) {
            console.log(`Insufficient funds. You have ${web3.utils.fromWei(balance, 'ether')} ETH but the property costs ${web3.utils.fromWei(property.salePrice, 'ether')} ETH.`);
            resolve(null);
            return;
          }
          
          const result = await contract.methods.initiatePropertyPurchase(propertyId)
            .send({ 
              from: account,
              value: property.salePrice,
              gas: 3000000
            });
          
          console.log(`\nProperty purchased successfully! Transaction hash: ${result.transactionHash}`);
          resolve(result);
        } catch (error) {
          console.error('Error purchasing property:', error.message);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};

// View property transfer history
const viewPropertyTransferHistory = async (web3, contract) => {
  return new Promise((resolve, reject) => {
    rl.question('\nEnter property ID to view transfer history: ', async (propertyId) => {
      try {
        const property = await contract.methods.getPropertyById(propertyId).call();
        if (!property.id || property.id === '0') {
          console.log('Property not found.');
          resolve([]);
          return;
        }
        
        const transferHistoryIds = await contract.methods.getPropertyTransferHistory(propertyId).call();
        
        if (transferHistoryIds.length === 0) {
          console.log('This property has no transfer history recorded on blockchain.');
          resolve([]);
          return;
        }
        
        console.log(`\nTransfer history for property ID ${propertyId} (${property.propertyAddress}):`);
        const history = [];
        for (let i = 0; i < transferHistoryIds.length; i++) {
          const saleId = transferHistoryIds[i];
          const sale = await contract.methods.getPropertySale(saleId).call();
          
          console.log(`Transfer #${i+1} (Sale ID: ${sale.id})`);
          console.log(`From: ${sale.seller}`);
          console.log(`To: ${sale.buyer}`);
          console.log(`Price: ${web3.utils.fromWei(sale.salePrice, 'ether')} ETH`);
          console.log(`Date: ${new Date(sale.timestamp * 1000).toLocaleString()}`);
          console.log('------------------------');
          
          history.push(sale);
        }
        resolve(history);
      } catch (error) {
        console.error('Error viewing transfer history:', error.message);
        reject(error);
      }
    });
  });
};

module.exports = {
  listPropertyForSale,
  cancelPropertySale,
  viewPropertiesForSale,
  purchaseProperty,
  viewPropertyTransferHistory
}; 