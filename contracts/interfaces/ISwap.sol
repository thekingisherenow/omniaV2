// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/AppStorage.sol";

interface ISwap {
    function initialize(
        VaultDetails memory _VAULT_DETAILS,
        address[] memory _WHITELISTED_ASSETS,
        Whitelisted[] memory _WHITELISTED_DETAILS
    ) external;

    function checkBalanced(
        address _asset,
        uint256 _amount
    ) external view returns (bool);

    function getUSDBalanceAndDelta()
        external
        view
        returns (uint256, Delta[] memory deltas);

    function getUSDValue(
        address _asset,
        uint256 _amount
    ) external view returns (uint256);

    function addLiquidity(uint256 _amount, address _asset) external;

    function withdrawLiquidity(uint256 shares, address _asset) external;

    function swap(address _from, address _to, uint256 _amount) external;
}
