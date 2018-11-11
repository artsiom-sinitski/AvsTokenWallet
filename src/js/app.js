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
          return App.getBalance();       
      });
      App.getAccountTxHistory();
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
                    //Doen't seem possible to retrieve each tx timestamp, will use the block's timestamp
                    let options = {timeZone: 'UTC', hour: 'numeric', minute: 'numeric', second: 'numeric'};
                    let timestamp = new Date(block.timestamp*1000).toLocaleDateString("en-GB", options);
    
                    if (block != null && block.transactions != null) {
                      block.transactions.forEach(function(tx) {
                        console.log("Each Tx: ", tx);
                          if ( (accAddress == tx.from || accAddress == tx.to)
                              && tx.to != "0x0" /*deployement process*/) {                
                            
                              console.log("   tx hash         : " + tx.hash + "\n"
                                        + "   nonce           : " + tx.nonce + "\n"
                                        + "   blockHash       : " + tx.blockHash + "\n"
                                        + "   blockNumber     : " + tx.blockNumber + "\n"
                                        + "   transactionIndex: " + tx.transactionIndex + "\n"
                                        + "   from            : " + tx.from + "\n" 
                                        + "   to              : " + tx.to + "\n"
                                        + "   value           : " + tx.value.c[0] + "\n"
                                        + "   gasPrice        : " + tx.gasPrice + "\n"
                                        + "   gas             : " + tx.gas + "\n"
                                        + "   timestamp       : " + timestamp + "\n");
                              
                              web3.eth.getTransactionReceipt(tx.hash, function(error, result) {
                                  if (error) { console.log(error); }
                                  console.log("Tx Receipt:", result);
                              });
    
                              let rowHTML = "<tr>";
                              rowHTML += "<td title=\"" + tx.hash + "\">" + tx.hash + "</td>";
                              rowHTML += "<td title=\"Transfer\">Transfer</td>";
                              rowHTML += "<td title=\"" + timestamp + "\">" + timestamp + "</td>";
                              rowHTML += "<td title=\"" + tx.from + "\">" + tx.from + "</td>";
                              rowHTML += "<td title=\"" + tx.to + "\">" + tx.to + "</td>";
                              rowHTML += "<td title=\"" + tx.value + "\">" + tx.value + "</td>";
                              rowHTML += "</tr>";
                    
                              $(rowHTML).prependTo('table tbody');
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
          // 'result' is an object with the following values:
          //    -result.tx      => transaction hash, string
          //    -result.receipt => Tx receipt object, which includes gas used
          //    -result.logs    => array of decoded events triggered by the Tx
          let txHash = result.tx;
          let options = {timeZone: 'UTC', hour: 'numeric', minute: 'numeric', second: 'numeric'};
          let txDateTime = new Date().toLocaleDateString("en-GB", options);
          let txEvent = result.logs[0].event;
          let txFrom = result.logs[0].args.from;
          let txTo = result.logs[0].args.to;
          let txValue = result.logs[0].args.value.c[0];
          //let txGasUsed = result.receipt.gasUsed;
          //let txStatus = result.receipt.status;       //'0x1' -> success, '0x0 -> failure' 

          console.log(result);

          //Construct a table row, fill it with tx details & attach it to the table
          let rowHTML = "<tr>";
              rowHTML += "<td title=\"" + txHash + "\">" + txHash + "</td>";
              rowHTML += "<td title=\"" + txEvent + "\">" + txEvent + "</td>";
              rowHTML += "<td title=\"" + txDateTime + "\">" + txDateTime + "</td>";
              rowHTML += "<td title=\"" + txFrom + "\">" + txFrom + "</td>";
              rowHTML += "<td title=\"" + txTo + "\">" + txTo + "</td>";
              rowHTML += "<td title=\"" + txValue + "\">" + txValue + "</td>";
              rowHTML += "</tr>";

          $(rowHTML).prependTo('table tbody');

          alert('Transferred ' + amount + ' token(s) successfully!');
          App.resetInputField();
          return App.getBalance();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },


  resetInputField: function() {
    $('#AvsTransferAddress').val('');
    $('#AvsTransferAmount').val('');
    $('#AvsBurnAmount').val('');
  }

};


$(function() {
  $(window).load(function() {
    App.init();
  });
});