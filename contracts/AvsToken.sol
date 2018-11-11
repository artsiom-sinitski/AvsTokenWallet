pragma solidity ^0.4.22;

import "./StandardToken.sol";
import "./StandardBurnableToken.sol";

contract AvsToken is StandardToken, StandardBurnableToken {
  address private owner;
  string private name = "AvsToken";
  string private symbol = "AvS";
  uint8 private decimals = 2;
  uint256 private INITIAL_SUPPLY = 10000;

  modifier onlyByOwner() {
    require(msg.sender == owner);
    _;
  }

  constructor() public {
    owner = msg.sender;
	  totalSupply_ = INITIAL_SUPPLY;
	  balances[msg.sender] = INITIAL_SUPPLY;
  }

  function getName() public view returns (string) {
       return name;
  }

  function getSymbol() public view returns (string) {
        return symbol; 
  }

  function getDecimals() public view returns(uint8) {
        return decimals;
  }

  function setDecimals(uint8 precision) public onlyByOwner returns (uint8, bool) {
        uint8 max = 32; // 2 ** 5

        if (precision > max || precision < 0) return (precision, false);

        decimals = precision;
        return (precision, true);
  }
}
