// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IClaimRegistry } from "./interfaces/IClaimRegistry.sol";
import { ISlashing } from "./interfaces/ISlashing.sol";
import { ISoulboundReputation } from "./interfaces/ISoulboundReputation.sol";
import { IVeristakeTypes } from "./interfaces/IVeristakeTypes.sol";
import { IVerifierStaking } from "./interfaces/IVerifierStaking.sol";
import { IVoting } from "./interfaces/IVoting.sol";
import { VST } from "./VST.sol";

contract Slashing is ISlashing, IVeristakeTypes, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant PARAMETER_ROLE = keccak256("PARAMETER_ROLE");

    uint16 public constant BPS = 10_000;
    uint16 public constant MIN_TOLERANCE_BPS = 0;
    uint16 public constant MAX_TOLERANCE_BPS = 5_000;
    uint16 public constant MIN_SUPERMAJORITY_BPS = 5_001;
    uint16 public constant MAX_SUPERMAJORITY_BPS = 10_000;
    uint16 public constant MIN_SLASH_BPS = 0;
    uint16 public constant MAX_SLASH_BPS = 10_000;

    VST public immutable vst;
    IClaimRegistry public immutable registry;
    IVerifierStaking public immutable staking;
    IVoting public immutable voting;
    ISoulboundReputation public immutable reputation;
    address public treasury;

    uint16 public disagreementToleranceBps = 2_000;
    uint16 public supermajorityBps = 7_500;
    uint16 public slashBps = 5_000;
    uint16 public verifierSplitBps = 6_000;
    uint16 public treasurySplitBps = 3_000;
    uint16 public burnSplitBps = 1_000;

    mapping(uint256 => bool) public override hasExecuted;
    mapping(uint256 => mapping(address => bool)) public processedVerifier;

    struct SlashContext {
        uint256 claimId;
        uint256 domainId;
        uint8 finalRound;
        VoteKind finalKind;
        uint16 finalAmountBps;
        bool canSlash;
    }

    event SlashingParametersUpdated(uint16 toleranceBps, uint16 supermajorityBps, uint16 slashBps);
    event SlashedPoolSplitUpdated(uint16 verifierSplitBps, uint16 treasurySplitBps, uint16 burnSplitBps);
    event TreasuryUpdated(address treasury);
    event ClaimSlashingExecuted(uint256 indexed claimId, uint256 slashedPool, uint256 verifierRewards);

    /// @notice Deploys slashing and contrarian reward distribution.
    /// @param vst_ VST token.
    /// @param registry_ Claim registry.
    /// @param staking_ Staking contract.
    /// @param voting_ Voting contract.
    /// @param reputation_ Reputation contract.
    /// @param treasury_ Treasury address.
    /// @param admin Timelock or setup address receiving all initial roles.
    constructor(
        VST vst_,
        IClaimRegistry registry_,
        IVerifierStaking staking_,
        IVoting voting_,
        ISoulboundReputation reputation_,
        address treasury_,
        address admin
    ) {
        require(address(vst_) != address(0), "Slashing: token zero");
        require(address(registry_) != address(0), "Slashing: registry zero");
        require(address(staking_) != address(0), "Slashing: staking zero");
        require(address(voting_) != address(0), "Slashing: voting zero");
        require(address(reputation_) != address(0), "Slashing: reputation zero");
        require(treasury_ != address(0), "Slashing: treasury zero");
        require(admin != address(0), "Slashing: admin zero");
        vst = vst_;
        registry = registry_;
        staking = staking_;
        voting = voting_;
        reputation = reputation_;
        treasury = treasury_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PARAMETER_ROLE, admin);
    }

    /// @notice Updates the treasury receiving the treasury split of slashed VST.
    /// @param newTreasury New treasury address.
    function setTreasury(address newTreasury) external onlyRole(PARAMETER_ROLE) {
        require(newTreasury != address(0), "Slashing: treasury zero");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /// @notice Updates slashing thresholds within hardcoded bounds.
    /// @param toleranceBps Disagreement tolerance for partial votes.
    /// @param majorityBps Final-round supermajority required before slashing.
    /// @param newSlashBps Percent of claim bond slashed.
    function setSlashingParameters(uint16 toleranceBps, uint16 majorityBps, uint16 newSlashBps)
        external
        onlyRole(PARAMETER_ROLE)
    {
        require(toleranceBps <= MAX_TOLERANCE_BPS, "Slashing: bad tolerance");
        require(
            majorityBps >= MIN_SUPERMAJORITY_BPS && majorityBps <= MAX_SUPERMAJORITY_BPS,
            "Slashing: bad majority"
        );
        require(newSlashBps <= MAX_SLASH_BPS, "Slashing: bad slash");
        disagreementToleranceBps = toleranceBps;
        supermajorityBps = majorityBps;
        slashBps = newSlashBps;
        emit SlashingParametersUpdated(toleranceBps, majorityBps, newSlashBps);
    }

    /// @notice Updates slashed-pool splits; total must equal 100%.
    /// @param newVerifierSplitBps Split to correct verifiers.
    /// @param newTreasurySplitBps Split to treasury.
    /// @param newBurnSplitBps Split burned.
    function setSlashedPoolSplit(
        uint16 newVerifierSplitBps,
        uint16 newTreasurySplitBps,
        uint16 newBurnSplitBps
    ) external onlyRole(PARAMETER_ROLE) {
        require(
            uint256(newVerifierSplitBps) + newTreasurySplitBps + newBurnSplitBps == BPS,
            "Slashing: split sum"
        );
        verifierSplitBps = newVerifierSplitBps;
        treasurySplitBps = newTreasurySplitBps;
        burnSplitBps = newBurnSplitBps;
        emit SlashedPoolSplitUpdated(newVerifierSplitBps, newTreasurySplitBps, newBurnSplitBps);
    }

    /// @notice Executes final slashing, contrarian rewards, and remaining-bond release.
    /// @param claimId Finalized claim id.
    function executeSlashing(uint256 claimId) external {
        require(!hasExecuted[claimId], "Slashing: executed");
        IClaimRegistry.ClaimView memory claim = registry.getClaim(claimId);
        require(claim.state == ClaimState.FinalResolved, "Slashing: not final");
        hasExecuted[claimId] = true;

        uint8 finalRound = voting.currentRound(claimId);
        RoundResult memory finalResult = voting.roundResult(claimId, finalRound);
        bool canSlash = finalResult.supportBps >= supermajorityBps;

        address[] memory unique = _uniqueVoters(claimId, finalRound);
        uint256[] memory weights = new uint256[](unique.length);
        SlashContext memory ctx = SlashContext({
            claimId: claimId,
            domainId: claim.domainId,
            finalRound: finalRound,
            finalKind: claim.finalKind,
            finalAmountBps: claim.finalAmountBps,
            canSlash: canSlash
        });

        (uint256 slashedPool, uint256 rewardWeight) = _processVoters(ctx, unique, weights);
        uint256 verifierRewards = _distributeSlashedPool(unique, weights, slashedPool, rewardWeight);
        _releaseRemainingBonds(claimId, unique);

        emit ClaimSlashingExecuted(claimId, slashedPool, verifierRewards);
    }

    /// @notice Returns whether a verifier's latest revealed vote disagrees with the final outcome.
    /// @param claimId Claim id.
    /// @param roundId Round id to inspect.
    /// @param verifier Verifier address.
    /// @return True if the vote differs beyond tolerance.
    function disagrees(uint256 claimId, uint8 roundId, address verifier) external view returns (bool) {
        IClaimRegistry.ClaimView memory claim = registry.getClaim(claimId);
        RevealedVote memory vote = voting.getReveal(claimId, roundId, verifier);
        return _voteDisagrees(vote, claim.finalKind, claim.finalAmountBps);
    }

    function _processVoters(SlashContext memory ctx, address[] memory unique, uint256[] memory weights)
        private
        returns (uint256 slashedPool, uint256 rewardWeight)
    {
        for (uint256 i; i < unique.length; ++i) {
            address verifier = unique[i];
            if (verifier == address(0)) {
                continue;
            }
            bool incorrect = _disagreesLatest(
                ctx.claimId,
                ctx.finalRound,
                verifier,
                ctx.finalKind,
                ctx.finalAmountBps
            );
            reputation.updateAccuracy(verifier, ctx.domainId, !incorrect);
            if (ctx.canSlash && incorrect) {
                slashedPool += _slashVerifier(ctx.claimId, verifier);
            } else {
                uint256 weight = reputation.accuracyBps(verifier, ctx.domainId);
                if (
                    _wasEarlierContrarian(
                        ctx.claimId,
                        ctx.finalRound,
                        verifier,
                        ctx.finalKind,
                        ctx.finalAmountBps
                    )
                ) {
                    weight *= 2;
                }
                weights[i] = weight;
                rewardWeight += weight;
            }
        }
    }

    function _slashVerifier(uint256 claimId, address verifier) private returns (uint256 slashAmount) {
        uint128 bond = staking.claimBond(claimId, verifier);
        slashAmount = (uint256(bond) * slashBps) / BPS;
        if (slashAmount != 0) {
            staking.slashClaimBond(verifier, claimId, uint128(slashAmount), address(this));
        }
    }

    function _distributeSlashedPool(
        address[] memory unique,
        uint256[] memory weights,
        uint256 slashedPool,
        uint256 rewardWeight
    ) private returns (uint256 verifierRewards) {
        verifierRewards = (slashedPool * verifierSplitBps) / BPS;
        uint256 treasuryAmount = (slashedPool * treasurySplitBps) / BPS;
        uint256 burnAmount = (slashedPool * burnSplitBps) / BPS;

        if (treasuryAmount != 0) {
            IERC20(address(vst)).safeTransfer(treasury, treasuryAmount);
        }
        if (burnAmount != 0) {
            vst.burn(burnAmount);
        }
        if (verifierRewards != 0 && rewardWeight != 0) {
            _payVerifierRewards(unique, weights, verifierRewards, rewardWeight);
        }
    }

    function _payVerifierRewards(
        address[] memory unique,
        uint256[] memory weights,
        uint256 verifierRewards,
        uint256 rewardWeight
    ) private {
        for (uint256 i; i < unique.length; ++i) {
            if (weights[i] == 0) {
                continue;
            }
            uint256 reward = (verifierRewards * weights[i]) / rewardWeight;
            if (reward != 0) {
                IERC20(address(vst)).safeTransfer(unique[i], reward);
            }
        }
    }

    function _releaseRemainingBonds(uint256 claimId, address[] memory unique) private {
        for (uint256 i; i < unique.length; ++i) {
            address verifier = unique[i];
            if (verifier == address(0)) {
                continue;
            }
            uint128 remaining = staking.claimBond(claimId, verifier);
            if (remaining != 0) {
                staking.unlockClaimBond(verifier, claimId, remaining);
            }
        }
    }

    function _uniqueVoters(uint256 claimId, uint8 finalRound) private view returns (address[] memory unique) {
        uint256 total;
        for (uint8 roundId = 1; roundId <= finalRound; ++roundId) {
            total += voting.voterCount(claimId, roundId);
        }
        unique = new address[](total);
        uint256 uniqueCount;
        for (uint8 roundId = 1; roundId <= finalRound; ++roundId) {
            uint256 count = voting.voterCount(claimId, roundId);
            for (uint256 i; i < count; ++i) {
                address voter = voting.voterAt(claimId, roundId, i);
                bool seen;
                for (uint256 j; j < uniqueCount; ++j) {
                    if (unique[j] == voter) {
                        seen = true;
                        break;
                    }
                }
                if (!seen) {
                    unique[uniqueCount++] = voter;
                }
            }
        }
    }

    function _disagreesLatest(
        uint256 claimId,
        uint8 finalRound,
        address verifier,
        VoteKind finalKind,
        uint16 finalAmountBps
    ) private view returns (bool) {
        for (uint8 roundId = finalRound; roundId >= 1; --roundId) {
            RevealedVote memory vote = voting.getReveal(claimId, roundId, verifier);
            if (vote.revealed) {
                return _voteDisagrees(vote, finalKind, finalAmountBps);
            }
            if (roundId == 1) {
                break;
            }
        }
        return true;
    }

    function _wasEarlierContrarian(
        uint256 claimId,
        uint8 finalRound,
        address verifier,
        VoteKind finalKind,
        uint16 finalAmountBps
    ) private view returns (bool) {
        if (finalRound <= 1) {
            return false;
        }
        for (uint8 roundId = 1; roundId < finalRound; ++roundId) {
            RevealedVote memory vote = voting.getReveal(claimId, roundId, verifier);
            if (!vote.revealed || _voteDisagrees(vote, finalKind, finalAmountBps)) {
                continue;
            }
            RoundResult memory result = voting.roundResult(claimId, roundId);
            if (_voteDisagrees(vote, result.kind, result.amountBps)) {
                return true;
            }
        }
        return false;
    }

    function _voteDisagrees(RevealedVote memory vote, VoteKind finalKind, uint16 finalAmountBps)
        private
        view
        returns (bool)
    {
        if (!vote.revealed || vote.kind != finalKind) {
            return true;
        }
        if (finalKind == VoteKind.Partial) {
            uint256 a = vote.amountBps;
            uint256 b = finalAmountBps;
            uint256 diff = a > b ? a - b : b - a;
            return diff > disagreementToleranceBps;
        }
        return false;
    }
}
