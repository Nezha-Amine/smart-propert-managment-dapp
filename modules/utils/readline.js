const readline = require('readline');

let rl;

const getInterface = () => {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return rl;
};

module.exports = {
  getInterface
}; 