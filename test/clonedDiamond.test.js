const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets,
} = require("../scripts/libraries/diamond.js");

const { getGenericVaultParams } = require("../scripts/getVaultParams.js");
const { deployDiamond } = require("../scripts/deploy.js");
const { pairs } = require("../helper-hardhat-config.js");
const { assert, expect } = require("chai");
const { ethers, getNamedAccounts } = require("hardhat");

describe("Cloned Diamond Tests", async function () {
  let diamondAddress;
  let diamondCutFacet;
  let diamondLoupeFacet;
  let diamondInit, diamondInitAddress;
  let ownershipFacet;
  let tx;
  let receipt;
  let result;
  let deployer;
  const addresses = [];
  let or, vm, gmx;
  let swapFacet, er1155Facet, loanFacet;
  let vaultAddress; //address of the initialzied Vault.
  before(async function () {
    await deployments.fixture(["local"]);

    deployer = await (await getNamedAccounts()).deployer;
    console.log("deployer: " + deployer);
    [diamondAddress, diamondInitAddress] = await deployDiamond();
    //
    console.log("diamondAddress: " + diamondAddress);
    console.log("diamondInitAddress: " + diamondInitAddress);
    diamondCutFacet = await ethers.getContractAt(
      "DiamondCutFacet",
      diamondAddress
    );
    diamondLoupeFacet = await ethers.getContractAt(
      "DiamondLoupeFacet",
      diamondAddress
    );
    ownershipFacet = await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    );
    //deploy oracle
    const Oracle = await ethers.getContractFactory("Oracle");
    or = await Oracle.deploy(deployer);
    await or.deployed();
    console.log("Oracle Contract Deployed at " + or.address);

    //deploy VaultManager. args- oracle-loanFacet-admin
    const VaultManager = await ethers.getContractFactory("VaultManager");
    vm = await VaultManager.deploy(diamondAddress, or.address, deployer);
    await vm.deployed();
    console.log("Vault Manager Contract Deployed at " + vm.address);

    //deploy GMX contract
    const GMX = await ethers.getContractFactory("GMX");
    gmx = await GMX.deploy(or.address);
    await gmx.deployed();
    console.log("GMX Contract Deployed at " + gmx.address);

    //deploy loanFacet
    const LoanFacet = await ethers.getContractFactory("LoanFacet");
    loanFacet = await LoanFacet.deploy();
    await loanFacet.deployed();
    addresses.push(loanFacet.address);
    const loanSelectors = getSelectors(loanFacet);
    //deploy swap facet
    const SwapFacet = await ethers.getContractFactory("SwapFacet");
    swapFacet = await SwapFacet.deploy();
    await swapFacet.deployed();
    addresses.push(swapFacet.address);
    const swapSelectors = getSelectors(swapFacet);
    //deploy ERC1155Facet
    const ERC1155Facet = await ethers.getContractFactory("ERC1155Facet");
    erc1155Facet = await ERC1155Facet.deploy();
    await erc1155Facet.deployed();
    addresses.push(erc1155Facet.address);
    const erc1155Selectors = getSelectors(erc1155Facet);
    console.log("loanfacet,swapFacet,erc1155Facet deployed.");
    tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: loanFacet.address,
          action: FacetCutAction.Add,
          functionSelectors: loanSelectors,
        },
        {
          facetAddress: swapFacet.address,
          action: FacetCutAction.Add,
          functionSelectors: swapSelectors,
        },
        {
          facetAddress: erc1155Facet.address,
          action: FacetCutAction.Add,
          functionSelectors: erc1155Selectors,
        },
      ],
      ethers.constants.AddressZero,
      "0x"
      // { gasLimit: 1000000 }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`VaultDiamond upgrade failed: ${tx.hash}`);
    }
    // testing if all the loan Functions work properly or not.
    result = await diamondLoupeFacet.facetFunctionSelectors(loanFacet.address);
    console.log("Loan facet selectors ", result);
    assert.sameMembers(result, loanSelectors);
    //testing if all the swap Functions work properly or not.
    result = await diamondLoupeFacet.facetFunctionSelectors(swapFacet.address);
    console.log("swapFacet selectors ", result);
    assert.sameMembers(result, swapSelectors);
    // test if erc1155 facet functions work properly or not
    result = await diamondLoupeFacet.facetFunctionSelectors(
      erc1155Facet.address
    );
    console.log("erc1155 facet selectors: ", result);
    assert.sameMembers(result, erc1155Selectors);
    // get Selectors from diamondLoupe- cut garda kun kun facet jodiyeko cha. bujhne.

    response = await diamondLoupeFacet.facetFunctionSelectors(
      diamondLoupeFacet.address
    );
    console.log("diamondLoupeFacet", response);

    //lets initialize the loanFacet NOW
    let [_VAULT_DETAILS, _WHITELISTED_ASSETS, _WHITELISTED_DETAILS] =
      getGenericVaultParams(pairs);
    _VAULT_DETAILS["GMX_CONTRACT"] = gmx.address;

    //run VaultManager.createVault --
    console.log("Vault details:", _VAULT_DETAILS);
    console.log("WhiteListed assets:", _WHITELISTED_ASSETS);
    console.log("WhiteListed DETAILS:", _WHITELISTED_DETAILS);

    response = await vm.getVaults();
    console.log("vm.getVaults", response);
    //assert that the response should come empty
    assert.isEmpty(response);

    //using diamondLoupeFacet to find  loanFacetAddress
    const hedgePositionsSelector =
      loanFacet.interface.getSighash("hedgePositions()");
    const loanFacetAddress = await diamondLoupeFacet.facetAddress(
      hedgePositionsSelector
    );
    console.log("loanfacetAddress", loanFacetAddress);
    //  using diamondLoupeFacet to find  swapFacetAddress
    const addLiquiditySelector = await swapFacet.interface.getSighash(
      "addLiquidity(uint256,address)"
    );
    console.log("addLiquiditySelector", addLiquiditySelector);
    const swapFacetAddress = await diamondLoupeFacet.facetAddress(
      addLiquiditySelector
    );
    console.log("swapFacetAddress", swapFacetAddress);

    // using diamondLoupeFacet to find diamondCutFacetAddress
    const cutSelector = await diamondCutFacet.interface.getSighash(
      "diamondCut"
    );
    const diamondCutFacetAddress = await diamondLoupeFacet.facetAddress(
      cutSelector
    );
    console.log("diamondCutFacetAddress", diamondCutFacetAddress);

    // using diamondLoupeFacet to find erc1155FacetAddress
    const balanceOfSelector = await erc1155Facet.interface.getSighash(
      "balanceOf(address,uint256)"
    );
    const erc1155FacetAddress = await diamondLoupeFacet.facetAddress(
      balanceOfSelector
    );
    console.log("erc1155FacetAddress", erc1155FacetAddress);

    // using diamondLoupeFacet to find diamondLoupeFacetAddress
    //facetAddress(bytes4)
    const facetAddressSelector = await diamondLoupeFacet.interface.getSighash(
      "facetAddress(bytes4)"
    );
    const diamondLoupeFacetAddress = await diamondLoupeFacet.facetAddress(
      facetAddressSelector
    );
    // using diamondLoupeFacet to find ownershipFacetAddress
    //owner()
    const ownerSelector = await ownershipFacet.interface.getSighash("owner()");
    const ownershipFacetAddress = await diamondLoupeFacet.facetAddress(
      ownerSelector
    );

    //here we CREATE VAULT-where we clone the Vault and initialize it.

    const createVaultResponse = await vm.createVault(
      _VAULT_DETAILS,
      _WHITELISTED_ASSETS,
      _WHITELISTED_DETAILS,
      diamondAddress,
      [
        diamondCutFacetAddress,
        diamondLoupeFacetAddress,
        ownershipFacetAddress,
        loanFacetAddress,
        swapFacetAddress,
        erc1155FacetAddress,
      ],
      diamondInitAddress
    );
    receipt = await createVaultResponse.wait(1);
    console.log("Vault created");

    // -> if local deployment. then only the neccessity to update oracle
    if (Object.keys(pairs).length !== 0) {
      console.log("Minting tokens for Test purposes!!");
      // the token contracts
      await pairs["USDC"].mint(deployer).then((tx) => tx.wait());
      await pairs["WETH"].mint(deployer).then((tx) => tx.wait());
      await pairs["WBTC"].mint(deployer).then((tx) => tx.wait());
      console.log(
        `Succesfully minted ${(
          await pairs["USDC"].balanceOf(deployer)
        ).toString()}  USDC`
      );
      console.log(
        `Succesfully minted ${(
          await pairs["WETH"].balanceOf(deployer)
        ).toString()} WETH`
      );
      console.log(
        `Succesfully minted ${(
          await pairs["WBTC"].balanceOf(deployer)
        ).toString()} WBTC`
      );

      await or.updatePrices(
        [pairs["WBTC"].address],
        [BigInt(24000) * BigInt(10 ** 18)]
      );
      await or.updatePrices(
        [pairs["WETH"].address],
        [BigInt(1600) * BigInt(10 ** 18)]
      );
      await or.updatePrices([pairs["USDC"].address], [BigInt(10 ** 18)]);
    }

    const clonedVaultArray = await vm.getVaults();
    vaultAddress = clonedVaultArray[0];
    console.log("vaultAddress", vaultAddress);

    //Note : The nextID of original vault  is initialized..

    //=> here we attach the facets to the initializedVault.
    loanFacet = loanFacet.attach(vaultAddress);
    swapFacet = swapFacet.attach(vaultAddress);
    er1155Facet = erc1155Facet.attach(vaultAddress);
  });

  //=> test starts from here..
  it("heyy", () => {
    console.log("inside heyyy function");
    console.log("hey");
    console.log("h");
  });

  it("the cloned loanFacet should be initialized.", async () => {
    //check the nextId
    console.log("cloned loanFacet should be initialized.");
    response = await loanFacet.getNextId();
    assert.equal(response.toString(), 1);
    console.log("clonedVault ko nextID", response.toString());
  });

  it("initializeClone should run only once.", async () => {
    const vault = await ethers.getContractAt("VaultDiamond", vaultAddress);
    // console.log("vault", vault);
    //need to send facets along.
    console.log("loanFacet", loanFacet.address);
    console.log("swapfacet", swapFacet.address);
    console.log("diamondInit", diamondInitAddress);
    await expect(
      vault.initializeClone(
        [loanFacet.address, swapFacet.address],
        diamondInitAddress
      )
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("getUSDValue works", async () => {
    //check balance of single VAULT.
    response = await swapFacet.getUSDValue(pairs.WETH.address, "1000");
    console.log("USDVALUE", response.toString());
  });

  it("getUSDBalanceAndDelta works", async () => {
    response = await swapFacet.getUSDBalanceAndDelta();
    console.log("usdbalance and delta", response);
  });

  it("check the balance of owner Complex", async () => {
    expect(BigInt(await pairs["WETH"].balanceOf(deployer)) >= BigInt(10 ** 16))
      .to.be.true;
    expect(BigInt(await pairs["WBTC"].balanceOf(deployer)) >= BigInt(10 ** 16))
      .to.be.true;
    expect(BigInt(await pairs["USDC"].balanceOf(deployer)) >= BigInt(10 ** 16))
      .to.be.true;

    expect(await swapFacet.checkBalanced(pairs["WBTC"].address, 1)).to.be.true;
    expect(await swapFacet.checkBalanced(pairs["WBTC"].address, 1)).to.be.true;
    expect(await swapFacet.checkBalanced(pairs["USDC"].address, 1)).to.be.true;
  });

  it("add and remove liquidity", async () => {
    //
    amt = BigInt(100000) * BigInt(10 ** 18);
    await pairs["USDC"].approve(vaultAddress, ethers.constants.MaxUint256);

    await swapFacet.addLiquidity(amt, pairs["USDC"].address);
    //yaha chaiyeko ho ki..
    expect(BigInt(await er1155Facet.balanceOf(deployer, 0))).to.equal(amt);
    expect(BigInt(await pairs["USDC"].balanceOf(vaultAddress)) >= amt).to.equal(
      true
    );

    let [usd_balance, delta] = await swapFacet.getUSDBalanceAndDelta();
    expect(BigInt(usd_balance) / BigInt(10 ** 18) >= BigInt(1500));
    await swapFacet.withdrawLiquidity(amt, pairs["USDC"].address);

    await swapFacet.addLiquidity(amt, pairs["USDC"].address);

    await pairs["WBTC"].approve(vaultAddress, ethers.constants.MaxUint256);

    console.log(await pairs["WBTC"].balanceOf(deployer));
    await swapFacet.addLiquidity(BigInt(10 ** 15), pairs["WBTC"].address);
  });

  it("Take and Repay Loan", async function () {
    let currDate = Math.floor(new Date().getTime() / 1000);
    console.log("currDate", currDate);
    let repaymentDate = currDate + 30 * 86400;
    console.log("repaymentDate", repaymentDate);

    result = await loanFacet.createLoan(
      pairs["WBTC"].address,
      pairs["USDC"].address,
      BigInt(10 ** 17),
      BigInt(1000) * BigInt(10 ** 17),
      repaymentDate
    );
    receipt = await result.wait(1);
    // this loanId being 2 should be discussed properly with daniel.
    let loanDetails = await loanFacet._loans(2);
    console.log("loanDetails", loanDetails);
    expect(parseInt(loanDetails.repayment / 10 ** 18)).to.equal(104);
    expect(parseInt(loanDetails.principal / 10 ** 18)).to.equal(100);

    await pairs["USDC"].approve(vaultAddress, ethers.constants.MaxUint256);
    await loanFacet.repayLoan(2);
  });

  it("Swap", async function () {
    let signer_wbtc1 = await pairs["WBTC"].balanceOf(deployer);
    let signer_usdc1 = await pairs["USDC"].balanceOf(deployer);

    let vault_wbtc1 = await pairs["WBTC"].balanceOf(vaultAddress);
    let vault_usdc1 = await pairs["USDC"].balanceOf(vaultAddress);

    await swapFacet.swap(
      pairs["WBTC"].address,
      pairs["USDC"].address,
      BigInt(10 ** 14)
    );

    let signer_wbtc2 = await pairs["WBTC"].balanceOf(deployer);
    let signer_usdc2 = await pairs["USDC"].balanceOf(deployer);

    let vault_wbtc2 = await pairs["WBTC"].balanceOf(vaultAddress);
    let vault_usdc2 = await pairs["USDC"].balanceOf(vaultAddress);

    expect(signer_wbtc1 > signer_wbtc2).to.be.true;
    expect(vault_wbtc1 < vault_wbtc2).to.be.true;

    expect(signer_usdc1 < signer_usdc2).to.be.true;
    expect(vault_usdc1 > vault_usdc2).to.be.true;
  });
  it("Delta", async function () {
    let [usd_balance, delta] = await swapFacet.getUSDBalanceAndDelta();
    expect(parseInt(BigInt(delta[0].delta) / BigInt(10 ** 18))).to.equal(
      100004
    );
    expect(parseInt(BigInt(delta[1].delta) / BigInt(10 ** 18))).to.equal(0);
    expect(parseInt(BigInt(delta[2].delta) / BigInt(10 ** 18))).to.equal(26);
  });

  it("Hedging", async function () {
    let currDate = Math.floor(new Date().getTime() / 1000);
    let repaymentDate = currDate + 30 * 86400;

    await loanFacet.createLoan(
      pairs["WBTC"].address,
      pairs["USDC"].address,
      BigInt(10 ** 14),
      BigInt(1000) * BigInt(10 ** 14),
      repaymentDate
    );
    await loanFacet.hedgePositions();
  });
});
