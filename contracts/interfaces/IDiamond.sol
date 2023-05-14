// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Prajan Bhattarai <prajanbhattarai63@gmail.com> 
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
/******************************************************************************/

interface IDiamond {
    function initializeClone(
        address[] memory facetAddresses,
        address initAddress
    ) external;
}
