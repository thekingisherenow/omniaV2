pragma solidity ^0.8.9;

import "./interfaces/IVault.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "hardhat/console.sol";

import {VaultDetails} from "./VaultLib.sol";
import {LibDiamond} from "./libraries/LibDiamond.sol";
import {IDiamondCut} from "./interfaces/IDiamondCut.sol";
import {IDiamond} from "./interfaces/IDiamond.sol";
import {IDiamondLoupe} from "./interfaces/IDiamondLoupe.sol";
import {IOwnership} from "./interfaces/IOwnership.sol";

import {DiamondInit} from "./upgradeInitializers/DiamondInit.sol";

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
        address[] memory facetAddresses,
        address initAddress
    ) public returns (address vault) {
        console.log("Creating vault");
        console.log("initAddress: ", initAddress);
        if (validVault[_VAULT] == true) {
            vault = Clones.clone(VAULT);
            _VAULT_DETAILS.ORACLE_CONTRACT = ORACLE;

            console.log("msg.sender", msg.sender);
            console.log("admin", ADMIN);

            // -> the biggest problem is : setting owner of the contract.
            //since VaultManager contract calls the initializeDiamond function,which inturn calls diamondCut function, msg.sender in the vault contract is VaultManager contract.. and passing the original owner address into the diamondCut function brings complexity to the diamond contract.So VAULTMANAGER is set as the owner of the vault contract.
            IDiamond(vault).initializeClone(
                address(this),
                facetAddresses,
                initAddress
            );

            // console.log("after cut !");

            IVault(vault).initialize(
                _VAULT_DETAILS,
                _WHITELISTED_ASSETS,
                _WHITELISTED_DETAILS
            );
            vaults.push(address(vault));

            //we give the ownership to the deployer in the end.
            IOwnership(vault).transferOwnership(msg.sender);
            address changedOwner = IOwnership(vault).owner();
            console.log("changedOwner: ", changedOwner);
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
