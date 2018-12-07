App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Initialize web3 and set provider to the Ganache(testRPC).
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Set custom provider from Web3.providers
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
      $.getJSON('AvsToken.json', function(data) {
          // Get the necessary contract artifact file and instantiate it with truffle-contract.
          var AvsTokenArtifact = data;
          App.contracts.AvsToken = TruffleContract(AvsTokenArtifact);

          // Set provider for the contract.
          App.contracts.AvsToken.setProvider(App.web3Provider);

          // Use the contract to retieve account ballance and tx's history
          App.getAccountTxHistory();
          return App.getBalance();       
      });
      return App.bindEvents();
  },


  bindEvents: function() {
    $(document).on('click', '#transferButton', App.handleTransfer);
    $(document).on('click', '#burnButton', App.handleBurn);
  },


  getBalance: function() {
    console.log('Getting the account balance...');
    var AvsTokenInstance;
    var account;
    web3.eth.getAccounts(function(error, accounts) {
        if (error) { console.log(error); }
        account = accounts[0];
        App.contracts.AvsToken.deployed
        ().then(function(instance) {
            AvsTokenInstance = instance;
            return AvsTokenInstance.balanceOf(account);
        }).then(function(result) {
            let balance = result.c[0];
            $('#accountAddr').text(account.substring(2));
            $('#AvsBalance').text(balance);
        }).catch(function(error) {
            console.log(error.message);
        });
    });
  },


  getAccountTxHistory: function() {
     console.log("Retreiving transaction history for the account...");
     var accAddress;
     let startBlockNum = 0;
     let latestBlockNum;

     web3.eth.getAccounts(function(error, accounts) {
          if (error) { console.log(error); }
          accAddress = accounts[0];
          
          web3.eth.getBlockNumber(function(error, number) {
              if (error) { console.log(error); }
              latestBlockNum = number;
              for(let i = startBlockNum; i <= latestBlockNum; i++) {

                web3.eth.getBlock(i, true, function(error, result) {
                    if (error) { console.log(error); } 
                    let block = result;
                    //Can't retrieve each tx's timestamp, so will use the block's timestamp
                    let options = {timeZone: 'UTC', hour: 'numeric', minute: 'numeric', second: 'numeric'};
                    let timestamp = new Date(block.timestamp*1000).toLocaleDateString("en-GB", options);
                    if (block != null && block.transactions != null) {
                        block.transactions.forEach(function(tx) {
                            // console.log("Each Tx: ", tx);
                            if ( (accAddress == tx.from || accAddress == tx.to)
                                && tx.to != "0x0" /*contract deployment*/) {                
                                /*
                                web3.eth.getTransactionReceipt(tx.hash, function(error, result) {
                                    if (error) { console.log(error); }
                                    console.log("getTxReceipt() -> ", result);
                                }); */

                                App.generateHTMLandUpdateTxTable(tx, timestamp);
                            }
                        });
                    } else {
                        console.log("Transactions Block is null!");
                    }
              }); 
            }
        });
     });
  },


  handleBurn: function (event) {
    event.preventDefault();
    var AvsTokenInstance;
    var amount = parseInt($('#AvsBurnAmount').val());

    console.log('Burning ' + amount + ' AvS tokens...');

    web3.eth.getAccounts(function(error, accounts) {
        if (error) { console.log(error); }
        var account = accounts[0];
        App.contracts.AvsToken.deployed().then(function(instance) {
            AvsTokenInstance = instance;
            return AvsTokenInstance.burn(amount);
        }).then(function(result) {
              alert('Burned ' + amount + ' AvS Token(s) successfuly!');
              App.generateHTMLandUpdateTxTable(result, null);
              App.resetInputField();
              return App.getBalance();
        }).catch(function(err) {
            console.log(err.message);
        });
    });
  },


  handleTransfer: function(event) {
    event.preventDefault();
    var toAddress = $('#AvsTransferAddress').val();
    var amount = parseInt($('#AvsTransferAmount').val());
    var AvsTokenInstance;

    console.log('Transfer ' + amount + ' AvS to ' + toAddress);

    web3.eth.getAccounts(function(error, accounts) {
      if (error) { console.log(error); }
      var account = accounts[0];
      App.contracts.AvsToken.deployed
      ().then(function(instance) {
          AvsTokenInstance = instance;
          return AvsTokenInstance.transfer(toAddress, amount, {from: account, gas: 100000});
      }).then(function(result) {
          alert('Transferred ' + amount + ' token(s) successfully!');
          App.generateHTMLandUpdateTxTable(result, null);
          App.resetInputField();
          return App.getBalance();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  
  generateHTMLandUpdateTxTable: function(result, blockTimestamp) {
      let txHash;
      let options;
      let txDateTime;
      let txEvent;
      let index;
      let txFrom;
      let txTo;
      let txValue;
      //let txGasUsed;
      //let txStatus;       //'0x1' -> success, '0x0 -> failure' */

      if (blockTimestamp == null) { // this is fresh tx details coming from GUI
          txHash = result.tx;
          options = {timeZone: 'UTC', hour: 'numeric', minute: 'numeric', second: 'numeric'};
          txDateTime = new Date().toLocaleDateString("en-GB", options);
          txEvent = result.logs[0].event;
          switch(txEvent) {
            case "Transfer" : index = 0; break;
            case "Burn" : index = 1; break;
          }
          txFrom = result.logs[index].args.from;
          txTo = result.logs[index].args.to;
          txValue = result.logs[0].args.value.c[0];
          //txGasUsed = result.receipt.gasUsed;
          //txStatus = result.receipt.status;
      } else { // this is tx details from Blockchain logs
          txHash = result.hash;
          txDateTime = blockTimestamp;
          txEvent = "Transfer";
          txFrom = result.from;
          txTo = result.to;
          txValue = result.value;
      }

      //console.log('Result: ', result);

      //Construct a table row and fill it with tx details
      let rowHTML = "<tr>";
          rowHTML += "<td title=\"" + txHash + "\">" + txHash + "</td>";
          rowHTML += "<td title=\"" + txEvent + "\">" + txEvent + "</td>";
          rowHTML += "<td title=\"" + txDateTime + "\">" + txDateTime + "</td>";
          rowHTML += "<td title=\"" + txFrom + "\">" + txFrom + "</td>";
          rowHTML += "<td title=\"" + txTo + "\">" + txTo + "</td>";
          rowHTML += "<td title=\"" + txValue + "\">" + txValue + "</td>";
          rowHTML += "</tr>";

      $(rowHTML).prependTo('table tbody');
  },


  resetInputField: function() {
      $('#AvsTransferAddress').val('');
      $('#AvsTransferAmount').val('');
      $('#AvsBurnAmount').val('');
  }
},


$(function() {
  $(window).load(function() {
    App.init();
  });
});
