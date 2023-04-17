// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {VaultDetails, Whitelisted} from "../libraries/AppStorage.sol";

interface ILoan {
    function initialize(
        VaultDetails memory _VAULT_DETAILS,
        address[] memory _WHITELISTED_ASSETS,
        Whitelisted[] memory _WHITELISTED_DETAILS
    ) external;

    function getNextId() external view returns (uint256);

    function getUSDValue(address _asset, uint256 _amount) external view returns (uint256);

    function mint(uint256 amount) external;

    function getMyBalance() external view returns (uint256);
}
