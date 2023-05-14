// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {AppStorage, Loan, Delta, GMXPosition, Whitelisted, LoanDetails} from "./AppStorage.sol";
import {LibERC1155Internal} from "./LibERC1155Internal.sol";
import "../interfaces/IOracle.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IGMX} from "../interfaces/IGMX.sol";
import {LibSwap} from "./LibSwap.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
//only during dev
import "hardhat/console.sol";

library LibLoan {
    event loanCreated(
        Loan loan_details,
        address indexed borrower,
        uint256 indexed loanId
    );

    //STORAGE GETTERS
    function appStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    function getNextId() internal view returns (uint256) {
        AppStorage storage s = appStorage();
        return s._nextId;
    }

    function _loans(uint256 loanId) internal view returns (Loan memory) {
        AppStorage storage s = appStorage();
        return s._loans[loanId];
    }

    function hedgePositions() internal {
        AppStorage storage s = appStorage();
        (uint256 usd_balance, Delta[] memory deltas) = LibSwap
            .getUSDBalanceAndDelta();
        for (uint i = 0; i < deltas.length; i++) {
            Delta memory curr_delta = deltas[i];
            GMXPosition memory pos = IGMX(s.VAULT_DETAILS.GMX_CONTRACT)
                .getPosition(
                    msg.sender,
                    s.MAIN_ASSET,
                    curr_delta.collection,
                    false
                );
            uint256 allowed_divergence = (s
                .WHITELISTED_DETAILS[curr_delta.collection]
                .MAX_DELTA_DIVERGENCE * usd_balance) / 100;
            if (
                (curr_delta.delta * 100) / usd_balance >
                s.WHITELISTED_DETAILS[curr_delta.collection].HEDGE_AT
            ) {
                if (pos.size > curr_delta.delta) {
                    uint256 diff = pos.size - curr_delta.delta;
                    if (diff > allowed_divergence) {
                        uint256 decrease_size = ((s
                            .WHITELISTED_DETAILS[curr_delta.collection]
                            .COLLATERAL_SIZE * diff) / pos.size);
                        IGMX(s.VAULT_DETAILS.GMX_CONTRACT).decreasePosition(
                            msg.sender,
                            s.MAIN_ASSET,
                            curr_delta.collection,
                            decrease_size,
                            diff,
                            false,
                            msg.sender
                        );
                        s
                            .WHITELISTED_DETAILS[curr_delta.collection]
                            .COLLATERAL_SIZE -= decrease_size;
                    }
                } else if (pos.size < curr_delta.delta) {
                    uint256 diff = curr_delta.delta - pos.size;
                    if (diff > allowed_divergence) {
                        uint256 collateralSize = diff * 2;
                        IERC20(s.MAIN_ASSET).approve(
                            s.VAULT_DETAILS.GMX_CONTRACT,
                            collateralSize
                        );
                        bool success = IERC20(s.MAIN_ASSET).transfer(
                            s.VAULT_DETAILS.GMX_CONTRACT,
                            collateralSize
                        );
                        require(success, "1");
                        //unchecked transfer occurs here.

                        IGMX(s.VAULT_DETAILS.GMX_CONTRACT).increasePosition(
                            msg.sender,
                            s.MAIN_ASSET,
                            curr_delta.collection,
                            diff,
                            false
                        );
                        s
                            .WHITELISTED_DETAILS[curr_delta.collection]
                            .COLLATERAL_SIZE += collateralSize;
                    }
                }
            } else {
                if (pos.size > allowed_divergence) {
                    IGMX(s.VAULT_DETAILS.GMX_CONTRACT).decreasePosition(
                        msg.sender,
                        s.MAIN_ASSET,
                        curr_delta.collection,
                        s
                            .WHITELISTED_DETAILS[curr_delta.collection]
                            .COLLATERAL_SIZE,
                        pos.size,
                        false,
                        msg.sender
                    );
                    s
                        .WHITELISTED_DETAILS[curr_delta.collection]
                        .COLLATERAL_SIZE = 0;
                }
            }
        }
    }

    // non entrant modifier is removed for now. still be re-instated
    // new struct LoanDetails was created and used to solved : StackTooDeep error.
    function createLoan(
        address _collateral,
        address _loan_asset,
        uint256 _collateral_amount,
        uint256 _loan_amount,
        uint256 _repaymentDate
    ) internal returns (uint256 loanId) {
        AppStorage storage s = appStorage();

        // require(IERC20(_collateral).balanceOf(address(msg.sender)) >= _collateral_amount, "Insufficient balance");
        // require(IERC20(_loan_asset).balanceOf(address(this)) >= _loan_amount, "Insufficient balance");

        Whitelisted memory details = s.WHITELISTED_DETAILS[_collateral];
        LoanDetails memory loanDetails;

        loanDetails.collateral = _collateral;
        loanDetails.loan_asset = _loan_asset;
        loanDetails.collateral_amount = _collateral_amount;
        loanDetails.loan_amount = _loan_amount;
        loanDetails.repayment_date = _repaymentDate;

        loanDetails.collateral_worth = LibSwap.getUSDValue(
            _collateral,
            _collateral_amount
        );
        loanDetails.loan_amount_worth = LibSwap.getUSDValue(
            _loan_asset,
            _loan_amount
        );

        loanDetails.ltv =
            (loanDetails.loan_amount_worth * 1000) /
            (loanDetails.collateral_worth);
        loanDetails.apr = details.MIN_APR;

        if (loanDetails.ltv > 0) {
            if (
                ((details.slope * loanDetails.ltv) / 1000) > details.intercept
            ) {
                loanDetails.apr = Math.max(
                    loanDetails.apr,
                    ((details.slope * loanDetails.ltv) / 1000) -
                        details.intercept
                );
            }
        }

        loanDetails.apr = Math.min(loanDetails.apr, details.MAX_APR);

        // LTV must be smaller than a global
        require(loanDetails.ltv < 950, "5");

        loanDetails.repayment =
            loanDetails.loan_amount +
            ((loanDetails.loan_amount *
                loanDetails.apr *
                (loanDetails.repayment_date - block.timestamp)) / 31536000000);

        bool success = IERC20(_collateral).transferFrom(
            msg.sender,
            address(this),
            _collateral_amount
        );
        // not enough balance or not approved
        require(success, "1");

        bool success2 = IERC20(_loan_asset).transfer(msg.sender, _loan_amount);
        // not enough balance or not approved
        require(success2, "1");

        loanId = ++s._nextId;
        //so the value of loanId is changed to 2 now.
        //yaha save gareko cha ta data. kina save bhayena data??
        console.log("_loans ma data save garnu agi");

        // BIG PROBLEM
        s._loans[loanId] = Loan({
            timestamp: block.timestamp,
            collateral: loanDetails.collateral,
            loan_asset: loanDetails.loan_asset,
            repaymentDate: loanDetails.repayment_date,
            principal: loanDetails.loan_amount,
            repayment: loanDetails.repayment,
            lockedAmount: loanDetails.collateral_amount
        });
        console.log("loanId", loanId);
        console.log(s._loans[loanId].repayment);

        LibERC1155Internal._mint(msg.sender, loanId, 1, "");
        emit loanCreated(s._loans[loanId], msg.sender, loanId);
    }

    function repayLoan(uint32 _loanId) internal {
        AppStorage storage s = appStorage();

        Loan storage curr_loan = s._loans[_loanId];
        require(curr_loan.repaymentDate >= block.timestamp, "3");

        bool success = IERC20(curr_loan.loan_asset).transferFrom(
            msg.sender,
            address(this),
            curr_loan.repayment
        );
        // not enough balance or not approved
        require(success, "1");

        bool success2 = IERC20(curr_loan.collateral).transfer(
            msg.sender,
            curr_loan.lockedAmount
        );
        require(success2, "1");

        //unchecked transfer oocurs here.

        delete s._loans[_loanId];

        LibERC1155Internal._burn(msg.sender, _loanId, 1);
    }

    //custom functions to check the functioning of the diamond.
}
