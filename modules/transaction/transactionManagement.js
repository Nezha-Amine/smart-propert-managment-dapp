const Web3 = require('web3');
const rl = require('../utils/readline').getInterface();

// Make payment
const makePayment = async (web3, contract, account) => {
  try {
    const balance = await web3.eth.getBalance(account);
    console.log(`\n===== CURRENT ACCOUNT BALANCE =====`);
    console.log(`Address: ${account}`);
    console.log(`Balance: ${web3.utils.fromWei(balance, 'ether')} ETH`);
    
    const leaseIds = await contract.methods.getTenantLeases(account).call();
    
    if (leaseIds.length === 0) {
      console.log('You have no leases as a tenant. Cannot make payment.');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      console.log('\n===== YOUR LEASES AS TENANT =====');
      leaseIds.forEach(async (id) => {
        const lease = await contract.methods.getLeaseById(id).call();
        console.log(`ID: ${id} - Monthly Rent: ${web3.utils.fromWei(lease.monthlyRent, 'ether')} ETH, Security Deposit: ${web3.utils.fromWei(lease.securityDeposit, 'ether')} ETH`);
      });
      
      rl.question('\nSelect lease ID for payment: ', (leaseId) => {
        console.log('\nPayment types:');
        console.log('1. RENT');
        console.log('2. SECURITY_DEPOSIT');
        
        rl.question('Select payment type (1 or 2): ', async (typeChoice) => {
          try {
            const lease = await contract.methods.getLeaseById(leaseId).call();
            let paymentType, amount;
            
            if (typeChoice === '1') {
              paymentType = 'RENT';
              amount = lease.monthlyRent;
            } else if (typeChoice === '2') {
              paymentType = 'SECURITY_DEPOSIT';
              amount = lease.securityDeposit;
            } else {
              console.log('Invalid payment type.');
              reject(new Error('Invalid payment type'));
              return;
            }
            
            if (new web3.utils.BN(balance).lt(new web3.utils.BN(amount))) {
              console.log(`\nERROR: Insufficient funds!`);
              console.log(`Required: ${web3.utils.fromWei(amount, 'ether')} ETH`);
              console.log(`Available: ${web3.utils.fromWei(balance, 'ether')} ETH`);
              reject(new Error('Insufficient funds'));
              return;
            }
            
            console.log(`Making ${paymentType} payment of ${web3.utils.fromWei(amount, 'ether')} ETH...`);
            
            const result = await contract.methods
              .makePayment(leaseId, paymentType)
              .send({ 
                from: account, 
                value: amount,
                gas: 500000 
              });
            
            console.log('Payment successful!');
            console.log(`Transaction hash: ${result.transactionHash}`);
            
            const newBalance = await web3.eth.getBalance(account);
            console.log(`\n===== NEW ACCOUNT BALANCE =====`);
            console.log(`Address: ${account}`);
            console.log(`Balance: ${web3.utils.fromWei(newBalance, 'ether')} ETH`);
            
            resolve(result);
          } catch (error) {
            console.error('Error making payment:', error.message);
            reject(error);
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in payment process:', error.message);
    throw error;
  }
};

// View transactions
const viewTransactions = async (web3, contract, account) => {
  try {
    const landlordLeaseIds = await contract.methods.getLandlordLeases(account).call();
    const tenantLeaseIds = await contract.methods.getTenantLeases(account).call();
    const allLeaseIds = [...new Set([...landlordLeaseIds, ...tenantLeaseIds])];
    
    if (allLeaseIds.length === 0) {
      console.log('You have no leases to view transactions for.');
      return [];
    }
    
    return new Promise((resolve, reject) => {
      console.log('\n===== YOUR LEASES =====');
      allLeaseIds.forEach(async (id) => {
        const lease = await contract.methods.getLeaseById(id).call();
        console.log(`ID: ${id} - ${lease.landlord === account ? 'As Landlord' : 'As Tenant'}`);
      });
      
      rl.question('\nSelect lease ID to view transactions: ', async (leaseId) => {
        try {
          console.log('Fetching transactions...');
          const transactions = await contract.methods.getLeaseTransactions(leaseId).call();
          
          if (transactions.length === 0) {
            console.log('No transactions found for this lease.');
            resolve([]);
            return;
          }
          
          console.log('\n===== LEASE TRANSACTIONS =====');
          transactions.forEach(tx => {
            console.log(`\nTransaction ID: ${tx.id}`);
            console.log(`From: ${tx.from}`);
            console.log(`To: ${tx.to}`);
            console.log(`Amount: ${web3.utils.fromWei(tx.amount, 'ether')} ETH`);
            console.log(`Type: ${tx.transactionType}`);
            console.log(`Date: ${new Date(tx.timestamp * 1000).toLocaleString()}`);
          });
          
          resolve(transactions);
        } catch (error) {
          console.error('Error fetching transactions:', error.message);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error viewing transactions:', error.message);
    throw error;
  }
};

module.exports = {
  makePayment,
  viewTransactions
}; 