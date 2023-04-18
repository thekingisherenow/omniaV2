// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./AppStorage.sol";
import {LibERC1155Internal} from "./LibERC1155Internal.sol";
import "./AppStorage.sol";
import "../interfaces/IOracle.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IGMX} from "../interfaces/IGMX.sol";

library LibLoan {
    //STORAGE GETTERS
    function appStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    function initialize(
        VaultDetails memory _VAULT_DETAILS,
        address[] memory _WHITELISTED_ASSETS,
        Whitelisted[] memory _WHITELISTED_DETAILS
    ) internal {
        AppStorage storage s = appStorage();
        s.VAULT_DETAILS = _VAULT_DETAILS;
        s.WHITELISTED_ASSETS = _WHITELISTED_ASSETS;

        uint length = _WHITELISTED_ASSETS.length;
        uint32 max_exposure;
        for (uint i = 0; i < _WHITELISTED_ASSETS.length; i++) {
            s.WHITELISTED_DETAILS[
                _WHITELISTED_DETAILS[i].collection
            ] = _WHITELISTED_DETAILS[i];
            s.idx[_WHITELISTED_DETAILS[i].collection] = i;

            if (_WHITELISTED_DETAILS[i].MAX_EXPOSURE > max_exposure) {
                s.MAIN_ASSET = _WHITELISTED_ASSETS[i];
                max_exposure = _WHITELISTED_DETAILS[i].MAX_EXPOSURE;
            }
        }
    }

    // function getUSDBalanceAndDelta()
    //     internal
    //     view
    //     returns (uint256, Delta[] memory deltas)
    // {
    //     AppStorage storage s = appStorage();

    //     Delta[] memory deltas = new Delta[](s.WHITELISTED_ASSETS.length);

    //     uint256 usd_balance;

    //     for (uint i = 0; i < s.WHITELISTED_ASSETS.length; i++) {
    //         //first check basic balance
    //         uint256 curr_balance = getUSDValue(
    //             s.WHITELISTED_ASSETS[i],
    //             IERC20(s.WHITELISTED_ASSETS[i]).balanceOf(address(this))
    //         );

    //         usd_balance = usd_balance + curr_balance;

    //         uint256 curr_idx = s.idx[s.WHITELISTED_ASSETS[i]];

    //         deltas[curr_idx].delta = deltas[curr_idx].delta + curr_balance;
    //         deltas[curr_idx].direction = true;
    //         deltas[curr_idx].collection = s.WHITELISTED_ASSETS[i];

    //         //now for hedges
    //         GMXPosition memory pos = IGMX(VAULT_DETAILS.GMX_CONTRACT)
    //             .getPosition(
    //                 msg.sender,
    //                 MAIN_ASSET,
    //                 WHITELISTED_ASSETS[i],
    //                 false
    //             );

    //         if (pos.size > 0) {
    //             uint256 posSize = (pos.size / 10 ** 3) *
    //                 (pos.averagePrice / 10 ** 15);
    //             usd_balance = usd_balance + pos.collateral;

    //             if (deltas[curr_idx].delta > posSize) {
    //                 deltas[curr_idx].delta = deltas[curr_idx].delta - posSize;
    //                 deltas[curr_idx].direction = true;
    //             } else {
    //                 deltas[curr_idx].delta = posSize - deltas[curr_idx].delta;
    //                 deltas[curr_idx].direction = false;
    //             }

    //             (bool hasProfit, uint256 delta) = IGMX(
    //                 s.VAULT_DETAILS.GMX_CONTRACT
    //             ).getDelta(
    //                     s.WHITELISTED_ASSETS[i],
    //                     pos.size,
    //                     pos.averagePrice,
    //                     false,
    //                     pos.lastIncreasedTime
    //                 );

    //             if (hasProfit) {
    //                 usd_balance = usd_balance + delta;
    //             } else {
    //                 usd_balance = usd_balance - delta;
    //             }
    //         }
    //     }

    //     //now check active loans
    //     for (uint i = 1; i <= s._nextId; i++) {
    //         Loan memory curr_loan = s._loans[i];

    //         if (curr_loan.timestamp != 0) {
    //             //from usd
    //             usd_balance =
    //                 usd_balance -
    //                 getUSDValue(curr_loan.collateral, curr_loan.principal);
    //             uint256 duration_done = ((block.timestamp -
    //                 curr_loan.timestamp) * 10000) /
    //                 (curr_loan.repaymentDate - curr_loan.timestamp);
    //             usd_balance =
    //                 usd_balance +
    //                 ((getUSDValue(curr_loan.loan_asset, curr_loan.repayment) *
    //                     duration_done) / 10000);

    //             //from delta
    //             uint256 collateral_value = getUSDValue(
    //                 curr_loan.collateral,
    //                 curr_loan.lockedAmount
    //             );
    //             uint256 loan_value = getUSDValue(
    //                 curr_loan.loan_asset,
    //                 curr_loan.repayment
    //             );

    //             if (collateral_value < ((loan_value * 101) / 100)) {
    //                 uint256 new_idx = s.idx[curr_loan.loan_asset];

    //                 if (deltas[new_idx].delta > loan_value) {
    //                     deltas[new_idx].delta =
    //                         deltas[new_idx].delta -
    //                         loan_value;
    //                     deltas[new_idx].direction = true;
    //                 } else {
    //                     deltas[new_idx].delta =
    //                         loan_value -
    //                         deltas[new_idx].delta;
    //                     deltas[new_idx].direction = false;
    //                 }
    //             }
    //         }
    //     }

    //     return (usd_balance, deltas);
    // }

    function getUSDValue(
        address _asset,
        uint256 _amount
    ) internal view returns (uint256) {
        AppStorage storage s = appStorage();
        uint256 oraclePrice = IOracle(s.VAULT_DETAILS.ORACLE_CONTRACT).getPrice(
            _asset
        );
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
