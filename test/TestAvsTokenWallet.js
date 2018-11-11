const AvsToken = artifacts.require("AvsToken.sol");

contract('AvsToken', async (accounts) => {

    it("Checking initial contract state", async () => {
        let instance = await AvsToken.deployed();

        let varTest = await instance.totalSupply.call();
        assert.equal(varTest.valueOf(), 10000);

        varTest = await instance.getName.call();
        assert.equal(varTest.valueOf(), "AvsToken");

        varTest = await instance.getSymbol.call();
        assert.equal(varTest.valueOf(), "AvS");

        varTest = await instance.getDecimals.call();
        assert.equal(varTest.valueOf(), 2);
    });

    it("Checking contract getters & setters", async () => {
        let instance = await AvsToken.deployed();

        let varRes = await instance.setDecimals(32);
        let varTest = await instance.getDecimals.call();
        assert.equal(varTest.valueOf(), 32);

        await instance.setDecimals(33);
        varTest = await instance.getDecimals.call();
        assert.equal(varTest.valueOf(), 32);

        await instance.setDecimals(-1);
        varTest = await instance.getDecimals.call();
        assert.equal(varTest.valueOf(), 32);

        await instance.setDecimals(0);
        varTest = await instance.getDecimals.call();
        assert.equal(varTest.valueOf(), 0);

        await instance.setDecimals(16);
        varTest = await instance.getDecimals.call();
        assert.equal(varTest.valueOf(), 16);
    });
})

