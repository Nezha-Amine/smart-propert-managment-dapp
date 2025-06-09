const ganache = require("ganache");

const options = {
  wallet: {
    mnemonic: "test test test test test test test test test test test junk",
    totalAccounts: 10,
    accountKeysPath: "./ganache-accounts.json",
    unlockedAccounts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  },
  chain: {
    chainId: 1337,
    networkId: 1337
  },
  miner: {
    blockGasLimit: 6721975,
    defaultGasPrice: 20000000000
  },
  logging: {
    quiet: false
  }
};

const server = ganache.server(options);

server.listen(8545, async (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Ganache listening on port 8545");
  
  const provider = server.provider;
  const accounts = await provider.request({ method: "eth_accounts" });
  
  // Get wallet info directly from provider
  const wallet = provider.getInitialAccounts();
  
  console.log("\nAvailable Accounts and Private Keys:");
  accounts.forEach((account, i) => {
    const privateKey = wallet[account.toLowerCase()].secretKey;
    console.log(`(${i}) ${account}`);
    console.log(`    Private Key: ${privateKey}`);
  });
}); 