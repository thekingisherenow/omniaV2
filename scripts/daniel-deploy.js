function getGenericVaultParams(pairs) {
    let whitelisted = []
    let addys = []

    for (const [key, value] of Object.entries(pairs)) {
        let params = {}
        params["collection"] = value.address

        //everything is *100
        if (key == "WETH") {
            params["MAX_LTV"] = 80
            params["MAX_DURATION"] = 6000
            params["MAX_APR"] = 2000
            params["MIN_APR"] = 500
            params["slope"] = 10 * 100
            params["intercept"] = 400
            params["MAX_EXPOSURE"] = 5
            params["HEDGE_AT"] = 2
            params["MAX_DELTA_DIVERGENCE"] = 1
            params["HEDGE_PERCENTAGE"] = 100
        } else if (key == "WBTC") {
            params["MAX_LTV"] = 90
            params["MAX_DURATION"] = 9000
            params["MAX_APR"] = 1000
            params["MIN_APR"] = 500
            params["slope"] = 10 * 100
            params["intercept"] = 400
            params["MAX_EXPOSURE"] = 5
            params["HEDGE_AT"] = 2
            params["MAX_DELTA_DIVERGENCE"] = 1
            params["HEDGE_PERCENTAGE"] = 100
        } else if (key == "USDC") {
            params["MAX_LTV"] = 100
            params["MAX_DURATION"] = 18000
            params["MAX_APR"] = 500
            params["MIN_APR"] = 500
            params["slope"] = 10 * 100
            params["intercept"] = 400
            params["MAX_EXPOSURE"] = 100
            params["HEDGE_AT"] = 500 //ie never hedge
            params["MAX_DELTA_DIVERGENCE"] = 2
            params["HEDGE_PERCENTAGE"] = 0
        }

        params["COLLATERAL_SIZE"] = 0

        whitelisted.push(params)

        addys.push(value.address)
    }

    return [
        {
            VAULT_NAME: "Omnia Vault",
            VAULT_DESCRIPTION: "The Default Vault Provides balance Loans",
            ORACLE_CONTRACT: "0x0000000000000000000000000000000000000000",
            MAX_LEVERAGE: 500,
        },
        addys,
        whitelisted,
    ]
}

module.exports = { getGenericVaultParams }
