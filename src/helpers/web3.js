import Web3 from 'web3';

let web3App = {
  web3: window.web3,
  instance: null,

  init: function() {
    web3App.initWeb3();
    web3App.initContract();
  },

  initWeb3: function() {
    if (typeof web3App.web3 !== 'undefined') {
      // console.log('web3 is available');
      web3App.web3Provider = web3App.web3.currentProvider;
      web3App.instance = new Web3(web3App.web3.currentProvider);
    }
  },

  initContract: function() {
    // console.log('Hello from initContract');
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
