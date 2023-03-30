//SAMPLE DEPLOY

const { network } = require("hardhat")
const { developmentChains, networkConfig, pairs } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (chainId == 31337) {
        log("Local network detected! Deploying WBTC contract...")

        let args = [deployer, (BigInt(3) * BigInt(10 ** 17)).toString()]
        const wbtc = await deploy("ERC20", {
            from: deployer,
            args: args,
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        pairs["WBTC"] = wbtc
    }
    log("----------------------------------------------")
}
module.exports.tags = ["all", "wbtc", "local"]
