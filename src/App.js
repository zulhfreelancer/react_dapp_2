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
      prettyBal: null
    }
  }

  /* --------------------------------------------------
  * Lifecycle methods
  -------------------------------------------------- */
  componentDidMount() {
    this.initApp();
  }

  /* --------------------------------------------------
  * Custom methods
  -------------------------------------------------- */
  async initApp() {
    this.setState({isLoading: true});
    web3App.init();

    let isConnected = web3App.isConnected();
    let isMetaMask  = web3App.isMetaMask();

    let node_err_msg = "Seems like the node is down. Please switch to another node in MetaMask settings.";
    if (!isConnected && isMetaMask) return this.setState({isLoading: false, error: node_err_msg});

    let isWeb3      = web3App.isWeb3();
    let accounts    = await web3App.getAccounts();

    let newState = {
      isWeb3: isWeb3,
      accounts: accounts,
      isMetaMask: isMetaMask,
      isLoading: false
    }
    this.setState(newState);
    this.listenAccountChange();
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
          this.fetchBalance();
        });
      }
    }, 1000);
  }

  async fetchBalance() {
    let balanceRaw = await web3App.getTokenBalance('raw');
    let prettyBal  = await web3App.getTokenBalance(null);
    this.setState({ balanceRaw: balanceRaw, prettyBal: prettyBal });
  }

  render() {
    const {isLoading, isMetaMask, accounts, error, balanceRaw, prettyBal} = this.state;

    if (error && !isLoading) {
      return <center>
        <p>
          {error}
        </p>
      </center>
    }

    if (isLoading) {
      return <center>
        <p>
          Loading...
        </p>
      </center>;
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
          Not able to get MetaMask account. Please unlock your MetaMask.
        </p>
      </center>;
    }

    return (
      <div className="container">
        <p>Hello!</p>
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
