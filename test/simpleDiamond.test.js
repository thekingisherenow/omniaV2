const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets,
} = require("../scripts/libraries/diamond.js");

const { getGenericVaultParams } = require("../scripts/daniel-deploy.js");
const { deployDiamond } = require("../scripts/deploy.js");
const { pairs } = require("../helper-hardhat-config.js");
const { assert } = require("chai");
const { ethers, getNamedAccounts } = require("hardhat");

describe("Simple VaultDiamond Tests.", async function () {
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

  before(async function () {
    console.log("yo");
    await deployments.fixture(["local"]);

    console.log("The pairs addresses are: " + (await pairs.WBTC.address));
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

    //deploy VaultManager. args- oracle-vault-admin
    const VaultManager = await ethers.getContractFactory("VaultManager");
    vm = await VaultManager.deploy(diamondAddress, or.address, deployer);
    await vm.deployed();
    console.log("Vault Manager Contract Deployed at " + vm.address);

    //deploy GMX contract
    const GMX = await ethers.getContractFactory("GMX");
    gmx = await GMX.deploy(or.address);
    await gmx.deployed();
    console.log("GMX Contract Deployed at " + gmx.address);
  });

  it("should have three facets -- call to facetAddresses function", async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }

    assert.equal(addresses.length, 3);
  });

  it("facets should have the right function selectors -- call to facetFunctionSelectors function", async () => {
    let selectors = getSelectors(diamondCutFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0]);
    assert.sameMembers(result, selectors);
    selectors = getSelectors(diamondLoupeFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
    assert.sameMembers(result, selectors);
    selectors = getSelectors(ownershipFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
    assert.sameMembers(result, selectors);
  });
  it("should add Loan Facet", async () => {
    const LoanFacet = await ethers.getContractFactory("LoanFacet");
    const loanFacet = await LoanFacet.deploy();
    await loanFacet.deployed();
    addresses.push(loanFacet.address);
    const selectors = getSelectors(loanFacet);
    tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: loanFacet.address,
          action: FacetCutAction.Add,
          functionSelectors: selectors,
        },
      ],
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 800000 }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`VaultDiamond upgrade failed: ${tx.hash}`);
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(loanFacet.address);
    console.log("result: ", result);
    assert.sameMembers(result, selectors);
  });

  it("should add Swap Facet", async () => {
    const SwapFacet = await ethers.getContractFactory("SwapFacet");
    const swapFacet = await SwapFacet.deploy();
    await swapFacet.deployed();
    addresses.push(swapFacet.address);
    const selectors = getSelectors(swapFacet);
    tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: swapFacet.address,
          action: FacetCutAction.Add,
          functionSelectors: selectors,
        },
      ],
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 800000 }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`VaultDiamond upgrade failed: ${tx.hash}`);
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(swapFacet.address);
    console.log("result: ", result);
    assert.sameMembers(result, selectors);
  });

  it("minting and checking balance in both facet is same.", async () => {
    const loanFacet = await ethers.getContractAt("LoanFacet", diamondAddress);
    const swapFacet = await ethers.getContractAt("SwapFacet", diamondAddress);
    response = await loanFacet.getMyBalance();
    // asset that the balance before minting is 0.
    assert.equal(response.toString(), 0);
    response = await swapFacet.mintSwap("100");
    console.log("Minting 100 in swapFacet");
    await response.wait(1);
    // lets mint in roughfacet2
    response = await loanFacet.mint("500");
    console.log("Minting 500 in loanFacet");
    await response.wait(1);
    //mint garisake pachi ko value
    response = await loanFacet.getMyBalance();
    console.log("mint garisake pachiko balance", await response.toString());
    assert.equal(response.toString(), "600");
    //assert that the total balance is 600.
    response = await swapFacet.getMyBalanceSwap();
    assert.equal(response.toString(), "600");
  });
  it("lets check if the value of _nextId has been changed to 1 or not.", async () => {
    const loanFacet = await ethers.getContractAt("LoanFacet", diamondAddress);
    response = await loanFacet.getNextId();
    console.log("NextId :", response.toString());
    assert.equal(response.toString(), "1");
  });
});
