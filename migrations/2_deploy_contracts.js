var AvsToken = artifacts.require("AvsToken");

module.exports = function(deployer) {
  deployer.deploy(AvsToken);
};