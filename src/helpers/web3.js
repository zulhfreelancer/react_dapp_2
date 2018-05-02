import Web3 from 'web3';
import TruffleContract from 'truffle-contract';
import bigNumberToString from 'bignumber-to-string';
import commaIt from 'comma-it';

let web3App = {
  web3: window.web3,
  instance: null,
  contracts: {},
  isContractDeployed: false,

  init: async function() {
    await web3App.initWeb3();
    await web3App.initContract('TutorialToken');
    await web3App.checkContract();
  },

  initWeb3: function() {
    if (typeof web3App.web3 !== 'undefined') {
      web3App.web3Provider = web3App.web3.currentProvider;
      web3App.instance = new Web3(web3App.web3.currentProvider);
    }
  },

  initContract: async function(tokenName) {
    let res = await fetch(`./abi/${tokenName}.json`);
    let abi = await res.json();
    web3App.contracts.TutorialToken = TruffleContract(abi);
    web3App.contracts.TutorialToken.setProvider(web3App.web3Provider);
  },

  getContractInstance: async function() {
    try {
      let contractInstance = await web3App.contracts.TutorialToken.deployed();
      return contractInstance;
    } catch(error) {
      console.log('getContractInstance error');
    }
  },

  getTokenBalance: async function(format) {
    const accounts = await web3App.getAccounts();
    const account  = accounts[0];
    let contract   = await web3App.getContractInstance();
    let balance    = await contract.balanceOf(account);
    let balanceStr = bigNumberToString(balance);
    if (format === 'raw') return balanceStr;
    return commaIt(balanceStr, {addPrecision: true, thousandSeperator: ',', decimalSeperator:  '.'});
  },

  getWeb3Instance: function() {
    return web3App.instance;
  },

  getAccounts: function() {
    if (web3App.instance) {
      return web3App.instance.eth.getAccounts();
    } else {
      return [];
    }
  },

  getAccount: function(index) {
    if (web3App.instance) {
      return web3App.instance.eth.getAccounts()
        .then(function(accounts){
          return accounts[index]
        });
    } else {
      return "0x0";
    }
  },

  getContractAddress: async function() {
    try {
      let instance = await web3App.getContractInstance();
      return instance.address;
    } catch(error) {
      console.log('getContractAddress error');
    }
  },

  isWeb3: function() {
    return web3App.instance ? true : false;
  },

  isMetaMask: function() {
    if (web3App.instance && web3App.web3.currentProvider.isMetaMask) {
      return true;
    } else {
      return false;
    }
  },

  isConnected: function() {
    if (!web3App.instance) {
      return false;
    }

    if (web3App.instance.currentProvider.constructor.name !== 'MetamaskInpageProvider') {
      return false; // e.g. Mist users
    }

    // not the best solution - https://github.com/MetaMask/metamask-extension/issues/4126
    if (web3App.instance.currentProvider.publicConfigStore._state.networkVersion === 'loading') {
      return false;
    } else {
      return true;
    }
  },

  /**
  * How to simulate this in dev?
  *   1. deploy the contract to Ganache
  *   2. switch MetaMask network from Private Network to Main Network
  *   3. switch back to Private Network
  */
  checkContract: function() {
    if (!web3App.isConnected()) return;
    return new Promise(async function(resolve, reject){
      try {
        let address  = await web3App.getContractAddress();
        if (!address) return resolve(); // address is null
        let byteCode = await web3App.instance.eth.getCode(address);
        let result   = byteCode !== '0x0';
        result ? web3App.isContractDeployed = true : web3App.isContractDeployed = false;
        resolve();
      } catch(error) {
        console.log('checkContract error');
        reject();
      }
    })
  },

}

export default web3App;
