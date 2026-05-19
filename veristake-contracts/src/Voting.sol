// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { IClaimRegistry } from "./interfaces/IClaimRegistry.sol";
import { ISoulboundReputation } from "./interfaces/ISoulboundReputation.sol";
import { IVerifierStaking } from "./interfaces/IVerifierStaking.sol";
import { IVoting } from "./interfaces/IVoting.sol";

contract Voting is IVoting, AccessControl, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant PARAMETER_ROLE = keccak256("PARAMETER_ROLE");
    bytes32 public constant ESCALATION_ROLE = keccak256("ESCALATION_ROLE");

    uint64 public constant MIN_WINDOW = 5 minutes;
    uint64 public constant MAX_WINDOW = 14 days;
    uint128 public constant MIN_CLAIM_BOND = 1e18;
    uint128 public constant MAX_CLAIM_BOND = 1_000_000e18;

    IClaimRegistry public immutable registry;
    IVerifierStaking public immutable staking;
    ISoulboundReputation public immutable reputation;

    uint64 public commitWindow = 1 days;
    uint64 public revealWindow = 1 days;
    uint64 public challengeWindow = 2 days;
    uint128 public defaultClaimBond = 100e18;

    struct Round {
        bool opened;
        bool resolved;
        uint64 commitDeadline;
        uint64 revealDeadline;
        uint64 challengeDeadline;
        uint128 bond;
        RoundResult result;
        address[] voters;
        mapping(address => bool) seen;
        mapping(address => bytes32) commits;
        mapping(address => RevealedVote) reveals;
    }

    struct WeightTally {
        uint256 approveWeight;
        uint256 denyWeight;
        uint256 partialWeight;
        uint256 partialWeightedAmount;
        uint256 totalWeight;
    }

    mapping(uint256 => uint8) public override currentRound;
    mapping(uint256 => mapping(uint8 => Round)) private _rounds;
    mapping(uint256 => mapping(address => bool)) public bondReleased;

    event WindowsUpdated(uint64 commitWindow, uint64 revealWindow, uint64 challengeWindow);
    event DefaultClaimBondUpdated(uint128 claimBond);
    event VoteCommitted(uint256 indexed claimId, uint8 indexed round, address indexed verifier);
    event VoteRevealed(
        uint256 indexed claimId,
        uint8 indexed round,
        address indexed verifier,
        VoteKind kind,
        uint16 amountBps
    );
    event ClaimRoundOpened(uint256 indexed claimId, uint8 indexed round, uint128 bond);
    event ClaimRoundResolved(
        uint256 indexed claimId,
        uint8 indexed round,
        VoteKind kind,
        uint16 amountBps,
        uint16 supportBps
    );
    event ClaimFinalized(uint256 indexed claimId, VoteKind kind, uint16 amountBps);

    /// @notice Deploys the commit-reveal voting engine.
    /// @param registry_ Claim registry.
    /// @param staking_ Verifier staking and bond manager.
    /// @param reputation_ Soulbound reputation module.
    /// @param admin Timelock or setup address receiving all initial roles.
    constructor(
        IClaimRegistry registry_,
        IVerifierStaking staking_,
        ISoulboundReputation reputation_,
        address admin
    ) {
        require(address(registry_) != address(0), "Voting: registry zero");
        require(address(staking_) != address(0), "Voting: staking zero");
        require(address(reputation_) != address(0), "Voting: reputation zero");
        require(admin != address(0), "Voting: admin zero");
        registry = registry_;
        staking = staking_;
        reputation = reputation_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(PARAMETER_ROLE, admin);
        _grantRole(ESCALATION_ROLE, admin);
    }

    /// @notice Pauses voting operations.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpauses voting operations.
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Updates voting windows within hardcoded safety bounds.
    /// @param newCommitWindow Commit duration.
    /// @param newRevealWindow Reveal duration.
    /// @param newChallengeWindow Challenge duration.
    function setWindows(uint64 newCommitWindow, uint64 newRevealWindow, uint64 newChallengeWindow)
        external
        onlyRole(PARAMETER_ROLE)
    {
        _validateWindow(newCommitWindow);
        _validateWindow(newRevealWindow);
        _validateWindow(newChallengeWindow);
        commitWindow = newCommitWindow;
        revealWindow = newRevealWindow;
        challengeWindow = newChallengeWindow;
        emit WindowsUpdated(newCommitWindow, newRevealWindow, newChallengeWindow);
    }

    /// @notice Updates the default first-round claim bond within hardcoded bounds.
    /// @param newClaimBond New first-round bond size.
    function setDefaultClaimBond(uint128 newClaimBond) external onlyRole(PARAMETER_ROLE) {
        require(newClaimBond >= MIN_CLAIM_BOND && newClaimBond <= MAX_CLAIM_BOND, "Voting: bad bond");
        defaultClaimBond = newClaimBond;
        emit DefaultClaimBondUpdated(newClaimBond);
    }

    /// @notice Commits a hidden vote hash and locks the round bond.
    /// @param claimId Claim being voted on.
    /// @param commitHash keccak256(abi.encode(voteKind, amountBps, salt)).
    function commitVote(uint256 claimId, bytes32 commitHash) external whenNotPaused {
        require(commitHash != bytes32(0), "Voting: commit zero");
        IClaimRegistry.ClaimView memory claim = registry.getClaim(claimId);
        uint8 roundId = currentRound[claimId];
        if (roundId == 0) {
            require(claim.state == ClaimState.Submitted, "Voting: not submitted");
            registry.startVoting(claimId);
            roundId = 1;
            currentRound[claimId] = roundId;
            _openRound(claimId, roundId, defaultClaimBond);
        } else {
            require(
                claim.state == ClaimState.Voting || claim.state == ClaimState.Escalated,
                "Voting: not voteable"
            );
        }

        Round storage round = _rounds[claimId][roundId];
        require(round.opened, "Voting: round closed");
        require(block.timestamp <= round.commitDeadline, "Voting: commit closed");
        require(round.commits[msg.sender] == bytes32(0), "Voting: already committed");

        staking.lockClaimBond(msg.sender, claimId, claim.domainId, round.bond);
        reputation.ensureAttestation(msg.sender, claim.domainId);
        round.commits[msg.sender] = commitHash;
        if (!round.seen[msg.sender]) {
            round.seen[msg.sender] = true;
            round.voters.push(msg.sender);
        }
        emit VoteCommitted(claimId, roundId, msg.sender);
    }

    /// @notice Reveals a previously committed vote.
    /// @param claimId Claim being voted on.
    /// @param kind Vote kind.
    /// @param amountBps Partial amount basis points, or zero for approve/deny.
    /// @param salt Salt used in the commit hash.
    function revealVote(uint256 claimId, VoteKind kind, uint16 amountBps, bytes32 salt)
        public
        whenNotPaused
    {
        _validateVote(kind, amountBps);
        uint8 roundId = currentRound[claimId];
        require(roundId != 0, "Voting: no round");
        Round storage round = _rounds[claimId][roundId];
        require(block.timestamp > round.commitDeadline, "Voting: reveal not started");
        require(block.timestamp <= round.revealDeadline, "Voting: reveal closed");
        require(!round.reveals[msg.sender].revealed, "Voting: already revealed");
        bytes32 expected = keccak256(abi.encode(kind, amountBps, salt));
        require(round.commits[msg.sender] == expected, "Voting: bad reveal");

        round.reveals[msg.sender] = RevealedVote({
            kind: kind,
            amountBps: amountBps,
            bond: round.bond,
            revealed: true
        });
        emit VoteRevealed(claimId, roundId, msg.sender, kind, amountBps);
    }

    /// @notice Reveals multiple votes in one transaction.
    /// @param claimIds Claim ids.
    /// @param kinds Vote kinds.
    /// @param amountBps Partial amount basis points.
    /// @param salts Commit salts.
    function batchReveal(
        uint256[] calldata claimIds,
        VoteKind[] calldata kinds,
        uint16[] calldata amountBps,
        bytes32[] calldata salts
    ) external {
        uint256 len = claimIds.length;
        require(kinds.length == len && amountBps.length == len && salts.length == len, "Voting: length mismatch");
        for (uint256 i; i < len; ++i) {
            revealVote(claimIds[i], kinds[i], amountBps[i], salts[i]);
        }
    }

    /// @notice Resolves the active round by reputation-weighted plurality.
    /// @param claimId Claim being resolved.
    function resolveClaim(uint256 claimId) external whenNotPaused {
        uint8 roundId = currentRound[claimId];
        require(roundId != 0, "Voting: no round");
        Round storage round = _rounds[claimId][roundId];
        require(block.timestamp > round.revealDeadline, "Voting: reveal active");
        require(!round.resolved, "Voting: resolved");
        IClaimRegistry.ClaimView memory claim = registry.getClaim(claimId);

        (VoteKind kind, uint16 amount, uint16 support) = _computeRoundResult(claim, round);
        round.resolved = true;
        round.challengeDeadline = uint64(block.timestamp) + challengeWindow;
        round.result = RoundResult({ kind: kind, amountBps: amount, supportBps: support, resolved: true });
        registry.markResolved(claimId, kind, amount);
        emit ClaimRoundResolved(claimId, roundId, kind, amount, support);
    }

    /// @notice Opens a doubled-bond appeal round after a successful challenge.
    /// @param claimId Claim entering an arbiter appeal round.
    /// @param claimBond Bond required for each verifier in the new round.
    function openAppealRound(uint256 claimId, uint128 claimBond)
        external
        onlyRole(ESCALATION_ROLE)
        whenNotPaused
    {
        uint8 previousRound = currentRound[claimId];
        require(previousRound != 0, "Voting: no round");
        require(_rounds[claimId][previousRound].resolved, "Voting: unresolved");
        uint8 nextRound = previousRound + 1;
        currentRound[claimId] = nextRound;
        registry.markEscalated(claimId);
        _openRound(claimId, nextRound, claimBond);
    }

    /// @notice Finalizes a resolved, unchallenged round as binding.
    /// @param claimId Claim being finalized.
    function finalizeClaim(uint256 claimId) external whenNotPaused {
        uint8 roundId = currentRound[claimId];
        require(roundId != 0, "Voting: no round");
        Round storage round = _rounds[claimId][roundId];
        require(round.resolved, "Voting: unresolved");
        require(block.timestamp > round.challengeDeadline, "Voting: challenge active");
        IClaimRegistry.ClaimView memory claim = registry.getClaim(claimId);
        require(claim.state == ClaimState.Resolved || claim.state == ClaimState.Escalated, "Voting: bad state");
        registry.markFinalResolved(claimId, round.result.kind, round.result.amountBps);
        if (claim.state == ClaimState.Resolved) {
            _releaseAllBonds(claimId);
        }
        emit ClaimFinalized(claimId, round.result.kind, round.result.amountBps);
    }

    /// @notice Returns the round result for a claim round.
    /// @param claimId Claim id.
    /// @param roundId Round id.
    /// @return Result data.
    function roundResult(uint256 claimId, uint8 roundId) external view returns (RoundResult memory) {
        return _rounds[claimId][roundId].result;
    }

    /// @notice Returns a verifier's revealed vote in a round.
    /// @param claimId Claim id.
    /// @param roundId Round id.
    /// @param verifier Verifier address.
    /// @return Revealed vote data.
    function getReveal(uint256 claimId, uint8 roundId, address verifier)
        external
        view
        returns (RevealedVote memory)
    {
        return _rounds[claimId][roundId].reveals[verifier];
    }

    /// @notice Returns the verifier at a round voter index.
    /// @param claimId Claim id.
    /// @param roundId Round id.
    /// @param index Voter index.
    /// @return Verifier address.
    function voterAt(uint256 claimId, uint8 roundId, uint256 index) external view returns (address) {
        return _rounds[claimId][roundId].voters[index];
    }

    /// @notice Returns the number of voters that committed in a round.
    /// @param claimId Claim id.
    /// @param roundId Round id.
    /// @return Voter count.
    function voterCount(uint256 claimId, uint8 roundId) external view returns (uint256) {
        return _rounds[claimId][roundId].voters.length;
    }

    /// @notice Returns the challenge deadline for a resolved round.
    /// @param claimId Claim id.
    /// @param roundId Round id.
    /// @return Deadline timestamp.
    function roundChallengeDeadline(uint256 claimId, uint8 roundId) external view returns (uint64) {
        return _rounds[claimId][roundId].challengeDeadline;
    }

    /// @notice Returns whether a round has been resolved.
    /// @param claimId Claim id.
    /// @param roundId Round id.
    /// @return True if resolved.
    function isRoundResolved(uint256 claimId, uint8 roundId) external view returns (bool) {
        return _rounds[claimId][roundId].resolved;
    }

    /// @notice Returns the per-verifier claim bond for a round.
    /// @param claimId Claim id.
    /// @param roundId Round id.
    /// @return Bond amount.
    function claimBondAmount(uint256 claimId, uint8 roundId) external view returns (uint128) {
        return _rounds[claimId][roundId].bond;
    }

    function _openRound(uint256 claimId, uint8 roundId, uint128 bond) private {
        require(bond >= MIN_CLAIM_BOND && bond <= MAX_CLAIM_BOND, "Voting: bad appeal bond");
        Round storage round = _rounds[claimId][roundId];
        require(!round.opened, "Voting: round exists");
        round.opened = true;
        round.bond = bond;
        round.commitDeadline = uint64(block.timestamp) + commitWindow;
        round.revealDeadline = round.commitDeadline + revealWindow;
        emit ClaimRoundOpened(claimId, roundId, bond);
    }

    function _computeRoundResult(IClaimRegistry.ClaimView memory claim, Round storage round)
        private
        view
        returns (VoteKind kind, uint16 amountBps, uint16 supportBps)
    {
        WeightTally memory tally = _tallyRoundWeights(claim.domainId, round);
        if (tally.totalWeight == 0) {
            return (VoteKind.Deny, 0, 10_000);
        }

        uint256 winningWeight = tally.approveWeight;
        kind = VoteKind.Approve;
        if (tally.denyWeight > winningWeight) {
            winningWeight = tally.denyWeight;
            kind = VoteKind.Deny;
        }
        if (tally.partialWeight > winningWeight) {
            winningWeight = tally.partialWeight;
            kind = VoteKind.Partial;
            amountBps = uint16(tally.partialWeightedAmount / tally.partialWeight);
        }
        supportBps = uint16((winningWeight * 10_000) / tally.totalWeight);
    }

    function _tallyRoundWeights(uint256 domainId, Round storage round)
        private
        view
        returns (WeightTally memory tally)
    {
        for (uint256 i; i < round.voters.length; ++i) {
            address voter = round.voters[i];
            RevealedVote memory vote = round.reveals[voter];
            if (!vote.revealed) {
                continue;
            }
            uint256 weight = reputation.votingWeight(voter, domainId, vote.bond);
            tally.totalWeight += weight;
            if (vote.kind == VoteKind.Approve) {
                tally.approveWeight += weight;
            } else if (vote.kind == VoteKind.Deny) {
                tally.denyWeight += weight;
            } else {
                tally.partialWeight += weight;
                tally.partialWeightedAmount += weight * vote.amountBps;
            }
        }
    }

    function _releaseAllBonds(uint256 claimId) private {
        uint8 maxRound = currentRound[claimId];
        for (uint8 roundId = 1; roundId <= maxRound; ++roundId) {
            Round storage round = _rounds[claimId][roundId];
            for (uint256 i; i < round.voters.length; ++i) {
                address voter = round.voters[i];
                if (!bondReleased[claimId][voter]) {
                    uint128 bond = staking.claimBond(claimId, voter);
                    if (bond != 0) {
                        bondReleased[claimId][voter] = true;
                        staking.unlockClaimBond(voter, claimId, bond);
                    }
                }
            }
        }
    }

    function _validateVote(VoteKind kind, uint16 amountBps) private pure {
        require(kind == VoteKind.Approve || kind == VoteKind.Deny || kind == VoteKind.Partial, "Voting: bad kind");
        if (kind == VoteKind.Partial) {
            require(amountBps > 0 && amountBps < 10_000, "Voting: bad partial");
        } else {
            require(amountBps == 0, "Voting: bad bps");
        }
    }

    function _validateWindow(uint64 window_) private pure {
        require(window_ >= MIN_WINDOW && window_ <= MAX_WINDOW, "Voting: bad window");
    }
}
