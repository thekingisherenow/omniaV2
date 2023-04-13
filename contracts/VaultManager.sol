pragma solidity ^0.8.9;

import "./interfaces/IVault.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "hardhat/console.sol";

import {VaultDetails} from "./VaultLib.sol";
import {LibDiamond} from "./libraries/LibDiamond.sol";
import {IDiamondCut} from "./interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "./interfaces/IDiamondLoupe.sol";
import {ILoan} from "./interfaces/ILoan.sol";

contract VaultManager {
    address private VAULT;
    address private ADMIN;
    address private ORACLE;

    address[] public vaults;
    mapping(address => bool) public validVault;

    event FunctionSelector(
        bytes4 indexed functionSelector,
        address indexed _LOAN_FACET_ADDRESS,
        address indexed _NEW_VAULT
    );

    constructor(address _VAULT, address _ORACLE, address _ADMIN) {
        VAULT = _VAULT;
        ORACLE = _ORACLE;
        ADMIN = _ADMIN;
        validVault[_VAULT] = true;
    }

    function createVault(
        VaultDetails memory _VAULT_DETAILS,
        address[] memory _WHITELISTED_ASSETS,
        Whitelisted[] memory _WHITELISTED_DETAILS,
        address _VAULT,
        address _LOAN_FACET_ADDRESS
    ) public returns (address vault) {
        console.log("Creating vault");

        if (validVault[_VAULT] == true) {
            vault = Clones.clone(VAULT);
            _VAULT_DETAILS.ORACLE_CONTRACT = ORACLE;
            //add facets to the newly created vault
            //FACET CUT struct is initialized
            IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
            //function Selector array is initialized..
            bytes4[] memory functionSelectors = new bytes4[](1);
            //we need to modify stuffs noww..
            functionSelectors[0] = ILoan.initialize.selector;
            bytes4 functionSelector = functionSelectors[0];
            cut[0] = IDiamondCut.FacetCut({
                facetAddress: _LOAN_FACET_ADDRESS,
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: functionSelectors
            });

            emit FunctionSelector(functionSelector, _LOAN_FACET_ADDRESS, vault);
            IDiamondCut(vault).diamondCut(cut, address(0), "");

            IVault(vault).initialize(_VAULT_DETAILS, _WHITELISTED_ASSETS, _WHITELISTED_DETAILS);
            vaults.push(address(vault));
        }
    }

    function addValidVault(address _vault) public {
        require(msg.sender == ADMIN, "Only admin can add valid vault");
        validVault[_vault] = true;
    }

    function getVaults() public view returns (address[] memory) {
        return vaults;
    }
}
