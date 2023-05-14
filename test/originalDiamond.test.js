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

describe("Original Diamond Tests", async function () {
  let diamondAddress;
  let diamondCutFacet;
  let diamondLoupeFacet;
  let diamondInit, diamondInitAddress;
  let ownershipFacet;
  let tx;
  let receipt;
  let result;
  let deployer;
  let player;
  const addresses = [];
  let or, vm, gmx;
  let loanFacet, swapFacet;

  before(async function () {
    console.log("yo");
    const accounts = await ethers.getSigners();
    player = accounts[1];
    // console.log("player", player);
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

  //=> test starts from her
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

  it("initializeClone shouldn't run in the original contract.", async () => {
    const vault = await ethers.getContractAt("VaultDiamond", diamondAddress);
    // console.log("vault", vault);
    //need to send facets along.
    console.log("loanFacet", loanFacet.address);
    console.log("swapfacet", swapFacet.address);
    console.log("diamondInit", diamondInitAddress);
    // response = await
    await expect(
      vault.initializeClone(
        [loanFacet.address, swapFacet.address],
        diamondInitAddress
      )
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });
});
