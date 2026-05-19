// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IVerifierStaking } from "./interfaces/IVerifierStaking.sol";

contract VerifierStaking is IVerifierStaking, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant DOMAIN_ADMIN_ROLE = keccak256("DOMAIN_ADMIN_ROLE");
    bytes32 public constant BOND_MANAGER_ROLE = keccak256("BOND_MANAGER_ROLE");
    bytes32 public constant SLASHER_ROLE = keccak256("SLASHER_ROLE");

    IERC20 public immutable vst;

    mapping(address => mapping(uint256 => bool)) public domainCredential;
    mapping(address => mapping(uint256 => uint128)) public domainStake;
    mapping(address => mapping(uint256 => uint128)) private _lockedByDomain;
    mapping(uint256 => mapping(address => uint128)) public override claimBond;
    mapping(uint256 => mapping(address => uint256)) public claimBondDomain;
    mapping(uint256 => uint256) public override totalBondedForClaim;

    uint256 public override totalStaked;

    event DomainCredentialSet(address indexed verifier, uint256 indexed domainId, bool approved);
    event DomainStakeAdded(address indexed verifier, uint256 indexed domainId, uint128 amount);
    event DomainStakeRemoved(address indexed verifier, uint256 indexed domainId, uint128 amount);
    event ClaimBondLocked(address indexed verifier, uint256 indexed claimId, uint256 indexed domainId, uint128 amount);
    event ClaimBondUnlocked(address indexed verifier, uint256 indexed claimId, uint128 amount);
    event ClaimBondSlashed(address indexed verifier, uint256 indexed claimId, uint128 amount, address recipient);

    /// @notice Deploys the VST staking and claim-bonding contract.
    /// @param vst_ VST token used for staking and slashing.
    /// @param admin Timelock or setup address receiving all initial roles.
    constructor(IERC20 vst_, address admin) {
        require(address(vst_) != address(0), "VerifierStaking: token zero");
        require(admin != address(0), "VerifierStaking: admin zero");
        vst = vst_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(DOMAIN_ADMIN_ROLE, admin);
        _grantRole(BOND_MANAGER_ROLE, admin);
        _grantRole(SLASHER_ROLE, admin);
    }

    /// @notice Pauses staking, bonding, and unstaking actions.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpauses staking, bonding, and unstaking actions.
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Sets whether a verifier may register into a claim domain pool.
    /// @param verifier Verifier address.
    /// @param domainId Domain pool id.
    /// @param approved Whether this verifier is credentialed for the domain.
    function setDomainCredential(address verifier, uint256 domainId, bool approved)
        external
        onlyRole(DOMAIN_ADMIN_ROLE)
    {
        require(verifier != address(0), "VerifierStaking: verifier zero");
        require(domainId != 0, "VerifierStaking: domain zero");
        domainCredential[verifier][domainId] = approved;
        emit DomainCredentialSet(verifier, domainId, approved);
    }

    /// @notice Stakes VST into a credentialed domain pool.
    /// @param domainId Domain pool id.
    /// @param amount Amount of VST to stake.
    function registerDomainPool(uint256 domainId, uint128 amount)
        external
        nonReentrant
        whenNotPaused
    {
        require(domainCredential[msg.sender][domainId], "VerifierStaking: not credentialed");
        require(amount != 0, "VerifierStaking: amount zero");
        domainStake[msg.sender][domainId] += amount;
        totalStaked += amount;
        vst.safeTransferFrom(msg.sender, address(this), amount);
        emit DomainStakeAdded(msg.sender, domainId, amount);
    }

    /// @notice Unstakes available VST from a domain pool.
    /// @param domainId Domain pool id.
    /// @param amount Amount to unstake.
    function requestUnstake(uint256 domainId, uint128 amount) external nonReentrant whenNotPaused {
        require(amount != 0, "VerifierStaking: amount zero");
        require(availableStake(msg.sender, domainId) >= amount, "VerifierStaking: locked");
        domainStake[msg.sender][domainId] -= amount;
        totalStaked -= amount;
        vst.safeTransfer(msg.sender, amount);
        emit DomainStakeRemoved(msg.sender, domainId, amount);
    }

    /// @notice Locks a verifier's existing stake as a per-claim bond.
    /// @param verifier Verifier committing to the claim.
    /// @param claimId Claim id.
    /// @param domainId Claim domain.
    /// @param amount Bond amount.
    function lockClaimBond(address verifier, uint256 claimId, uint256 domainId, uint128 amount)
        external
        onlyRole(BOND_MANAGER_ROLE)
        whenNotPaused
    {
        require(verifier != address(0), "VerifierStaking: verifier zero");
        require(isRegistered(verifier, domainId), "VerifierStaking: unregistered");
        require(availableStake(verifier, domainId) >= amount, "VerifierStaking: insufficient stake");
        if (claimBond[claimId][verifier] == 0) {
            claimBondDomain[claimId][verifier] = domainId;
        } else {
            require(claimBondDomain[claimId][verifier] == domainId, "VerifierStaking: domain mismatch");
        }
        claimBond[claimId][verifier] += amount;
        _lockedByDomain[verifier][domainId] += amount;
        totalBondedForClaim[claimId] += amount;
        emit ClaimBondLocked(verifier, claimId, domainId, amount);
    }

    /// @notice Unlocks an un-slashed claim bond back into available domain stake.
    /// @param verifier Verifier whose bond is released.
    /// @param claimId Claim id.
    /// @param amount Amount to unlock.
    function unlockClaimBond(address verifier, uint256 claimId, uint128 amount)
        external
        onlyRole(BOND_MANAGER_ROLE)
        whenNotPaused
    {
        uint256 domainId = claimBondDomain[claimId][verifier];
        require(domainId != 0, "VerifierStaking: no bond");
        require(claimBond[claimId][verifier] >= amount, "VerifierStaking: too much");
        claimBond[claimId][verifier] -= amount;
        _lockedByDomain[verifier][domainId] -= amount;
        totalBondedForClaim[claimId] -= amount;
        emit ClaimBondUnlocked(verifier, claimId, amount);
    }

    /// @notice Slashes a claim bond and transfers the slashed VST to a recipient contract.
    /// @param verifier Verifier being slashed.
    /// @param claimId Claim id.
    /// @param amount Amount to slash.
    /// @param recipient Recipient of the slashed tokens.
    function slashClaimBond(address verifier, uint256 claimId, uint128 amount, address recipient)
        external
        onlyRole(SLASHER_ROLE)
        whenNotPaused
    {
        require(recipient != address(0), "VerifierStaking: recipient zero");
        uint256 domainId = claimBondDomain[claimId][verifier];
        require(domainId != 0, "VerifierStaking: no bond");
        require(claimBond[claimId][verifier] >= amount, "VerifierStaking: too much");
        claimBond[claimId][verifier] -= amount;
        _lockedByDomain[verifier][domainId] -= amount;
        domainStake[verifier][domainId] -= amount;
        totalBondedForClaim[claimId] -= amount;
        totalStaked -= amount;
        vst.safeTransfer(recipient, amount);
        emit ClaimBondSlashed(verifier, claimId, amount, recipient);
    }

    /// @notice Returns whether a verifier is credentialed and has stake in a domain.
    /// @param verifier Verifier address.
    /// @param domainId Domain pool id.
    /// @return True if the verifier can vote in the domain.
    function isRegistered(address verifier, uint256 domainId) public view returns (bool) {
        return domainCredential[verifier][domainId] && domainStake[verifier][domainId] != 0;
    }

    /// @notice Returns currently unbonded VST in a verifier's domain pool.
    /// @param verifier Verifier address.
    /// @param domainId Domain pool id.
    /// @return Amount available for new bonds or unstaking.
    function availableStake(address verifier, uint256 domainId) public view returns (uint256) {
        return domainStake[verifier][domainId] - _lockedByDomain[verifier][domainId];
    }
}
