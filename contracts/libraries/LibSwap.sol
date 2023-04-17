// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {AppStorage} from "./AppStorage.sol";
import {LibERC1155Internal} from "./LibERC1155Internal.sol";

library LibSwap {
    //STORAGE GETTERS
    function appStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    //RoughFacet logic

    function getBalance(address addr) internal view returns (uint256) {
        return LibERC1155Internal._balanceOf(addr, 0);
    }

    function mint(address to, uint256 amount) internal {
        return LibERC1155Internal._mint(to, 0, amount, "");
    }
}
