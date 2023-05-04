// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import {LibDiamond} from "./libraries/LibDiamond.sol";
import {IDiamondCut} from "./interfaces/IDiamondCut.sol";
import "./libraries/AppStorage.sol";
import "hardhat/console.sol";
import {LibMeta} from "./libraries/LibMeta.sol";

contract VaultDiamond {
    AppStorage internal s;

    // these data should be saved in the diamondStorage.
    // bool private initialized;

    //=> further research on the contract owner is required..
    constructor(address _contractOwner, address _diamondCutFacet) payable {
        LibDiamond.setContractOwner(_contractOwner);

        // Add the diamondCut external function from the diamondCutFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory functionSelectors = new bytes4[](1);
        functionSelectors[0] = IDiamondCut.diamondCut.selector;
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: _diamondCutFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: functionSelectors
        });
        LibDiamond.diamondCut(cut, address(0), "");
    }

    function initializeClone(
        address _contractOwner,
        address[] memory facetAddresses,
        address initAddress
    ) public {
        console.log("s._nextId inside initializeClone", s._nextId);
        s._nextId = 3;
        console.log("s._nextId inside initializeClone", s._nextId);
        LibDiamond.setContractOwner(_contractOwner);
        //
        address owner = LibDiamond.contractOwner();
        console.log(
            "owner of contract just before initial cut in clone",
            owner
        );
        // Add the diamondCut external function from the diamondCutFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](6);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: facetAddresses[0],
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: LibMeta.getDiamondCutSelectors()
        });
        cut[1] = IDiamondCut.FacetCut({
            facetAddress: facetAddresses[1],
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: LibMeta.getDiamondLoupeFacetSelectors() //loupe
        });
        cut[2] = IDiamondCut.FacetCut({
            facetAddress: facetAddresses[2],
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: LibMeta.getOwnershipFacetSelectors() //owner
        });
        cut[3] = IDiamondCut.FacetCut({
            facetAddress: facetAddresses[3],
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: LibMeta.getLoanSelectors() //loan
        });
        cut[4] = IDiamondCut.FacetCut({
            facetAddress: facetAddresses[4],
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: LibMeta.getSwapSelectors() //swap
        });
        cut[5] = IDiamondCut.FacetCut({
            facetAddress: facetAddresses[5],
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: LibMeta.getErc1155FacetSelectors() //erc1155
        });

        //initialization to be done here..ie. DiamondInit is called..
        bytes memory data = abi.encodeWithSignature("init()");
        console.log("before Cut !");
        console.log("initAddress", initAddress);
        LibDiamond.diamondCut(cut, initAddress, data);
        console.log("after cut !");

        //change value of initialized to true to prevent it to run again.
        // initialized = true;
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        LibDiamond.DiamondStorage storage ds;
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        // get diamond storage
        assembly {
            ds.slot := position
        }
        // get facet from function selector
        address facet = address(bytes20(ds.facets[msg.sig]));
        require(facet != address(0), "VaultDiamond: Function does not exist");
        // Execute external function from facet using delegatecall and return any value.
        assembly {
            // copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // get any return value
            returndatacopy(0, 0, returndatasize())
            // return any return value or error back to the caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}
}
