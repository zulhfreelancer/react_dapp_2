import React, { Component } from 'react';
import web3App from './helpers/web3';

class App extends Component {
  constructor(props) {
    super();

    this.state = {
      web3: null,
      isWeb3: false,
      isMetaMask: false,
      accounts: [],
      isLoading: false,
      error: null,
      balanceRaw: null,
      prettyBal: null,
      isDeployed: false,
      contractAddress: null
    }
  }

  /* --------------------------------------------------
  * Lifecycle methods
  -------------------------------------------------- */
  componentDidMount() {
    this.preBootApp();
  }

  /* --------------------------------------------------
  * Custom methods
  -------------------------------------------------- */
  async preBootApp() {
    this.setState({isLoading: true});
    await web3App.init();
    let isWeb3     = web3App.isWeb3();
    let isMetaMask = web3App.isMetaMask();

    this.setState({
      isWeb3: isWeb3,
      isMetaMask: isMetaMask
    });

    this.bootApp();
  }

  async bootApp() {
    let isConnected  = web3App.isConnected();
    let isMetaMask   = this.state.isMetaMask;
    let node_err_msg = "Node is down. Please switch to another node in MetaMask settings.";
    if (!isConnected && isMetaMask) return this.setState({isLoading: false, error: node_err_msg});

    this.updateAccountAndContract();
    this.listenAccountChange();
  }

  async updateAccountAndContract() {
    let accounts        = await web3App.getAccounts();
    let isDeployed      = web3App.isContractDeployed;
    let contractAddress = await web3App.getContractAddress();

    this.setState({
      accounts: accounts,
      isDeployed: isDeployed,
      contractAddress: contractAddress,
      isLoading: false,
    });

    this.fetchBalance();
  }

  // this polling function will get called we user login/logout/switch account
  // we don't have subscribe/event yet for this - see: http://bit.ly/2HDTCZM
  listenAccountChange() {
    if (!this.state.isMetaMask) return;
    const self = this;
    setInterval(async function() {
      if (await web3App.getAccount(0) !== self.state.accounts[0]) {
        self.setState({ accounts: await web3App.getAccounts() }, function() {
          self.updateAccountAndContract();
        });
      }
    }, 1000);
  }

  async fetchBalance() {
    if (!this.state.isDeployed) return;
    if (this.state.accounts.length === 0) return;

    let balanceRaw = await web3App.getTokenBalance('raw');
    let prettyBal  = await web3App.getTokenBalance(null);
    this.setState({ balanceRaw: balanceRaw, prettyBal: prettyBal });
  }

  render() {
    const {
      isLoading,
      isMetaMask,
      accounts,
      error,
      balanceRaw,
      prettyBal,
      isDeployed,
      contractAddress
    } = this.state;

    if (isLoading) {
      return <center>
        <p>
          Loading...
        </p>
      </center>;
    }

    if (error && !isLoading) {
      return <center>
        <p>
          {error}
        </p>
      </center>
    }

    if (!isMetaMask) {
      return <center>
        <p>
          Sorry, we only support MetaMask at this moment. Please install it and refresh this page.
        </p>
      </center>;
    }

    if (accounts.length === 0) {
      return <center>
        <p>
          Please unlock your MetaMask.
        </p>
      </center>;
    }

    if (!isDeployed) {
      return <center>
        <p>
          Seems like the contract is not deployed on this network.
        </p>
      </center>;
    }

    return (
      <div className="container">
        <p>Hello!</p>
        <p><b>Contract Address</b></p>
        <p>{contractAddress}</p>
        <p><b>Active Account</b></p>
        <p>{accounts[0]}</p>
        <p><b>Balance</b></p>
        <p>Raw: {balanceRaw}</p>
        <p>Pretty: {prettyBal}</p>
      </div>
    );
  }
}

export default App;
