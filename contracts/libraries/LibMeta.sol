// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {ILoan} from "../interfaces/ILoan.sol";
import {ISwap} from "../interfaces/ISwap.sol";
import {IERC1155} from "../interfaces/IERC1155.sol";
import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../interfaces/IDiamondLoupe.sol";
import {IOwnership} from "../interfaces/IOwnership.sol";

library LibMeta {
    function msgSender() internal view returns (address sender_) {
        if (msg.sender == address(this)) {
            bytes memory array = msg.data;
            uint256 index = msg.data.length;
            assembly {
                // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
                sender_ := and(
                    mload(add(array, index)),
                    0xffffffffffffffffffffffffffffffffffffffff
                )
            }
        } else {
            sender_ = msg.sender;
        }
    }

    //we have to manually set the list of selectors to add.
    function getLoanSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = ILoan.getNextId.selector;
        selectors[1] = ILoan.hedgePositions.selector;
        selectors[2] = ILoan.createLoan.selector;
        selectors[3] = ILoan.repayLoan.selector;
        selectors[4] = ILoan._loans.selector;
        return selectors;
    }

    function getSwapSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = ISwap.initialize.selector;
        selectors[1] = ISwap.checkBalanced.selector;
        selectors[2] = ISwap.getUSDBalanceAndDelta.selector;
        selectors[3] = ISwap.getUSDValue.selector;
        selectors[4] = ISwap.addLiquidity.selector;
        selectors[5] = ISwap.withdrawLiquidity.selector;
        selectors[6] = ISwap.swap.selector;
        return selectors;
    }

    function getErc1155FacetSelectors()
        internal
        pure
        returns (bytes4[] memory)
    {
        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = IERC1155.balanceOf.selector;
        selectors[1] = IERC1155.balanceOfBatch.selector;
        selectors[2] = IERC1155.isApprovedForAll.selector;
        selectors[3] = IERC1155.safeBatchTransferFrom.selector;
        selectors[4] = IERC1155.setApprovalForAll.selector;
        selectors[5] = IERC1155.safeTransferFrom.selector;
        return selectors;
    }

    //list of selector from DIamondCUtFacet
    function getDiamondCutSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = IDiamondCut.diamondCut.selector;
        return selectors;
    }

    //list of selector from DIamondCUtFacet
    function getDiamondLoupeFacetSelectors()
        internal
        pure
        returns (bytes4[] memory)
    {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = IDiamondLoupe.facets.selector;
        selectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        selectors[2] = IDiamondLoupe.facetAddress.selector;
        selectors[3] = IDiamondLoupe.facetAddresses.selector;
        return selectors;
    }

    function getOwnershipFacetSelectors()
        internal
        pure
        returns (bytes4[] memory)
    {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = IOwnership.owner.selector;
        selectors[1] = IOwnership.transferOwnership.selector;
        return selectors;
    }
}
