//SAMPLE DEPLOY

const { network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
  pairs,
} = require("../helper-hardhat-config");
const { parseUnits } = require("ethers/lib/utils");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  if (chainId == 31337) {
    log(
      "You are deploying to a local network, you'll need a local network running to interact"
    );
    log(
      "Please run `yarn hardhat console --network localhost` to interact with the deployed smart contracts!"
    );
    log("----------------------------------------------------------");
    log("Local network detected! Deploying USDC contract...");

    let args = [deployer, (BigInt(200000) * BigInt(10 ** 18)).toString()];
    const usdc = await deploy("ERC20", {
      from: deployer,
      args: args,
      log: true,
      waitConfirmations: network.config.blockConfirmations || 1,
    });

    pairs["USDC"] = await ethers.getContractAt("ERC20", usdc.address);
  }

  log("----------------------------------------------");
};
module.exports.tags = ["all", "usdc", "local"];
