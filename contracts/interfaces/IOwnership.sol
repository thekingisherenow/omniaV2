// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IERC173} from "../interfaces/IERC173.sol";

interface IOwnership {
    function transferOwnership(address _newOwner) external;

    function owner() external view returns (address owner_);
}
