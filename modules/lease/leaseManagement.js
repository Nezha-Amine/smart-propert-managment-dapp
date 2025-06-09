const Web3 = require('web3');
const rl = require('../utils/readline').getInterface();

// Create lease agreement
const createLease = async (web3, contract, account, accounts) => {
  try {
    console.log('Fetching your properties...');
    const propertyIds = await contract.methods.getOwnerProperties(account).call();
    
    if (propertyIds.length === 0) {
      console.log('You have no registered properties. Please register a property first.');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      console.log('\n===== YOUR PROPERTIES =====');
      propertyIds.forEach(async (id) => {
        const property = await contract.methods.getPropertyById(id).call();
        console.log(`ID: ${id} - ${property.propertyAddress}`);
      });
      
      rl.question('\nSelect property ID for lease: ', (propertyId) => {
        console.log('\n===== AVAILABLE ACCOUNTS (POTENTIAL TENANTS) =====');
        accounts.forEach((acc, index) => {
          if (acc !== account) {
            console.log(`${index}: ${acc}`);
          }
        });
        
        rl.question('\nSelect tenant account index: ', (tenantIndex) => {
          const tenantAccount = accounts[tenantIndex];
          
          rl.question('Enter monthly rent (in ETH): ', (rent) => {
            const rentInWei = web3.utils.toWei(rent, 'ether');
            rl.question('Enter security deposit (in ETH): ', async (deposit) => {
              try {
                const depositInWei = web3.utils.toWei(deposit, 'ether');
                const now = Math.floor(Date.now() / 1000);
                const oneYearFromNow = now + 31536000;
                
                console.log('Creating lease agreement...');
                const result = await contract.methods
                  .createLeaseAgreement(
                    propertyId,
                    tenantAccount,
                    rentInWei,
                    depositInWei,
                    now,
                    oneYearFromNow
                  )
                  .send({ from: account, gas: 500000 });
                
                const leaseId = result.events.LeaseCreated.returnValues.leaseId;
                console.log(`Lease created successfully! Lease ID: ${leaseId}`);
                resolve(result);
              } catch (error) {
                console.error('Error creating lease:', error.message);
                reject(error);
              }
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in create lease process:', error.message);
    throw error;
  }
};

// List landlord leases
const listLandlordLeases = async (web3, contract, account) => {
  try {
    console.log('Fetching leases where you are the landlord...');
    const leaseIds = await contract.methods.getLandlordLeases(account).call();
    
    if (leaseIds.length === 0) {
      console.log('You have no leases as a landlord.');
      return [];
    }
    
    console.log('\n===== YOUR LEASES AS LANDLORD =====');
    const leases = [];
    for (const id of leaseIds) {
      const lease = await contract.methods.getLeaseById(id).call();
      const property = await contract.methods.getPropertyById(lease.propertyId).call();
      
      const expirationInfo = lease.isActive ? 
        await contract.methods.checkLeaseExpiration(id).call() :
        { isExpiring: false, daysRemaining: 0 };
      
      console.log(`\nLease ID: ${lease.id}`);
      console.log(`Property: ${property.propertyAddress} (ID: ${lease.propertyId})`);
      console.log(`Tenant: ${lease.tenant}`);
      console.log(`Monthly Rent: ${web3.utils.fromWei(lease.monthlyRent, 'ether')} ETH`);
      console.log(`Security Deposit: ${web3.utils.fromWei(lease.securityDeposit, 'ether')} ETH`);
      console.log(`Start Date: ${new Date(lease.startDate * 1000).toLocaleString()}`);
      console.log(`End Date: ${new Date(lease.endDate * 1000).toLocaleString()}`);
      console.log(`Active: ${lease.isActive ? 'Yes' : 'No'}`);
      
      if (lease.isActive && expirationInfo.isExpiring) {
        console.log(`⚠️ EXPIRING SOON: ${expirationInfo.daysRemaining} days remaining`);
      }
      
      leases.push({ ...lease, property, expirationInfo });
    }
    return leases;
  } catch (error) {
    console.error('Error listing landlord leases:', error.message);
    throw error;
  }
};

// List tenant leases
const listTenantLeases = async (web3, contract, account) => {
  try {
    console.log('Fetching leases where you are the tenant...');
    const leaseIds = await contract.methods.getTenantLeases(account).call();
    
    if (leaseIds.length === 0) {
      console.log('You have no leases as a tenant.');
      return [];
    }
    
    console.log('\n===== YOUR LEASES AS TENANT =====');
    const leases = [];
    for (const id of leaseIds) {
      const lease = await contract.methods.getLeaseById(id).call();
      const property = await contract.methods.getPropertyById(lease.propertyId).call();
      
      const expirationInfo = lease.isActive ? 
        await contract.methods.checkLeaseExpiration(id).call() :
        { isExpiring: false, daysRemaining: 0 };
      
      console.log(`\nLease ID: ${lease.id}`);
      console.log(`Property: ${property.propertyAddress} (ID: ${lease.propertyId})`);
      console.log(`Landlord: ${lease.landlord}`);
      console.log(`Monthly Rent: ${web3.utils.fromWei(lease.monthlyRent, 'ether')} ETH`);
      console.log(`Security Deposit: ${web3.utils.fromWei(lease.securityDeposit, 'ether')} ETH`);
      console.log(`Start Date: ${new Date(lease.startDate * 1000).toLocaleString()}`);
      console.log(`End Date: ${new Date(lease.endDate * 1000).toLocaleString()}`);
      console.log(`Active: ${lease.isActive ? 'Yes' : 'No'}`);
      
      if (lease.isActive && expirationInfo.isExpiring) {
        console.log(`⚠️ EXPIRING SOON: ${expirationInfo.daysRemaining} days remaining`);
      }
      
      leases.push({ ...lease, property, expirationInfo });
    }
    return leases;
  } catch (error) {
    console.error('Error listing tenant leases:', error.message);
    throw error;
  }
};

// Check expiring leases
const checkExpiringLeases = async (web3, contract, account) => {
  try {
    console.log('\n===== CHECKING FOR EXPIRING LEASES =====');
    const expiringLeaseIds = await contract.methods.getExpiringLeases(account).call();
    
    if (expiringLeaseIds.length === 0) {
      console.log('You have no leases expiring soon (within 30 days).');
      return [];
    }
    
    const expiringLeases = [];
    for (const leaseId of expiringLeaseIds) {
      const lease = await contract.methods.getLeaseById(leaseId).call();
      const property = await contract.methods.getPropertyById(lease.propertyId).call();
      const expirationInfo = await contract.methods.checkLeaseExpiration(leaseId).call();
      
      console.log(`\n==== LEASE ID: ${leaseId} ====`);
      console.log(`Property: ${property.propertyAddress}`);
      console.log(`Tenant: ${lease.tenant}`);
      console.log(`End Date: ${new Date(lease.endDate * 1000).toLocaleString()}`);
      console.log(`Days Remaining: ${expirationInfo.daysRemaining}`);
      
      expiringLeases.push({ ...lease, property, expirationInfo });
    }
    return expiringLeases;
  } catch (error) {
    console.error('Error checking expiring leases:', error.message);
    throw error;
  }
};

// Renew lease
const renewLease = async (web3, contract, account) => {
  try {
    const leaseIds = await contract.methods.getLandlordLeases(account).call();
    
    if (leaseIds.length === 0) {
      console.log('You have no leases as a landlord. Cannot renew.');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      console.log('\n===== YOUR LEASES AS LANDLORD =====');
      leaseIds.forEach(async (id) => {
        const lease = await contract.methods.getLeaseById(id).call();
        if (lease.isActive) {
          const property = await contract.methods.getPropertyById(lease.propertyId).call();
          const expirationInfo = await contract.methods.checkLeaseExpiration(id).call();
          
          console.log(`ID: ${id} - Property: ${property.propertyAddress}`);
          console.log(`Current Rent: ${web3.utils.fromWei(lease.monthlyRent, 'ether')} ETH`);
          console.log(`Days Remaining: ${expirationInfo.daysRemaining}`);
        }
      });
      
      rl.question('\nSelect lease ID to renew: ', (leaseId) => {
        contract.methods.getLeaseById(leaseId).call()
          .then(lease => {
            rl.question('\nEnter new monthly rent (in ETH): ', (newRent) => {
              const newRentInWei = web3.utils.toWei(newRent, 'ether');
              rl.question('Enter new security deposit (in ETH): ', async (newDeposit) => {
                try {
                  const newDepositInWei = web3.utils.toWei(newDeposit, 'ether');
                  const currentEndDate = parseInt(lease.endDate);
                  const oneYearInSeconds = 31536000;
                  const newEndDate = currentEndDate + oneYearInSeconds;
                  
                  console.log('\nRenewing lease with following terms:');
                  console.log(`New Monthly Rent: ${newRent} ETH`);
                  console.log(`New Security Deposit: ${newDeposit} ETH`);
                  console.log(`New End Date: ${new Date(newEndDate * 1000).toLocaleString()}`);
                  
                  const result = await contract.methods
                    .renewLease(leaseId, newRentInWei, newDepositInWei, newEndDate)
                    .send({ from: account, gas: 500000 });
                  
                  console.log('Lease renewed successfully!');
                  resolve(result);
                } catch (error) {
                  console.error('Error renewing lease:', error.message);
                  reject(error);
                }
              });
            });
          })
          .catch(error => {
            console.error('Error fetching lease details:', error.message);
            reject(error);
          });
      });
    });
  } catch (error) {
    console.error('Error in lease renewal process:', error.message);
    throw error;
  }
};

// Terminate lease
const terminateLease = async (web3, contract, account) => {
  try {
    const leaseIds = await contract.methods.getLandlordLeases(account).call();
    
    if (leaseIds.length === 0) {
      console.log('You have no leases as a landlord. Cannot terminate lease.');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      console.log('\n===== YOUR LEASES AS LANDLORD =====');
      leaseIds.forEach(async (id) => {
        const lease = await contract.methods.getLeaseById(id).call();
        if (lease.isActive) {
          const property = await contract.methods.getPropertyById(lease.propertyId).call();
          console.log(`ID: ${id} - Property: ${property.propertyAddress}, Tenant: ${lease.tenant}`);
        }
      });
      
      rl.question('\nSelect lease ID to terminate: ', async (leaseId) => {
        try {
          console.log('Terminating lease...');
          const result = await contract.methods.terminateLease(leaseId).send({ from: account });
          console.log('Lease terminated successfully!');
          resolve(result);
        } catch (error) {
          console.error('Error terminating lease:', error.message);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error in terminate lease process:', error.message);
    throw error;
  }
};

module.exports = {
  createLease,
  listLandlordLeases,
  listTenantLeases,
  checkExpiringLeases,
  renewLease,
  terminateLease
}; 