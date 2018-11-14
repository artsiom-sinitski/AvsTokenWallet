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

    it("Testing basic wallet functionality", async() => {
        let instance = await AvsToken.deployed();
        let account = AvsToken.class_defaults.from; //'0x3a1d2e87865938c0EB6CAC4a07203A96810bb78d';
        let toAddress = '0xDbBA21055f74F7Be31d5a32d7acED73062071a32';

        let varResult = await instance.balanceOf(account);
        assert.equal(varResult.valueOf(), 10000);

        await instance.burn(99);
        varResult = await instance.balanceOf(account);
        assert.equal(varResult.valueOf(), 9901);

        await instance.transfer(toAddress, 1);
        varResult = await instance.balanceOf(account);
        assert.equal(varResult.valueOf(), 9900);
    });
})

