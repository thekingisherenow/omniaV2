const {
    getSelectors,
    FacetCutAction,
    removeSelectors,
    findAddressPositionInFacets,
} = require("../scripts/libraries/diamond.js")

const { getGenericVaultParams } = require("../scripts/daniel-deploy.js")
const { deployDiamond } = require("../scripts/deploy.js")
const { pairs } = require("../helper-hardhat-config.js")
const { assert } = require("chai")
const { ethers, getNamedAccounts } = require("hardhat")

describe("Complex Diamond Tests", async function () {
    let diamondAddress
    let diamondCutFacet
    let diamondLoupeFacet
    let ownershipFacet
    let tx
    let receipt
    let result
    let deployer
    const addresses = []
    let or, vm, gmx
    let loanFacet

    before(async function () {
        console.log("yo")
        await deployments.fixture(["local"])

        console.log("The pairs addresses are: " + (await pairs.WBTC.address))
        deployer = await (await getNamedAccounts()).deployer
        console.log("deployer: " + deployer)
        diamondAddress = await deployDiamond()
        diamondCutFacet = await ethers.getContractAt("DiamondCutFacet", diamondAddress)
        diamondLoupeFacet = await ethers.getContractAt("DiamondLoupeFacet", diamondAddress)
        ownershipFacet = await ethers.getContractAt("OwnershipFacet", diamondAddress)
        //deploy oracle
        const Oracle = await ethers.getContractFactory("Oracle")
        or = await Oracle.deploy(deployer)
        await or.deployed()
        console.log("Oracle Contract Deployed at " + or.address)

        //deploy VaultManager. args- oracle-vault-admin
        const VaultManager = await ethers.getContractFactory("VaultManager")
        vm = await VaultManager.deploy(diamondAddress, or.address, deployer)
        await vm.deployed()
        console.log("Vault Manager Contract Deployed at " + vm.address)

        //deploy GMX contract
        const GMX = await ethers.getContractFactory("GMX")
        gmx = await GMX.deploy(or.address)
        await gmx.deployed()
        console.log("GMX Contract Deployed at " + gmx.address)

        const LoanFacet = await ethers.getContractFactory("LoanFacet")
        loanFacet = await LoanFacet.deploy()
        await loanFacet.deployed()
        addresses.push(loanFacet.address)
        const selectors = getSelectors(loanFacet)
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
        )
        receipt = await tx.wait()
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${tx.hash}`)
        }
        result = await diamondLoupeFacet.facetFunctionSelectors(loanFacet.address)
        console.log("result: ", result)
        assert.sameMembers(result, selectors)

        let [_VAULT_DETAILS, _WHITELISTED_ASSETS, _WHITELISTED_DETAILS] =
            getGenericVaultParams(pairs)
        _VAULT_DETAILS["GMX_CONTRACT"] = gmx.address

        //run VaultManager.createVault --
        console.log("Vault details:", _VAULT_DETAILS)
        console.log("WhiteListed assets:", _WHITELISTED_ASSETS)
        console.log("WhiteListed DETAILS:", _WHITELISTED_DETAILS)

        response = await vm.getVaults()
        console.log("response", response)

        const initiateSelectorAddress = loanFacet.interface.getSighash(
            "initialize((string,string,address,address,uint32),address[],(address,uint32,uint32,uint32,uint32,uint32,uint32,uint32,uint32,uint32,uint32,uint256)[])"
        )
        const loanFacetAddress = await diamondLoupeFacet.facetAddress(initiateSelectorAddress)
        console.log("loanfacetAddress", loanFacetAddress)

        const cutSelector = await diamondCutFacet.interface.getSighash("diamondCut")

        const diamondCutFacetAddress = await diamondLoupeFacet.facetAddress(cutSelector)
        console.log("diamondCutFacetAddress", diamondCutFacetAddress)
        const createVaultResponse = await vm.createVault(
            _VAULT_DETAILS,
            _WHITELISTED_ASSETS,
            _WHITELISTED_DETAILS,
            diamondAddress,
            [loanFacetAddress, diamondCutFacetAddress]
        )
        receipt = await createVaultResponse.wait(1)
        console.log("Vault created")

        //update the oracle prices..
        // -> yaha modifications ko abasyak cha hai..
        if (Object.keys(pairs).length !== 0) {
            await or.updatePrices([pairs["WBTC"].address], [BigInt(24000) * BigInt(10 ** 18)])
            await or.updatePrices([pairs["WETH"].address], [BigInt(1600) * BigInt(10 ** 18)])
            await or.updatePrices([pairs["USDC"].address], [BigInt(10 ** 18)])
        }

        const clonedVaultArray = await vm.getVaults()
        const clonedVault = clonedVaultArray[0]
        loanFacetCloned = loanFacet.attach(clonedVault)
    })

    it("getUSDValue works", async () => {
        // console.log("loan Facet", loanFacet)
        //check the nextId
        response = await loanFacetCloned.getNextId()
        console.log("clonedVault ko nextID", response.toString())
        //mint by single VAULT.
        response = await loanFacetCloned.mint("500")
        console.log("minting 500")
        receipt = response.wait(1)
        response = await loanFacetCloned.getMyBalance()
        console.log("clonedVault ko balance", response.toString())
        //check balance of single VAULT.
        response = await loanFacetCloned.getUSDValue(pairs.WETH.address, "1000")
        console.log("USDVALUE", response.toString())
    })
    //NEED TO ADD- SWAP FACET TO THE NEW VAULT
})