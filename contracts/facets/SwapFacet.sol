// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {LibSwap} from "../libraries/LibSwap.sol";
import {LibStorage, AppStorage} from "../libraries/AppStorage.sol";

contract SwapFacet {
    AppStorage internal s;

    //GETTERS
    function getBalanceSwap(address addr) external view returns (uint256) {
        return LibSwap.getBalance(addr);
    }

    function getMyBalanceSwap() external view returns (uint256) {
        return LibSwap.getBalance(msg.sender);
    }

    function getConstantValueSwap() external pure returns (uint256) {
        return 2;
    }

    function mintSwap(uint256 amount) external {
        return LibSwap.mint(msg.sender, amount);
    }

    //SETTERS
}
