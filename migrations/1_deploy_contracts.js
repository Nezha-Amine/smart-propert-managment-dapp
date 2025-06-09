const PropertyManagement = artifacts.require("PropertyManagement");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(PropertyManagement);
  const instance = await PropertyManagement.deployed();
  
  // Verify deployment
  console.log('Contract deployed at:', instance.address);
  
  // Initialize contract if needed
  try {
    // Add any necessary initialization here
    console.log('Contract initialized successfully');
  } catch (error) {
    console.error('Error during contract initialization:', error);
    throw error;
  }
};
