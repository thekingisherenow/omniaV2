// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../libraries/LibLoan.sol";
import "../libraries/AppStorage.sol";

contract LoanFacet {
    AppStorage internal s;

    function getNextId() external view returns (uint256) {
        return s._nextId;
    }

    function initialize(
        VaultDetails memory _VAULT_DETAILS,
        address[] memory _WHITELISTED_ASSETS,
        Whitelisted[] memory _WHITELISTED_DETAILS
    ) external {
        LibLoan.initialize(
            _VAULT_DETAILS,
            _WHITELISTED_ASSETS,
            _WHITELISTED_DETAILS
        );
    }

    //GETTERS
    function getBalance(address addr) external view returns (uint256) {
        return LibLoan.getBalance(addr);
    }

    function getMyBalance() external view returns (uint256) {
        return LibLoan.getBalance(msg.sender);
    }

    function getUSDValue(
        address _asset,
        uint256 _amount
    ) external view returns (uint256) {
        return LibLoan.getUSDValue(_asset, _amount);
    }

    function mint(uint256 amount) external {
        return LibLoan.mint(msg.sender, amount);
    }

    //SETTERS
}
