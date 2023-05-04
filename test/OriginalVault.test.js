const { expect, assert } = require("chai");
const { pairs } = require("../helper-hardhat-config");
const { ethers, getNamedAccounts } = require("hardhat");
describe("Original Vault Test", function () {
  let vault, owner, accounts, player1, player2, player1ConnectedEthcContract;
  let tx, receipt, response;
  let deployer;
  before(async function () {
    deployer = (await getNamedAccounts()).deployer;
    console.log("deployer", deployer);
    or = await ethers.getContract("Oracle", deployer);
    console.log("or", or.address);
  });
  it("just for testing before", async () => {
    console.log("yoo");
  });

  // check Balanced takes a asset address and check-how much of value it will hold in the vault. if the value is higher than 5 %, it reverts the whole process of transfer or swap.

  it("addLiquidity twice and withdrawing again. ", async () => {
    //VAULT is ERC1155.
    const USDPRICE = BigInt(10 ** 18) * BigInt(1);
    //shows the bank had 0 balance at start.
    await expect(
      await (await vault.balanceOf(owner.address, 0)).toString()
    ).to.equal("0");
    const [usdBalance0, delta1] = await vault.getUSDBalanceAndDelta();
    assert.equal(usdBalance0.toString(), 0);

    tx = await pairs["USDC"].approve(vault.address, USDPRICE);
    await tx.wait(1);
    tx = await vault.addLiquidity(USDPRICE, pairs.USDC.address);
    await tx.wait(1);
    await expect(
      await (await vault.balanceOf(owner.address, 0)).toString()
    ).to.equal(USDPRICE.toString());

    //
    /*adding second liquidity from different account. */
    let ETHPrice = BigInt(2) * BigInt(10 ** 17);
    tx = await pairs.WETH.approve(vault.address, ETHPrice);
    await tx.wait(1);
    //2. addLiquidity
    const addLiquidityResponse = await vault.addLiquidity(
      ETHPrice,
      pairs.WETH.address
    );
    await addLiquidityResponse.wait(1);

    //check the balance of the deployer before and afer liqudiity.

    tx = await vault.withdrawLiquidity(
      BigInt(10 ** 14) * BigInt(1),
      pairs.USDC.address
    );
    await tx.wait(1);
  });

  it("swap test", async () => {
    //lets approve first.
    let PRICE = BigInt(1) * BigInt(10 ** 12);
    //
    const approveResponse = await pairs.WBTC.approve(
      vault.address,
      ethers.constants.MaxUint256
    );
    await approveResponse.wait(1);
    const response = await vault.swap(
      pairs.WBTC.address,
      pairs.USDC.address,
      PRICE
    );
  });

  it("pairs logic. !!", async () => {
    console.log("pairs-wbtc:", pairs.WBTC.address);
    //balance check garam na ta.
    const usdcBalance = await pairs.USDC.balanceOf(owner.address);
    console.log("usdcBalance", usdcBalance.toString());
    const wethBalance = await pairs.WETH.balanceOf(owner.address);
    console.log("wethBalance", wethBalance.toString());
    const wbtcBalance = await pairs.WBTC.balanceOf(owner.address);
    console.log("wbtcBalance", wbtcBalance.toString());

    assert(usdcBalance > BigInt(10 ** 16));
  });
  it("getUsdLogic", async () => {
    let price = 1000;
    console.log(
      "wbtcResponse",
      await vault.getUSDValue(pairs.WBTC.address, price)
    );
    console.log(
      "wethResponse",
      await vault.getUSDValue(pairs.WETH.address, price)
    );
    console.log(
      "usdResponse",
      await vault.getUSDValue(pairs.USDC.address, price)
    );
  });
  it("oracle bata price nai line", async () => {
    //
    await console.log("wbtcPrice", await or.getPrice(pairs.WBTC.address));
    await console.log("wethPrice", await or.getPrice(pairs.WETH.address));
    await console.log("usdcPrice", await or.getPrice(pairs.USDC.address));
  });
});
