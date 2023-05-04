// const { network } = require("hardhat")
// const { developmentChains, networkConfig } = require("../helper-hardhat-config")
// const { verify } = require("../utils/verify")

// module.exports = async ({ getNamedAccounts, deployments }) => {
//     const { deploy, log } = deployments
//     const { deployer } = await getNamedAccounts()
//     const vault = await deployments.get("Vault")
//     console.log("Vault address taken:", vault.address)
//     const oracle = await deployments.get("Oracle")
//     console.log("Oracle address taken:", oracle.address)

//     let args = [vault.address, oracle.address, deployer]

//     const vaultManager = await deploy("VaultManager", {
//         from: deployer,
//         args: args,
//         log: true,
//         waitConfirmations: network.config.blockConfirmations || 1,
//     })
//     log("----------------------------------------------")
// }
// module.exports.tags = ["all", "vaultManager"]

// module.exports.dependencies = ["oracle", "vault"]
