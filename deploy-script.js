const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Function to check if contract is already deployed
const isContractDeployed = () => {
  try {
    const contractPath = path.resolve(__dirname, 'build/contracts/PropertyManagement.json');
    if (!fs.existsSync(contractPath)) {
      return false;
    }
    
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    return contractJson.networks && Object.keys(contractJson.networks).length > 0;
  } catch (error) {
    console.error('Error checking if contract is deployed:', error);
    return false;
  }
};

// Function to compile and deploy contract
// In deploy-script.js, modify the compileAndDeploy function:
const compileAndDeploy = () => {
    return new Promise((resolve, reject) => {
      console.log('Compiling and deploying contracts...');
      
      // Run truffle migrate with verbose output
      exec('truffle migrate --reset --verbose-rpc', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing truffle migrate: ${error.message}`);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        
        console.log(stdout);
        console.log('Contracts compiled and deployed successfully!');
        
        // Verify the contract address
        try {
          const contractPath = path.resolve(__dirname, 'build/contracts/PropertyManagement.json');
          const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
          const networkId = Object.keys(contractJson.networks)[0];
          console.log(`Contract deployed on network ${networkId} at address ${contractJson.networks[networkId].address}`);
        } catch (err) {
          console.error('Error verifying contract deployment:', err);
        }
        
        resolve();
      });
    });
  };

// Function to run a local blockchain (Ganache) if not already running
const runLocalBlockchain = () => {
  return new Promise((resolve, reject) => {
    // Check if Ganache is running
    const checkGanache = exec('lsof -i :8545', (error, stdout) => {
      if (stdout && stdout.includes('LISTEN')) {
        console.log('Ganache is already running on port 8545.');
        resolve();
      } else {
        console.log('Starting Ganache...');
        
        // Start Ganache in a separate process
        const ganache = exec('ganache-cli -p 8545', (error) => {
          if (error) {
            console.error(`Error starting Ganache: ${error.message}`);
            reject(error);
          }
        });
        
        ganache.stdout.on('data', (data) => {
          console.log(`Ganache: ${data}`);
          // Once we see that Ganache has started, we can proceed
          if (data.includes('Listening on')) {
            console.log('Ganache started successfully!');
            resolve();
          }
        });
        
        ganache.stderr.on('data', (data) => {
          console.error(`Ganache Error: ${data}`);
        });
      }
    });
  });
};

// Main function
const main = async () => {
  try {
    // Check if contracts are already deployed
    if (isContractDeployed()) {
      console.log('Contracts are already deployed.');
    } else {
      // Run local blockchain if needed
      await runLocalBlockchain();
      
      // Compile and deploy contracts
      await compileAndDeploy();
    }
    
    // Run the CLI tool
    console.log('Starting CLI tool...');
    require('./cli-tool');
  } catch (error) {
    console.error('Error in deployment process:', error);
    process.exit(1);
  }
};

// Start the script
main();