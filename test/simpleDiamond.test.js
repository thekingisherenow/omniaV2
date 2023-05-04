const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets,
} = require("../scripts/libraries/diamond.js");

const { getGenericVaultParams } = require("../scripts/getVaultParams.js");
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
  let loanFacet, swapFacet;

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
    // i have removed the supportsInterface function from the cut because ERC1155 facets
    //have similar function.
    selectors = getSelectors(diamondLoupeFacet).remove([
      "supportsInterface(bytes4)",
    ]);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
    assert.sameMembers(result, selectors);
    selectors = getSelectors(ownershipFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
    assert.sameMembers(result, selectors);
  });
  it("should add Loan Facet", async () => {
    const LoanFacet = await ethers.getContractFactory("LoanFacet");
    loanFacet = await LoanFacet.deploy();
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
    swapFacet = await SwapFacet.deploy();
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
  // Both ERC1155Facet and DiamondLoupe had supportsInterface(bytes4) function..
  //and i removed the supportInterface from diamondLoupe facet--- temporarily
  //to avoid the function selector clash..
  it("should add ERC1155 facet", async () => {
    const ERC1155Facet = await ethers.getContractFactory("ERC1155Facet");
    const erc1155Facet = await ERC1155Facet.deploy();
    await erc1155Facet.deployed();
    addresses.push(erc1155Facet.address);
    console.log("erc1155Facet", erc1155Facet);
    //
    const erc1155Selectors = getSelectors(erc1155Facet);

    console.log("erc1155Selectors", erc1155Selectors);

    tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: erc1155Facet.address,
          action: FacetCutAction.Add,
          functionSelectors: erc1155Selectors,
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
    result = await diamondLoupeFacet.facetFunctionSelectors(
      erc1155Facet.address
    );
    assert.sameMembers(result, erc1155Selectors);
  });
});
