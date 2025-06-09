const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Import modules
const propertyManagement = require('./modules/property/propertyManagement');
const leaseManagement = require('./modules/lease/leaseManagement');
const transactionManagement = require('./modules/transaction/transactionManagement');
const accountManagement = require('./modules/account/accountManagement');
const propertyTrade = require('./modules/trade/propertyTrade');
const auctionManagement = require('./modules/auction/auctionManagement');
const notaryManagement = require('./modules/notary/notaryManagement');
const rl = require('./modules/utils/readline').getInterface();

// Load the compiled contract JSON
const contractPath = path.resolve(__dirname, 'build/contracts/PropertyManagement.json');
const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

// Setup Web3
const setupWeb3 = () => {
  const web3 = new Web3('http://127.0.0.1:8545'); 
  return web3;
};

// Get accounts
const getAccounts = async (web3) => {
  try {
    const accounts = await web3.eth.getAccounts();
    return accounts;
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw error;
  }
};

// Get contract instance
const getContract = async (web3) => {
  try {
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = contractJson.networks[networkId];
    
    if (!deployedNetwork) {
      throw new Error('Contract not deployed on the current network');
    }
    
    const contract = new web3.eth.Contract(
      contractJson.abi,
      deployedNetwork.address
    );
    
    return contract;
  } catch (error) {
    console.error('Error getting contract instance:', error);
    throw error;
  }
};

// Show menu
const showMenu = async (web3, contract, currentAccount, accounts) => {
    // Get notary address to check if current user is notary
    const notaryAddress = await contract.methods.notary().call();
    const isNotary = currentAccount.toLowerCase() === notaryAddress.toLowerCase();

    console.log('\n===== MENU =====');
    
    // Notary-specific options
    if (isNotary) {
        console.log('\n=== NOTARY ACTIONS ===');
        console.log('1. View Pending Properties');
        console.log('2. Approve Property');
        console.log('3. Reject Property');
        console.log('4. Change Notary');
        console.log('\n=== REGULAR ACTIONS ===');
    }
    
    console.log('5. Register Property');
    console.log('6. List My Properties');
    console.log('7. Create Lease Agreement');
    console.log('8. List My Leases as Landlord');
    console.log('9. List My Leases as Tenant');
    console.log('10. Make Payment');
    console.log('11. View Lease Transactions');
    console.log('12. Terminate Lease');
    console.log('13. Switch Account');
    console.log('14. Check Account Balance');
    console.log('15. Check Expiring Leases');
    console.log('16. Renew Lease');
    console.log('17. View Lease Renewal History');
    console.log('18. List Property For Sale');
    console.log('19. Cancel Property Sale');
    console.log('20. View Properties For Sale');
    console.log('21. Purchase Property');
    console.log('22. View Property Transfer History');
    console.log('23. Start Property Auction');
    console.log('24. View Active Auctions');
    console.log('25. Place Bid on Property');
    console.log('26. End Property Auction');
    console.log('27. View My Properties on Auction');
    console.log('0. Exit');
    
    rl.question('\nSelect an option: ', async (answer) => {
    try {
      // Handle notary actions
      if (isNotary) {
        switch (answer) {
          case '1':
            await notaryManagement.viewPendingProperties(web3, contract, currentAccount);
            await showMenu(web3, contract, currentAccount, accounts);
            return;
          case '2':
            await notaryManagement.approveProperty(web3, contract, currentAccount);
            await showMenu(web3, contract, currentAccount, accounts);
            return;
          case '3':
            await notaryManagement.rejectProperty(web3, contract, currentAccount);
            await showMenu(web3, contract, currentAccount, accounts);
            return;
          case '4':
            await notaryManagement.changeNotary(web3, contract, currentAccount);
            await showMenu(web3, contract, currentAccount, accounts);
            return;
        }
      }

      // Handle regular actions
      switch (answer) {
        case '5':
          await propertyManagement.registerProperty(web3, contract, currentAccount);
          break;
        case '6':
          await propertyManagement.listProperties(web3, contract, currentAccount);
          break;
        case '7':
          await leaseManagement.createLease(web3, contract, currentAccount, accounts);
          break;
        case '8':
          await leaseManagement.listLandlordLeases(web3, contract, currentAccount);
          break;
        case '9':
          await leaseManagement.listTenantLeases(web3, contract, currentAccount);
          break;
        case '10':
          await transactionManagement.makePayment(web3, contract, currentAccount);
          break;
        case '11':
          await transactionManagement.viewTransactions(web3, contract, currentAccount);
          break;
        case '12':
          await leaseManagement.terminateLease(web3, contract, currentAccount);
          break;
        case '13':
          currentAccount = await accountManagement.switchAccount(accounts);
          break;
        case '14':
          await accountManagement.checkBalance(web3, contract, currentAccount);
          break;
        case '15':
          await leaseManagement.checkExpiringLeases(web3, contract, currentAccount);
          break;
        case '16':
          await leaseManagement.renewLease(web3, contract, currentAccount);
          break;
        case '17':
          await leaseManagement.viewLeaseRenewalHistory(web3, contract, currentAccount);
          break;
        case '18':
          await propertyTrade.listPropertyForSale(web3, contract, currentAccount);
          break;
        case '19':
          await propertyTrade.cancelPropertySale(web3, contract, currentAccount);
          break;
        case '20':
          await propertyTrade.viewPropertiesForSale(web3, contract);
          break;
        case '21':
          await propertyTrade.purchaseProperty(web3, contract, currentAccount);
          break;
        case '22':
          await propertyTrade.viewPropertyTransferHistory(web3, contract);
          break;
        case '23':
          await auctionManagement.startAuction(web3, contract, currentAccount);
          break;
        case '24':
          await auctionManagement.viewActiveAuctions(web3, contract, currentAccount);
          break;
        case '25':
          await auctionManagement.placeBid(web3, contract, currentAccount);
          break;
        case '26':
          await auctionManagement.endAuction(web3, contract, currentAccount);
          break;
        case '27':
          await auctionManagement.viewMyAuctions(web3, contract, currentAccount);
          break;
        case '0':
          console.log('Exiting...');
          rl.close();
          process.exit(0);
          break;
        default:
          if (!isNotary || (answer !== '1' && answer !== '2' && answer !== '3' && answer !== '4')) {
            console.log('Invalid option. Please try again.');
          }
          break;
      }
    } catch (error) {
      console.error('Error executing operation:', error.message);
    }
    
    await showMenu(web3, contract, currentAccount, accounts);
  });
};

// Main function
const main = async () => {
  console.log('===== Smart Property Management CLI =====');
  
  const web3 = setupWeb3();
  const accounts = await getAccounts(web3);
  const contract = await getContract(web3);
  
  console.log(`Connected to blockchain. Available accounts:`);
    accounts.forEach((account, index) => {
      console.log(`${index}: ${account}`);
    });
    
  let currentAccount = accounts[0];
  console.log(`\nUsing account: ${currentAccount}`);
  
  showMenu(web3, contract, currentAccount, accounts);
};

main().catch(console.error);