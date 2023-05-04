//SAMPLE DEPLOY

const { network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
  pairs,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId == 31337) {
    log("Local network detected! Deploying WETH contract...");

    let args = [deployer, (BigInt(1) * BigInt(10 ** 18)).toString()];
    const weth = await deploy("ERC20", {
      from: deployer,
      args: args,
      log: true,
      waitConfirmations: network.config.blockConfirmations || 1,
    });
    pairs["WETH"] = await ethers.getContractAt("ERC20", weth.address);
  }
  log("----------------------------------------------");
};
module.exports.tags = ["all", "weth", "local"];
