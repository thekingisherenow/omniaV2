// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/AppStorage.sol";

interface ILoan {
    function getNextId() external view returns (uint256);

    function hedgePositions() external;

    function createLoan(
        address _collateral,
        address _loan_asset,
        uint256 _collateral_amount,
        uint256 _loan_amount,
        uint256 _repaymentDate
    ) external returns (uint256 loanId);

    function repayLoan(uint32 _loanId) external;

    function _loans(uint256 loanId) external view returns (Loan memory);
}
