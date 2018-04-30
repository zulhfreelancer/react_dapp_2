import Web3 from 'web3';
import TruffleContract from 'truffle-contract';
import bigNumberToString from 'bignumber-to-string';
import commaIt from 'comma-it';

let web3App = {
  web3: window.web3,
  instance: null,
  contracts: {},

  init: function() {
    web3App.initWeb3();
    web3App.initContract('TutorialToken');
  },

  initWeb3: function() {
    if (typeof web3App.web3 !== 'undefined') {
      // console.log('web3 is available');
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

  getTokenBalance: async function(format) {
    const accounts = await web3App.getAccounts();
    const account  = accounts[0];
    let contract   = await web3App.contracts.TutorialToken.deployed();
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

    if (web3App.instance.currentProvider.publicConfigStore._state.networkVersion === 'loading') {
      return false;
    } else {
      return true;
    }
  }

}

export default web3App;
