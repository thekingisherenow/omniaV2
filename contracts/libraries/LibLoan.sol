// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./AppStorage.sol";
import {LibERC1155Internal} from "./LibERC1155Internal.sol";
import "./AppStorage.sol";
import "../interfaces/IOracle.sol";

library LibLoan {
    //STORAGE GETTERS
    function s() internal pure returns (AppStorage storage) {
        return LibStorage.appStorage();
    }

    function initialize(
        VaultDetails memory _VAULT_DETAILS,
        address[] memory _WHITELISTED_ASSETS,
        Whitelisted[] memory _WHITELISTED_DETAILS
    ) internal {
        s().VAULT_DETAILS = _VAULT_DETAILS;
        s().WHITELISTED_ASSETS = _WHITELISTED_ASSETS;

        uint length = _WHITELISTED_ASSETS.length;
        uint32 max_exposure;
        for (uint i = 0; i < _WHITELISTED_ASSETS.length; i++) {
            s().WHITELISTED_DETAILS[_WHITELISTED_DETAILS[i].collection] = _WHITELISTED_DETAILS[i];
            s().idx[_WHITELISTED_DETAILS[i].collection] = i;

            if (_WHITELISTED_DETAILS[i].MAX_EXPOSURE > max_exposure) {
                s().MAIN_ASSET = _WHITELISTED_ASSETS[i];
                max_exposure = _WHITELISTED_DETAILS[i].MAX_EXPOSURE;
            }
        }
    }

    function getUSDValue(address _asset, uint256 _amount) internal view returns (uint256) {
        uint256 oraclePrice = IOracle(s().VAULT_DETAILS.ORACLE_CONTRACT).getPrice(_asset);
        return (_amount / 10 ** 3) * (oraclePrice / 10 ** 15);
    }

    // getting balance and minting- for testing purpose.
    function getBalance(address addr) internal view returns (uint256) {
        return LibERC1155Internal._balanceOf(addr, 0);
    }

    function mint(address to, uint256 amount) internal {
        return LibERC1155Internal._mint(to, 0, amount, "");
    }
}
