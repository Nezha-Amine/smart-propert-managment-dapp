const Web3 = require('web3');
const rl = require('../utils/readline').getInterface();

// Switch account
const switchAccount = async (accounts) => {
  return new Promise((resolve, reject) => {
    console.log('\n===== AVAILABLE ACCOUNTS =====');
    accounts.forEach((account, index) => {
      console.log(`${index}: ${account}`);
    });
    
    rl.question('\nSelect account index: ', (index) => {
      if (index >= 0 && index < accounts.length) {
        const selectedAccount = accounts[index];
        console.log(`Switched to account: ${selectedAccount}`);
        resolve(selectedAccount);
      } else {
        console.log('Invalid account index. Please try again.');
        reject(new Error('Invalid account index'));
      }
    });
  });
};

// Check account balance
const checkBalance = async (web3, contract, account) => {
  try {
    const balance = await web3.eth.getBalance(account);
    console.log(`\n===== ACCOUNT BALANCE =====`);
    console.log(`Address: ${account}`);
    console.log(`Balance: ${web3.utils.fromWei(balance, 'ether')} ETH`);
    
    // Get tenant obligations
    const tenantLeaseIds = await contract.methods.getTenantLeases(account).call();
    if (tenantLeaseIds.length > 0) {
      console.log('\n===== YOUR PAYMENT OBLIGATIONS AS TENANT =====');
      let totalRentDue = new web3.utils.BN('0');
      let totalDepositDue = new web3.utils.BN('0');
      
      for (const id of tenantLeaseIds) {
        const lease = await contract.methods.getLeaseById(id).call();
        console.log(`Lease ID: ${id} - Monthly Rent: ${web3.utils.fromWei(lease.monthlyRent, 'ether')} ETH, Security Deposit: ${web3.utils.fromWei(lease.securityDeposit, 'ether')} ETH`);
        
        totalRentDue = totalRentDue.add(new web3.utils.BN(lease.monthlyRent));
        totalDepositDue = totalDepositDue.add(new web3.utils.BN(lease.securityDeposit));
      }
      
      console.log(`\nTotal monthly rent due: ${web3.utils.fromWei(totalRentDue.toString(), 'ether')} ETH`);
      console.log(`Total security deposits due: ${web3.utils.fromWei(totalDepositDue.toString(), 'ether')} ETH`);
      
      if (new web3.utils.BN(balance).lt(totalRentDue)) {
        console.log(`\nWARNING: Insufficient funds for monthly rent payments!`);
      }
      if (new web3.utils.BN(balance).lt(totalDepositDue)) {
        console.log(`WARNING: Insufficient funds for security deposit payments!`);
      }
    }
    
    // Get landlord income
    const landlordLeaseIds = await contract.methods.getLandlordLeases(account).call();
    if (landlordLeaseIds.length > 0) {
      console.log('\n===== YOUR EXPECTED INCOME AS LANDLORD =====');
      let totalRentIncome = new web3.utils.BN('0');
      let totalDepositIncome = new web3.utils.BN('0');
      
      for (const id of landlordLeaseIds) {
        const lease = await contract.methods.getLeaseById(id).call();
        console.log(`Lease ID: ${id} - Monthly Rent: ${web3.utils.fromWei(lease.monthlyRent, 'ether')} ETH, Security Deposit: ${web3.utils.fromWei(lease.securityDeposit, 'ether')} ETH`);
        
        totalRentIncome = totalRentIncome.add(new web3.utils.BN(lease.monthlyRent));
        totalDepositIncome = totalDepositIncome.add(new web3.utils.BN(lease.securityDeposit));
      }
      
      console.log(`\nTotal monthly rent income: ${web3.utils.fromWei(totalRentIncome.toString(), 'ether')} ETH`);
      console.log(`Total security deposits held: ${web3.utils.fromWei(totalDepositIncome.toString(), 'ether')} ETH`);
    }
    
    return {
      balance,
      tenantObligations: {
        leaseIds: tenantLeaseIds,
        totalRentDue: totalRentDue?.toString(),
        totalDepositDue: totalDepositDue?.toString()
      },
      landlordIncome: {
        leaseIds: landlordLeaseIds,
        totalRentIncome: totalRentIncome?.toString(),
        totalDepositIncome: totalDepositIncome?.toString()
      }
    };
  } catch (error) {
    console.error('Error checking balance:', error.message);
    throw error;
  }
};

module.exports = {
  switchAccount,
  checkBalance
}; 