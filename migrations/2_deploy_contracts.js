const PropertyManagement = artifacts.require("PropertyManagement");

module.exports = function(deployer, network, accounts) {
  // Deploy the contract with the first account as the notary
  deployer.deploy(PropertyManagement, { from: accounts[0] });
}; 