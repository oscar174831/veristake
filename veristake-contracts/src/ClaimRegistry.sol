// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { IClaimRegistry } from "./interfaces/IClaimRegistry.sol";

contract ClaimRegistry is IClaimRegistry, AccessControl, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant VOTING_ROLE = keccak256("VOTING_ROLE");

    uint256 public nextClaimId = 1;

    mapping(uint256 => ClaimView) private _claims;

    event ClaimSubmitted(
        uint256 indexed claimId,
        uint256 indexed domainId,
        bytes32 indexed policyId,
        address claimant,
        uint128 requestedPayoutAmount
    );
    event ClaimStateChanged(uint256 indexed claimId, ClaimState fromState, ClaimState toState);
    event ClaimOutcomeUpdated(uint256 indexed claimId, VoteKind kind, uint16 amountBps, bool finalOutcome);

    /// @notice Deploys the claim registry used by carrier integrations and voting modules.
    /// @param admin Timelock or setup address receiving all initial roles.
    constructor(address admin) {
        require(admin != address(0), "ClaimRegistry: admin zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(VOTING_ROLE, admin);
    }

    /// @notice Pauses claim submissions and state changes.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpauses claim submissions and state changes.
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Submits an off-chain claim metadata pointer for verification.
    /// @param domainId Claim domain pool, such as health, travel, or smart-contract risk.
    /// @param ipfsMetadataHash Hash of the off-chain claim bundle.
    /// @param requestedPayoutAmount Amount requested from the carrier payout reserve.
    /// @param policyId Carrier policy template identifier.
    /// @return claimId Newly assigned claim id.
    function submitClaim(
        uint256 domainId,
        bytes32 ipfsMetadataHash,
        uint128 requestedPayoutAmount,
        bytes32 policyId
    ) external whenNotPaused returns (uint256 claimId) {
        require(domainId != 0, "ClaimRegistry: domain zero");
        require(ipfsMetadataHash != bytes32(0), "ClaimRegistry: metadata zero");
        require(policyId != bytes32(0), "ClaimRegistry: policy zero");
        require(requestedPayoutAmount != 0, "ClaimRegistry: payout zero");

        claimId = nextClaimId++;
        _claims[claimId] = ClaimView({
            claimId: claimId,
            domainId: domainId,
            policyId: policyId,
            ipfsMetadataHash: ipfsMetadataHash,
            claimant: msg.sender,
            requestedPayoutAmount: requestedPayoutAmount,
            submittedAt: uint64(block.timestamp),
            state: ClaimState.Submitted,
            finalKind: VoteKind.None,
            finalAmountBps: 0
        });

        emit ClaimSubmitted(claimId, domainId, policyId, msg.sender, requestedPayoutAmount);
    }

    /// @notice Moves a submitted claim into its first voting round.
    /// @param claimId Claim being opened for voting.
    function startVoting(uint256 claimId) external onlyRole(VOTING_ROLE) whenNotPaused {
        ClaimView storage claim = _existingClaim(claimId);
        require(claim.state == ClaimState.Submitted, "ClaimRegistry: not submitted");
        _setState(claim, ClaimState.Voting);
    }

    /// @notice Stores a provisional round result.
    /// @param claimId Claim being resolved provisionally.
    /// @param kind Provisional outcome.
    /// @param amountBps Partial payout basis points, or zero for approve/deny.
    function markResolved(uint256 claimId, VoteKind kind, uint16 amountBps)
        external
        onlyRole(VOTING_ROLE)
        whenNotPaused
    {
        _validateOutcome(kind, amountBps);
        ClaimView storage claim = _existingClaim(claimId);
        require(
            claim.state == ClaimState.Voting || claim.state == ClaimState.Escalated,
            "ClaimRegistry: not voting"
        );
        claim.finalKind = kind;
        claim.finalAmountBps = amountBps;
        if (claim.state == ClaimState.Voting) {
            _setState(claim, ClaimState.Resolved);
        }
        emit ClaimOutcomeUpdated(claimId, kind, amountBps, false);
    }

    /// @notice Marks a provisionally resolved claim as challenged into arbiter escalation.
    /// @param claimId Claim being escalated.
    function markEscalated(uint256 claimId) external onlyRole(VOTING_ROLE) whenNotPaused {
        ClaimView storage claim = _existingClaim(claimId);
        require(
            claim.state == ClaimState.Resolved || claim.state == ClaimState.Escalated,
            "ClaimRegistry: not resolved"
        );
        if (claim.state == ClaimState.Resolved) {
            _setState(claim, ClaimState.Escalated);
        }
    }

    /// @notice Marks the binding final claim result.
    /// @param claimId Claim being finalized.
    /// @param kind Final outcome.
    /// @param amountBps Partial payout basis points, or zero for approve/deny.
    function markFinalResolved(uint256 claimId, VoteKind kind, uint16 amountBps)
        external
        onlyRole(VOTING_ROLE)
        whenNotPaused
    {
        _validateOutcome(kind, amountBps);
        ClaimView storage claim = _existingClaim(claimId);
        require(
            claim.state == ClaimState.Resolved || claim.state == ClaimState.Escalated,
            "ClaimRegistry: not finalizable"
        );
        claim.finalKind = kind;
        claim.finalAmountBps = amountBps;
        _setState(claim, ClaimState.FinalResolved);
        emit ClaimOutcomeUpdated(claimId, kind, amountBps, true);
    }

    /// @notice Returns the full claim view.
    /// @param claimId Claim id.
    /// @return Claim metadata and lifecycle fields.
    function getClaim(uint256 claimId) external view returns (ClaimView memory) {
        ClaimView memory claim = _claims[claimId];
        require(claim.claimId != 0, "ClaimRegistry: unknown claim");
        return claim;
    }

    /// @notice Returns the current claim state.
    /// @param claimId Claim id.
    /// @return Current lifecycle state.
    function stateOf(uint256 claimId) external view returns (ClaimState) {
        return _claims[claimId].state;
    }

    /// @notice Returns the final or latest provisional outcome stored for a claim.
    /// @param claimId Claim id.
    /// @return kind Outcome kind.
    /// @return amountBps Partial payout basis points.
    function finalOutcome(uint256 claimId) external view returns (VoteKind kind, uint16 amountBps) {
        ClaimView memory claim = _claims[claimId];
        require(claim.claimId != 0, "ClaimRegistry: unknown claim");
        return (claim.finalKind, claim.finalAmountBps);
    }

    function _setState(ClaimView storage claim, ClaimState toState) private {
        ClaimState fromState = claim.state;
        claim.state = toState;
        emit ClaimStateChanged(claim.claimId, fromState, toState);
    }

    function _existingClaim(uint256 claimId) private view returns (ClaimView storage claim) {
        claim = _claims[claimId];
        require(claim.claimId != 0, "ClaimRegistry: unknown claim");
    }

    function _validateOutcome(VoteKind kind, uint16 amountBps) private pure {
        require(kind == VoteKind.Approve || kind == VoteKind.Deny || kind == VoteKind.Partial, "ClaimRegistry: bad kind");
        if (kind == VoteKind.Partial) {
            require(amountBps > 0 && amountBps < 10_000, "ClaimRegistry: bad partial");
        } else {
            require(amountBps == 0, "ClaimRegistry: bad bps");
        }
    }
}
