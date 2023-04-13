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

describe("diamond", async function () {
    let diamondAddress
    let diamondCutFacet
    let diamondLoupeFacet
    let ownershipFacet
    let tx
    let receipt
    let result
    let deployer
    const addresses = []

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
    })
    it("checking..", async () => {
        console.log("hii")
    })

    it("should have three facets -- call to facetAddresses function", async () => {
        for (const address of await diamondLoupeFacet.facetAddresses()) {
            addresses.push(address)
        }

        assert.equal(addresses.length, 3)
    })

    it("facets should have the right function selectors -- call to facetFunctionSelectors function", async () => {
        let selectors = getSelectors(diamondCutFacet)
        result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0])
        assert.sameMembers(result, selectors)
        selectors = getSelectors(diamondLoupeFacet)
        result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1])
        assert.sameMembers(result, selectors)
        selectors = getSelectors(ownershipFacet)
        result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2])
        assert.sameMembers(result, selectors)
    })
    it("should add Loan Facet", async () => {
        const LoanFacet = await ethers.getContractFactory("LoanFacet")
        const loanFacet = await LoanFacet.deploy()
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
    })

    it("should add Swap Facet", async () => {
        const SwapFacet = await ethers.getContractFactory("SwapFacet")
        const swapFacet = await SwapFacet.deploy()
        await swapFacet.deployed()
        addresses.push(swapFacet.address)
        const selectors = getSelectors(swapFacet)
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
        )
        receipt = await tx.wait()
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${tx.hash}`)
        }
        result = await diamondLoupeFacet.facetFunctionSelectors(swapFacet.address)
        console.log("result: ", result)
        assert.sameMembers(result, selectors)
    })

    it("when one of the facets mints-another facet can read the balance.", async () => {
        const loanFacet = await ethers.getContractAt("LoanFacet", diamondAddress)
        const swapFacet = await ethers.getContractAt("SwapFacet", diamondAddress)
        response = await loanFacet.getMyBalance()
        // await response.wait(1);
        console.log("mint garnu agi ko balance", response)
        //lets mint.
        response = await swapFacet.mintSwap("100")
        await response.wait(1)
        // lets mint in roughfacet2
        response = await loanFacet.mint("500")
        await response.wait(1)
        // lets mint in roughfacet2
        //mint garisake pachi ko value
        response = await loanFacet.getMyBalance()
        console.log("mint garisake pachiko balance", await response.toString())
        // mint garisake pachiko valuee.tara facet2 bata
        response = await swapFacet.getMyBalanceSwap()
        console.log("mint garisake pachiko balance", await response.toString())
    })
    it("lets check if the value of _nextId has been changed to 1 or not.", async () => {
        const loanFacet = await ethers.getContractAt("LoanFacet", diamondAddress)
        response = await loanFacet.getNextId()
        assert.equal(response.toString(), "1")
    })
    it("getUSDValue works", async () => {
        const loanFacet = await ethers.getContractAt("LoanFacet", diamondAddress)
        //only deploy 1,2,3

        // daniel ko tarika le deploy garne:

        //deploy Vault..
        //------------------------------
        //diamond is the VAULT..

        //deploy oracle

        const Oracle = await ethers.getContractFactory("Oracle")
        or = await Oracle.deploy(deployer)
        await or.deployed()
        console.log("Oracle Contract Deployed at " + or.address)

        //deploy VaultManager. args- oracle-vault-admin
        const VaultManager = await ethers.getContractFactory("VaultManager")
        let vm = await VaultManager.deploy(diamondAddress, or.address, deployer)
        await vm.deployed()
        console.log("Vault Manager Contract Deployed at " + vm.address)

        //deploy GMX contract
        const GMX = await ethers.getContractFactory("GMX")
        gmx = await GMX.deploy(or.address)
        await gmx.deployed()
        console.log("GMX Contract Deployed at " + gmx.address)

        //pairs can be the cause of the error

        // args- VAULTDETAILS,Whitelisted assets
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
        console.log("initiateSelectorAddress", initiateSelectorAddress)
        // console.log("yo", initiateSelectorAddress)
        //LOAN FACET KO ADDRESS NI PATHAUNA LAKO CHAM.. DIAMONDlOUPE CHAIYO..
        const loanFacetAddress = await diamondLoupeFacet.facetAddress(initiateSelectorAddress)
        console.log("loanfacetAddress", loanFacetAddress)
        //     await diamondLoupeFacet.facetAddress(/*selector ko address chaiyo.*/)

        response = await vm.createVault(
            _VAULT_DETAILS,
            _WHITELISTED_ASSETS,
            _WHITELISTED_DETAILS,
            diamondAddress,
            loanFacetAddress
        )
        receipt = await response.wait(1)
        //listen for the event
        const value = receipt.events[0].args
        console.log("value: " + value)
        console.log("Vault created")

        // // get the pairs.
        // console.log("The pairs :", pairs.USDC.address)

        // response = await loanFacet.getUSDValue(pairs.USDC.address, "200")
        // console.log(response)
        // console.log("response: " + response.toString())
    })
})
