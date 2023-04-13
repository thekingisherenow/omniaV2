// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {VaultDetails, Whitelisted} from "../libraries/AppStorage.sol";

interface ILoan {
    function initialize(
        VaultDetails memory _VAULT_DETAILS,
        address[] memory _WHITELISTED_ASSETS,
        Whitelisted[] memory _WHITELISTED_DETAILS
    ) external;
}
