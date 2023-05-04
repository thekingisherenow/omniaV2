// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {LibSwap} from "../libraries/LibSwap.sol";
import "../libraries/AppStorage.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SwapFacet is ReentrancyGuard {
    AppStorage internal s;

    function checkBalanced(
        address _asset,
        uint256 _amount
    ) external view returns (bool) {
        return LibSwap.checkBalanced(_asset, _amount);
    }

    function initialize(
        VaultDetails memory _VAULT_DETAILS,
        address[] memory _WHITELISTED_ASSETS,
        Whitelisted[] memory _WHITELISTED_DETAILS
    ) external {
        LibSwap.initialize(
            _VAULT_DETAILS,
            _WHITELISTED_ASSETS,
            _WHITELISTED_DETAILS
        );
    }

    function addLiquidity(
        uint256 _amount,
        address _asset
    ) external nonReentrant {
        LibSwap.addLiquidity(_amount, _asset);
    }

    function withdrawLiquidity(
        uint256 shares,
        address _asset
    ) external nonReentrant {
        LibSwap.withdrawLiquidity(shares, _asset);
    }

    function getUSDValue(
        address _asset,
        uint256 _amount
    ) external view returns (uint256) {
        return LibSwap.getUSDValue(_asset, _amount);
    }

    function getUSDBalanceAndDelta()
        external
        view
        returns (uint256, Delta[] memory deltas)
    {
        return LibSwap.getUSDBalanceAndDelta();
    }

    function swap(address _from, address _to, uint256 _amount) external {
        LibSwap.swap(_from, _to, _amount);
    }

    // uri function  was removed..

    //SETTERS
}
