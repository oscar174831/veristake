// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ISoulboundReputation } from "./interfaces/ISoulboundReputation.sol";

interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

contract SoulboundReputation is ISoulboundReputation, IERC5192, ERC721, AccessControl {
    bytes32 public constant PARAMETER_ROLE = keccak256("PARAMETER_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    uint16 public constant BPS = 10_000;
    uint16 public constant MIN_PRIOR_BPS = 5_000;
    uint16 public constant MAX_PRIOR_BPS = 9_000;
    uint16 public constant MIN_WEIGHT_BPS = 5_000;
    uint16 public constant MAX_WEIGHT_BPS = 10_000;
    uint16 public constant MIN_EMA_WINDOW = 10;
    uint16 public constant MAX_EMA_WINDOW = 365;

    uint16 public newVerifierPriorBps = 7_000;
    uint16 public emaWindow = 100;

    mapping(address => mapping(uint256 => uint16)) private _accuracyBps;
    mapping(address => mapping(uint256 => bool)) private _initialized;

    error SoulboundTransfer();

    event AccuracyUpdated(address indexed verifier, uint256 indexed domainId, uint16 accuracyBps);
    event EmaWindowUpdated(uint16 emaWindow);
    event NewVerifierPriorUpdated(uint16 priorBps);

    /// @notice Deploys the non-transferable verifier reputation NFT.
    /// @param admin Timelock or setup address receiving all initial roles.
    constructor(address admin) ERC721("Veristake Reputation", "vsREP") {
        require(admin != address(0), "SoulboundReputation: admin zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PARAMETER_ROLE, admin);
        _grantRole(UPDATER_ROLE, admin);
    }

    /// @notice Sets the EMA window used for accuracy updates.
    /// @param newWindow New rolling window, bounded on-chain.
    function setEmaWindow(uint16 newWindow) external onlyRole(PARAMETER_ROLE) {
        require(newWindow >= MIN_EMA_WINDOW && newWindow <= MAX_EMA_WINDOW, "SoulboundReputation: bad window");
        emaWindow = newWindow;
        emit EmaWindowUpdated(newWindow);
    }

    /// @notice Sets the default accuracy prior for a newly seen verifier.
    /// @param priorBps Prior accuracy in basis points.
    function setNewVerifierPrior(uint16 priorBps) external onlyRole(PARAMETER_ROLE) {
        require(priorBps >= MIN_PRIOR_BPS && priorBps <= MAX_PRIOR_BPS, "SoulboundReputation: bad prior");
        newVerifierPriorBps = priorBps;
        emit NewVerifierPriorUpdated(priorBps);
    }

    /// @notice Mints a locked domain reputation attestation if one does not exist.
    /// @param verifier Verifier address.
    /// @param domainId Domain pool id.
    /// @return tokenId Deterministic token id for verifier and domain.
    function ensureAttestation(address verifier, uint256 domainId) public returns (uint256 tokenId) {
        require(verifier != address(0), "SoulboundReputation: verifier zero");
        require(domainId != 0, "SoulboundReputation: domain zero");
        tokenId = _tokenId(verifier, domainId);
        if (_ownerOf(tokenId) == address(0)) {
            _safeMint(verifier, tokenId);
            emit Locked(tokenId);
        }
        if (!_initialized[verifier][domainId]) {
            _initialized[verifier][domainId] = true;
            _accuracyBps[verifier][domainId] = newVerifierPriorBps;
            emit AccuracyUpdated(verifier, domainId, newVerifierPriorBps);
        }
    }

    /// @notice Updates a verifier's rolling accuracy after a final claim result.
    /// @param verifier Verifier being updated.
    /// @param domainId Domain pool id.
    /// @param correct Whether the verifier matched the binding final result.
    function updateAccuracy(address verifier, uint256 domainId, bool correct)
        external
        onlyRole(UPDATER_ROLE)
    {
        ensureAttestation(verifier, domainId);
        uint256 oldAccuracy = _accuracyBps[verifier][domainId];
        uint256 target = correct ? BPS : 0;
        uint16 updated = uint16(((oldAccuracy * (emaWindow - 1)) + target) / emaWindow);
        _accuracyBps[verifier][domainId] = updated;
        emit AccuracyUpdated(verifier, domainId, updated);
    }

    /// @notice Returns current accuracy for a verifier in a domain.
    /// @param verifier Verifier address.
    /// @param domainId Domain pool id.
    /// @return Accuracy in basis points.
    function accuracyBps(address verifier, uint256 domainId) public view returns (uint16) {
        if (!_initialized[verifier][domainId]) {
            return newVerifierPriorBps;
        }
        return _accuracyBps[verifier][domainId];
    }

    /// @notice Returns reputation-adjusted voting weight for a stake amount.
    /// @param verifier Verifier address.
    /// @param domainId Domain pool id.
    /// @param stakeAmount Nominal stake weight.
    /// @return Reputation-weighted vote power.
    function votingWeight(address verifier, uint256 domainId, uint256 stakeAmount)
        external
        view
        returns (uint256)
    {
        uint256 multiplierBps = MIN_WEIGHT_BPS + (uint256(accuracyBps(verifier, domainId)) / 2);
        if (multiplierBps > MAX_WEIGHT_BPS) {
            multiplierBps = MAX_WEIGHT_BPS;
        }
        return (stakeAmount * multiplierBps) / BPS;
    }

    /// @notice ERC-5192 locked status for every minted token.
    /// @param tokenId Token id.
    /// @return Always true for existing reputation attestations.
    function locked(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "SoulboundReputation: unknown token");
        return true;
    }

    /// @notice Returns the deterministic reputation token id.
    /// @param verifier Verifier address.
    /// @param domainId Domain pool id.
    /// @return Deterministic token id.
    function tokenIdOf(address verifier, uint256 domainId) external pure returns (uint256) {
        return _tokenId(verifier, domainId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransfer();
        }
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }

    function _tokenId(address verifier, uint256 domainId) private pure returns (uint256) {
        return uint256(keccak256(abi.encode(verifier, domainId)));
    }
}
