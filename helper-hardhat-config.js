const { ethers } = require("hardhat")

const networkConfig = {
    31337: {
        name: "localhost",
    },
    5: {
        name: "goerli",
    },
    11155111: {
        name: "sepolia",
    },
}

const developmentChains = ["hardhat", "localhost"]

const pairs = {}

module.exports = {
    networkConfig,
    developmentChains,
    pairs,
}
