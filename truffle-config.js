const HDWalletProvider = require('@truffle/hdwallet-provider');

// This mnemonic will generate the same accounts every time
const mnemonic = 'test test test test test test test test test test test junk';

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 1337,
      gas: 6721975,
      gasPrice: 20000000000,
      from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // First account as notary
    },
  },
  compilers: {
    solc: {
      version: "0.8.21",
      settings: {
        viaIR: true,
        optimizer: {
          enabled: true,
          runs: 1
        }
      }
    },
  },
};