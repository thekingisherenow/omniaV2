// const { network } = require("hardhat")
// const { developmentChains, networkConfig } = require("../helper-hardhat-config")
// const { verify } = require("../utils/verify")

// module.exports = async ({ getNamedAccounts, deployments }) => {
//     const { diamond, log } = deployments
//     const { deployer, diamondAdmin } = await getNamedAccounts()
//     args = []
//     const vault = await diamond.deploy("VaultDiamond", {
//         from: deployer,
//         owner: diamondAdmin,
//         facets: ["ERC1155Facet", "LoanFacet", "SwapFacet"],
//         waitConfirmations: network.config.blockConfirmations || 1,
//     })
//     log("----------------------------------------------")
// }
// module.exports.tags = ["all", "vault"]
