const Web3 = require('web3');
const rl = require('../utils/readline').getInterface();

// Start auction for a property
const startAuction = async (web3, contract, account) => {
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
        console.log(`ID: ${property.id}, Address: ${property.propertyAddress}, Type: ${property.propertyType}`);
        console.log(`Status: ${property.isActive ? 'Active' : 'Inactive'}${property.onAuction ? ', On Auction' : ''}${property.isForSale ? ', For Sale' : ''}`);
        console.log('------------------------');
      });
      
      rl.question('\nEnter property ID to start auction: ', async (propertyId) => {
        try {
          // Check property status first
          const property = await contract.methods.getPropertyById(propertyId).call();
          
          if (!property.isActive) {
            reject(new Error('Property is not active'));
            return;
          }
          
          if (property.onAuction) {
            reject(new Error('Property is already on auction'));
            return;
          }
          
          if (property.isForSale) {
            reject(new Error('Property is already listed for sale'));
            return;
          }
          
          if (property.owner.toLowerCase() !== account.toLowerCase()) {
            reject(new Error('You are not the owner of this property'));
            return;
          }
          
          rl.question('Enter starting bid (in ETH): ', (startingBid) => {
            if (parseFloat(startingBid) <= 0) {
              reject(new Error('Starting bid must be greater than 0'));
              return;
            }
            
            rl.question('Enter auction duration (in hours, 1-720): ', async (duration) => {
              try {
                const hours = parseInt(duration);
                // 720 hours = 30 days
                if (hours < 1 || hours > 720) {
                  reject(new Error('Auction duration must be between 1 hour and 720 hours (30 days)'));
                  return;
                }
                
                const startingBidWei = web3.utils.toWei(startingBid, 'ether');
                const durationInSeconds = hours * 60 * 60; // Convert hours to seconds
                
                console.log('\nStarting auction with parameters:');
                console.log(`Property ID: ${propertyId}`);
                console.log(`Starting Bid: ${startingBid} ETH`);
                console.log(`Duration: ${hours} hours (${Math.floor(hours/24)} days, ${hours%24} hours)`);
                
                const result = await contract.methods.startAuction(
                  propertyId,
                  startingBidWei,
                  durationInSeconds
                ).send({ 
                  from: account,
                  gas: 500000
                });
                
                console.log(`\nAuction started successfully! Transaction hash: ${result.transactionHash}`);
                resolve(result);
              } catch (error) {
                console.error('Error starting auction:', error.message);
                reject(error);
              }
            });
          });
        } catch (error) {
          console.error('Error checking property:', error.message);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};

// Place bid on a property
const placeBid = async (web3, contract, account) => {
  try {
    const activeAuctions = await viewActiveAuctions(web3, contract, account);
    
    if (activeAuctions.length === 0) {
      console.log('No active auctions available.');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      rl.question('\nEnter property ID to place bid: ', async (propertyId) => {
        try {
          // Check auction status first
          const property = await contract.methods.getPropertyById(propertyId).call();
          
          if (!property.onAuction) {
            reject(new Error('Property is not on auction'));
            return;
          }
          
          if (property.auctionEnded) {
            reject(new Error('Auction has already ended'));
            return;
          }
          
          if (property.owner.toLowerCase() === account.toLowerCase()) {
            reject(new Error('You cannot bid on your own property'));
            return;
          }
          
          const currentHighestBid = web3.utils.fromWei(property.highestBid, 'ether');
          console.log(`\nCurrent highest bid: ${currentHighestBid} ETH`);
          
          rl.question('Enter bid amount (in ETH): ', async (bidAmount) => {
            try {
              if (parseFloat(bidAmount) <= parseFloat(currentHighestBid)) {
                reject(new Error(`Bid must be higher than current highest bid (${currentHighestBid} ETH)`));
                return;
              }
              
              const bidAmountWei = web3.utils.toWei(bidAmount, 'ether');
              
              console.log('Placing bid...');
              const result = await contract.methods.placeBid(propertyId)
                .send({ 
                  from: account,
                  value: bidAmountWei,
                  gas: 500000
                });
              
              console.log(`\nBid placed successfully! Transaction hash: ${result.transactionHash}`);
              resolve(result);
            } catch (error) {
              console.error('Error placing bid:', error.message);
              reject(error);
            }
          });
        } catch (error) {
          console.error('Error checking auction:', error.message);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};

// View active auctions
const viewActiveAuctions = async (web3, contract, account) => {
  try {
    console.log('\n===== ACTIVE AUCTIONS =====');
    
    // Get total number of properties using the getter function
    const propertyCounter = await contract.methods.getPropertyCounter().call();
    const activeAuctions = [];
    
    // First show the owner's properties on auction
    const ownerProperties = await contract.methods.getOwnerProperties(account).call();
    if (ownerProperties.length > 0) {
      console.log('\nYOUR PROPERTIES ON AUCTION:');
      for (const propertyId of ownerProperties) {
        try {
          const property = await contract.methods.getPropertyById(propertyId).call();
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (property.onAuction && 
              !property.auctionEnded && 
              Number(property.auctionEndTime) > currentTime &&
              property.isActive) {
            
            console.log(`\nProperty ID: ${property.id}`);
            console.log(`Address: ${property.propertyAddress}`);
            console.log(`Type: ${property.propertyType}`);
            console.log(`Starting Bid: ${web3.utils.fromWei(property.highestBid, 'ether')} ETH`);
            if (property.highestBidder !== '0x0000000000000000000000000000000000000000') {
              console.log(`Current Highest Bidder: ${property.highestBidder}`);
              console.log(`Current Highest Bid: ${web3.utils.fromWei(property.highestBid, 'ether')} ETH`);
            } else {
              console.log('No bids yet');
            }
            console.log(`Auction Ends: ${new Date(property.auctionEndTime * 1000).toLocaleString()}`);
            console.log('------------------------');
            activeAuctions.push(property);
          }
        } catch (error) {
          console.error(`Error fetching property ${propertyId}:`, error.message);
          continue;
        }
      }
    }

    // Then show other properties available for bidding
    console.log('\nAVAILABLE FOR BIDDING:');
    for (let i = 1; i <= propertyCounter; i++) {
      try {
        const property = await contract.methods.getPropertyById(i).call();
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Only show properties not owned by current user
        if (property.onAuction && 
            !property.auctionEnded && 
            property.owner.toLowerCase() !== account.toLowerCase() &&
            Number(property.auctionEndTime) > currentTime &&
            property.isActive) {
          
          console.log(`\nProperty ID: ${property.id}`);
          console.log(`Address: ${property.propertyAddress}`);
          console.log(`Type: ${property.propertyType}`);
          console.log(`Current Highest Bid: ${web3.utils.fromWei(property.highestBid, 'ether')} ETH`);
          console.log(`Auction Ends: ${new Date(property.auctionEndTime * 1000).toLocaleString()}`);
          console.log('------------------------');
          activeAuctions.push(property);
        }
      } catch (error) {
        console.error(`Error fetching property ${i}:`, error.message);
        continue;
      }
    }
    
    if (activeAuctions.length === 0) {
      console.log('No active auctions found.');
    }
    
    return activeAuctions;
  } catch (error) {
    console.error('Error viewing active auctions:', error.message);
    throw error;
  }
};

// End auction
const endAuction = async (web3, contract, account) => {
  try {
    const properties = await contract.methods.getOwnerProperties(account).call();
    const auctionProperties = [];
    
    for (const propertyId of properties) {
      const property = await contract.methods.getPropertyById(propertyId).call();
      if (property.onAuction && !property.auctionEnded) {
        const now = Math.floor(Date.now() / 1000);
        if (now >= property.auctionEndTime) {
          auctionProperties.push(property);
          console.log(`\nProperty ID: ${property.id}`);
          console.log(`Address: ${property.propertyAddress}`);
          console.log(`Highest Bid: ${web3.utils.fromWei(property.highestBid, 'ether')} ETH`);
          console.log(`Highest Bidder: ${property.highestBidder}`);
          console.log('------------------------');
        }
      }
    }
    
    if (auctionProperties.length === 0) {
      console.log('You have no auctions ready to end.');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      rl.question('\nEnter property ID to end auction: ', async (propertyId) => {
        try {
          const property = await contract.methods.getPropertyById(propertyId).call();
          
          if (!property.onAuction) {
            reject(new Error('Property is not on auction'));
            return;
          }
          
          if (property.auctionEnded) {
            reject(new Error('Auction has already ended'));
            return;
          }
          
          const now = Math.floor(Date.now() / 1000);
          if (now < property.auctionEndTime) {
            reject(new Error('Auction is still in progress'));
            return;
          }
          
          console.log('Ending auction...');
          const result = await contract.methods.endAuction(propertyId)
            .send({ 
              from: account,
              gas: 500000
            });
          
          console.log(`\nAuction ended successfully! Transaction hash: ${result.transactionHash}`);
          resolve(result);
        } catch (error) {
          console.error('Error ending auction:', error.message);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};

// View my properties on auction
const viewMyAuctions = async (web3, contract, account) => {
  try {
    console.log('\n===== YOUR PROPERTIES ON AUCTION =====');
    
    // Get owner's properties
    const propertyIds = await contract.methods.getOwnerProperties(account).call();
    let hasAuctions = false;
    
    for (const propertyId of propertyIds) {
      const property = await contract.methods.getPropertyById(propertyId).call();
      
      if (property.onAuction && !property.auctionEnded) {
        hasAuctions = true;
        console.log(`\nProperty ID: ${propertyId}`);
        console.log(`Address: ${property.propertyAddress}`);
        console.log(`Type: ${property.propertyType}`);
        console.log(`Starting Bid: ${web3.utils.fromWei(property.highestBid.toString(), 'ether')} ETH`);
        
        if (property.highestBidder !== '0x0000000000000000000000000000000000000000') {
          console.log(`Current Highest Bidder: ${property.highestBidder}`);
          console.log(`Current Highest Bid: ${web3.utils.fromWei(property.highestBid.toString(), 'ether')} ETH`);
        } else {
          console.log('No bids yet');
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = property.auctionEndTime - currentTime;
        
        if (timeRemaining > 0) {
          const days = Math.floor(timeRemaining / (24 * 60 * 60));
          const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
          const minutes = Math.floor((timeRemaining % (60 * 60)) / 60);
          console.log(`Time Remaining: ${days}d ${hours}h ${minutes}m`);
        } else {
          console.log('Auction has ended');
        }
        console.log('------------------------');
      }
    }
    
    if (!hasAuctions) {
      console.log('You have no properties currently on auction.');
    }
  } catch (error) {
    console.error('Error viewing your auctions:', error.message);
    throw error;
  }
};

module.exports = {
  startAuction,
  placeBid,
  viewActiveAuctions,
  endAuction,
  viewMyAuctions
}; 