import React, { Component } from 'react';
import web3App from './helpers/web3';

class App extends Component {
  constructor(props) {
    super(props);
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
      contractAddress: null,
      isNodeDown: true,
      nodeStartedCount: 0
    }
  }

  /* --------------------------------------------------
  * Lifecycle methods
  -------------------------------------------------- */
  componentDidMount() {
    // console.clear();
    console.log('componentDidMount');
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

    if (!isMetaMask) {
      return this.setState({
        error: "Sorry, we only support MetaMask. Please install it and refresh this page.",
        isLoading: false
      });
    }

    await this.bootApp();
  }

  async bootApp() {
    console.log('bootApp');
    let isConnected  = web3App.isConnected;
    let isMetaMask   = this.state.isMetaMask;
    let node_err_msg = "Node is down. Please switch to another node in MetaMask settings.";

    if (!isConnected && isMetaMask) {
      return this.setState({isLoading: false, error: node_err_msg});
    }

    this.listenNodeHeartbeat();
    setInterval(() => this.listenNodeHeartbeat(), 1000);

    this.listenAccountChange();
  }

  async updateAccountAndContract() {
    console.log('updateAccountAndContract');
    await web3App.getContractInstance();

    let accounts        = await web3App.getAccounts();
    // console.log('updateAccountAndContract.accounts', accounts);
    let isDeployed      = web3App.isContractDeployed;
    console.log('updateAccountAndContract.isDeployed', isDeployed);
    let contractAddress = await web3App.getContractAddress();

    if (accounts.length === 0) {
      return this.showMetaMaskIsLockedError();
    }

    if (!isDeployed) {
      let msg = "Contract is not deployed on this network. "
      if (window.location.port === "3000") {
        msg +=
        "If you just deploy it, switch to Main network and switch back to Custom network in MetaMask"
      }
      return this.setState({
        error: msg,
        isLoading: false
      });
    }

    console.log('after return');

    this.setState({
      accounts: accounts,
      isDeployed: isDeployed,
      contractAddress: contractAddress,
      isLoading: false,
      error: null
    });

    this.fetchBalance();
  }

  showMetaMaskIsLockedError() {
    const errorMsg = "Please unlock your MetaMask.";

    // avoid useless state update
    if (this.state.error !== errorMsg) {
      this.setState({
        accounts: [],
        error: errorMsg,
        isLoading: false
      });
    }
  }

  // this polling function will get called when user login/logout/switch account
  // we don't have subscribe/event yet for this - see: http://bit.ly/2HDTCZM
  listenAccountChange() {
    // console.log('listenAccountChange');
    if (!this.state.isMetaMask) return;
    const self = this;
    setInterval(async function() {
      const firstAccount = await web3App.getAccount(0);
      const stateAccount = self.state.accounts[0];
      // console.log(firstAccount, stateAccount);

      if (typeof firstAccount === 'undefined') {
        return self.showMetaMaskIsLockedError();
      }

      if (firstAccount !== stateAccount) {
        console.log('account changed');
        self.setState({ accounts: await web3App.getAccounts() }, function() {
          self.updateAccountAndContract();
        });
      }
    }, 1000);
  }

  async listenNodeHeartbeat() {
    const self = this;
    const errorMsg = 'The node is down';
    let netId  = await web3App.getNetworkId();
    // console.log('netId', netId, 'error', self.state.error);
    if (netId === 0 && self.state.error !== errorMsg) {
      console.log('node is down');
      return self.setState({error: errorMsg, isLoading: false, isNodeDown: true});
    }

    if (netId !== 0 && self.state.isNodeDown) {
      console.log('node is up');
      const nsc = self.state.nodeStartedCount + 1;
      self.setState(
        {isLoading: true, isNodeDown: false, nodeStartedCount: nsc},
        function() {
          if (self.state.nodeStartedCount > 1) {
            self.setState({error: 'Node is back up. Please re-login your MetaMask.', isLoading: false})
          }
        }
      );
    }
  }

  async fetchBalance() {
    console.log('fetchBalance');
    if (!this.state.isDeployed) return;
    if (this.state.accounts.length === 0) return;
    if (this.state.error) return;

    let balanceRaw = await web3App.getTokenBalance('raw');
    let prettyBal  = await web3App.getTokenBalance(null);
    this.setState({ balanceRaw: balanceRaw, prettyBal: prettyBal });
  }

  render() {
    const {
      isLoading,
      accounts,
      error,
      balanceRaw,
      prettyBal,
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

    // console.log(this.state);

    return (
      <div className="container">
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
