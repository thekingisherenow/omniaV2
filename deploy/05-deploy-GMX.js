const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const oracle = await deployments.get("Oracle")
    log("Oracle address passed in constructor:", oracle.address)
    let args = [oracle.address]
    const gmx = await deploy("GMX", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("----------------------------------------------")
}

module.exports.tags = ["all", "gmx"]

module.exports.dependencies = ["oracle"]
