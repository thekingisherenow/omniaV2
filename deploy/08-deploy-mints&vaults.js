// const { developmentChains, networkConfig, pairs } = require("../helper-hardhat-config")

// module.exports = async ({ getNamedAccounts, deployments }) => {
//     const { deployIfDifferent, log } = deployments
//     const namedAccounts = await getNamedAccounts()
//     const { deployer } = namedAccounts
//     const chainId = network.config.chainId

//     if (chainId == 31337) {
//         log("Minting tokens for Test purposes!!")
//         const usdcContract = await ethers.getContractAt("ERC20", pairs.USDC.address, deployer)
//         await usdcContract.mint(deployer).then((tx) => tx.wait())
//         const wethContract = await ethers.getContractAt("ERC20", pairs.WETH.address, deployer)
//         await wethContract.mint(deployer).then((tx) => tx.wait())
//         const wbtcContract = await ethers.getContractAt("ERC20", pairs.WBTC.address, deployer)
//         await wbtcContract.mint(deployer).then((tx) => tx.wait())
//         log(`Succesfully minted ${(await usdcContract.balanceOf(deployer)).toString()}  USDC`)
//         log(`Succesfully minted ${(await wethContract.balanceOf(deployer)).toString()} WETH`)
//         log(`Succesfully minted ${(await wbtcContract.balanceOf(deployer)).toString()} WBTC`)

//         //Updating the oracle part.
//         const orDeployData = await deployments.get("Oracle")
//         const or = await ethers.getContractAt("Oracle", orDeployData.address, deployer)

//         await or.updatePrices([pairs["WBTC"].address], [BigInt(24000) * BigInt(10 ** 18)])
//         await or.updatePrices([pairs["WETH"].address], [BigInt(1600) * BigInt(10 ** 18)])
//         await or.updatePrices([pairs["USDC"].address], [BigInt(10 ** 18)])
//         log("Oracle prices successfully updated !")
//     }

//     //VAULT PART

//     let [_VAULT_DETAILS, _WHITELISTED_ASSETS, _WHITELISTED_DETAILS] = getGenericVaultParams(pairs)
//     //need to get gmx and vault contract address.
//     const gmx = await deployments.get("GMX")
//     const vb = await deployments.get("Vault")
//     const vmDeployData = await deployments.get("VaultManager")
//     const vm = await ethers.getContractAt("VaultManager", vmDeployData.address, deployer)
//     _VAULT_DETAILS["GMX_CONTRACT"] = gmx.address
//     await vm.createVault(_VAULT_DETAILS, _WHITELISTED_ASSETS, _WHITELISTED_DETAILS, vb.address)

//     log("Vault created")
//     await log("Vault Address:", await vm.getVaults())
// }

// function getGenericVaultParams(pairs) {
//     let whitelisted = []
//     let addys = []

//     for (const [key, value] of Object.entries(pairs)) {
//         let params = {}
//         params["collection"] = value.address

//         //everything is *100
//         if (key == "WETH") {
//             params["MAX_LTV"] = 80
//             params["MAX_DURATION"] = 6000
//             params["MAX_APR"] = 2000
//             params["MIN_APR"] = 500
//             params["slope"] = 10 * 100
//             params["intercept"] = 400
//             params["MAX_EXPOSURE"] = 5
//             params["HEDGE_AT"] = 2
//             params["MAX_DELTA_DIVERGENCE"] = 1
//             params["HEDGE_PERCENTAGE"] = 100
//         } else if (key == "WBTC") {
//             params["MAX_LTV"] = 90
//             params["MAX_DURATION"] = 9000
//             params["MAX_APR"] = 1000
//             params["MIN_APR"] = 500
//             params["slope"] = 10 * 100
//             params["intercept"] = 400
//             params["MAX_EXPOSURE"] = 5
//             params["HEDGE_AT"] = 2
//             params["MAX_DELTA_DIVERGENCE"] = 1
//             params["HEDGE_PERCENTAGE"] = 100
//         } else if (key == "USDC") {
//             params["MAX_LTV"] = 100
//             params["MAX_DURATION"] = 18000
//             params["MAX_APR"] = 500
//             params["MIN_APR"] = 500
//             params["slope"] = 10 * 100
//             params["intercept"] = 400
//             params["MAX_EXPOSURE"] = 100
//             params["HEDGE_AT"] = 500 //ie never hedge
//             params["MAX_DELTA_DIVERGENCE"] = 2
//             params["HEDGE_PERCENTAGE"] = 0
//         }

//         params["COLLATERAL_SIZE"] = 0

//         whitelisted.push(params)

//         addys.push(value.address)
//     }

//     return [
//         {
//             VAULT_NAME: "Omnia Vault",
//             VAULT_DESCRIPTION: "The Default Vault Provides balance Loans",
//             ORACLE_CONTRACT: "0x0000000000000000000000000000000000000000",
//             MAX_LEVERAGE: 500,
//         },
//         addys,
//         whitelisted,
//     ]
// }

// module.exports.tags = ["mint", "all"]
// module.exports.dependencies = ["usdc", "weth", "wbtc", "gmx", "vault", "oracle", "vaultManager"]
