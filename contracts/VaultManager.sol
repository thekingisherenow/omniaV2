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
    mapping(address => bytes4[]) public facetToFunctionSelectors;

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
        address[] memory facetAddresses
    ) public returns (address vault) {
        console.log("Creating vault");

        if (validVault[_VAULT] == true) {
            vault = Clones.clone(VAULT);
            _VAULT_DETAILS.ORACLE_CONTRACT = ORACLE;
            //add facets to the newly created vault
            //FACET CUT struct is initialized---3 facets
            IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](2);
            //we need to modify stuffs noww..
            // -> facetaddress ko samasya ta bhayena. tara selector ko kura aayo.

            cut[0] = IDiamondCut.FacetCut({
                facetAddress: facetAddresses[0],
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: getLoanSelectors()
            });
            cut[1] = IDiamondCut.FacetCut({
                facetAddress: facetAddresses[1],
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: getDiamondCutSelectors()
            });

            IDiamondCut(vault).diamondCut(cut, address(0), "");
            //update the value of NEXTID()

            IVault(vault).initialize(_VAULT_DETAILS, _WHITELISTED_ASSETS, _WHITELISTED_DETAILS);
            vaults.push(address(vault));
        }
    }

    //we have to manually set the list of selectors to add.
    function getLoanSelectors() public pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = ILoan.initialize.selector;
        selectors[1] = ILoan.getNextId.selector;
        selectors[2] = ILoan.getUSDValue.selector;
        selectors[3] = ILoan.mint.selector;
        selectors[4] = ILoan.getMyBalance.selector;

        return selectors;
    }

    //list of selector from DIamondCUtFacet
    function getDiamondCutSelectors() public pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = IDiamondCut.diamondCut.selector;
        return selectors;
    }

    function addValidVault(address _vault) public {
        require(msg.sender == ADMIN, "Only admin can add valid vault");
        validVault[_vault] = true;
    }

    function getVaults() public view returns (address[] memory) {
        return vaults;
    }
}
