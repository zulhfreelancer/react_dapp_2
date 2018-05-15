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
    console.log('----------- init -----------');

    // setting default module states
    web3App.instance           = null;
    web3App.contracts          = {};
    web3App.isContractDeployed = false;

    await web3App.initWeb3();
    await web3App.initContract('TutorialToken');
    web3App.checkConnection(); // not an `await` because it's not a promise
    await web3App.checkContract();
  },

  // `web3App.web3` is `window.web3`
  initWeb3: function() {
    if (typeof web3App.web3 !== 'undefined') {
      // setting provider string
      web3App.web3Provider = web3App.web3.currentProvider;

      // setting the web3 instance
      web3App.instance = new Web3(web3App.web3.currentProvider);

      // console.log('web3 instance successfully created');
    } else {
      // console.log('web3 instance is null');
    }
  },

  initContract: async function(tokenName) {
    if (!web3App.instance) return;
    let res = await fetch(`./abi/${tokenName}.json`);
    let abi = await res.json();
    // console.log('abi', abi);
    web3App.contracts.TutorialToken = TruffleContract(abi);
    web3App.contracts.TutorialToken.setProvider(web3App.web3Provider);
  },

  getNetworkId: function() {
    return new Promise(function(resolve, reject){
      if (!web3App.instance) {
        resolve(0);
      }

      web3App.instance.eth.net.getId()
        .then(function(data){
          resolve(data);
        })
        .catch(function(err){
          resolve(0);
        })
    })
  },

  getContractInstance: async function() {
    try {
      let contractInstance = await web3App.contracts.TutorialToken.deployed();
      return contractInstance;
    } catch(error) {
      console.log('getContractInstance error');
      web3App.isContractDeployed = false;
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
      // console.log('getContractAddress error');
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

  checkConnection: function() {
    if (!web3App.instance) {
      // console.log('checkConnection.1');
      return web3App.isConnected = false;
    }

    // e.g. Mist users
    if (web3App.instance.currentProvider.constructor.name !== 'MetamaskInpageProvider') {
      // console.log('checkConnection.2');
      return web3App.isConnected = false;
    }

    // not the best solution - https://github.com/MetaMask/metamask-extension/issues/4126
    if (web3App.instance.currentProvider.publicConfigStore._state.networkVersion !== 'loading') {
      // console.log('checkConnection.3');
      web3App.isConnected = true;
    } else {
      // console.log('checkConnection.4');
      web3App.isConnected = false;
    }
  },

  /**
  * How to simulate this in dev?
  *   1. deploy the contract to Ganache
  *   2. switch MetaMask network from Private Network to Main Network
  *   3. switch back to Private Network
  */
  checkContract: function() {
    console.log('I get called inside checkContract');
    if (!web3App.isConnected) return;
    return new Promise(function(resolve, reject){
      console.log('I get called inside checkContract promise block');
      web3App.getContractAddress()
        .then(function(address){
          if (!address) return resolve(); // address is null
          console.log('contract address', address);
          return web3App.instance.eth.getCode(address);
        })
        .then(function(byteCode){
          let result = byteCode !== '0x0';
          // console.log('byteCode', byteCode, 'result', result);
          result ? web3App.isContractDeployed = true : web3App.isContractDeployed = false;
          resolve();
        })
        .catch(function(err){
          reject();
        })
    })
  },

}

export default web3App;
