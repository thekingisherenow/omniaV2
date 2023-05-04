// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../libraries/LibLoan.sol";
import {AppStorage} from "../libraries/AppStorage.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LoanFacet is ReentrancyGuard {
    AppStorage internal s;

    event loanCreated(
        Loan loan_details,
        address indexed borrower,
        uint256 indexed loanId
    );

    function getNextId() external view returns (uint256) {
        return LibLoan.getNextId();
    }

    function _loans(uint256 loanId) external view returns (Loan memory) {
        return LibLoan._loans(loanId);
    }

    function createLoan(
        address _collateral,
        address _loan_asset,
        uint256 _collateral_amount,
        uint256 _loan_amount,
        uint256 _repaymentDate
    ) external nonReentrant returns (uint256 loanId) {
        return
            LibLoan.createLoan(
                _collateral,
                _loan_asset,
                _collateral_amount,
                _loan_amount,
                _repaymentDate
            );
    }

    function repayLoan(uint32 _loanId) external {
        LibLoan.repayLoan(_loanId);
    }

    function hedgePositions() external {
        return LibLoan.hedgePositions();
    }
}
