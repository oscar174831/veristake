// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

interface IVeristakeTypes {
    enum ClaimState {
        None,
        Submitted,
        Voting,
        Resolved,
        Escalated,
        FinalResolved
    }

    enum VoteKind {
        None,
        Approve,
        Deny,
        Partial
    }

    struct ClaimView {
        uint256 claimId;
        uint256 domainId;
        bytes32 policyId;
        bytes32 ipfsMetadataHash;
        address claimant;
        uint128 requestedPayoutAmount;
        uint64 submittedAt;
        ClaimState state;
        VoteKind finalKind;
        uint16 finalAmountBps;
    }

    struct RevealedVote {
        VoteKind kind;
        uint16 amountBps;
        uint128 bond;
        bool revealed;
    }

    struct RoundResult {
        VoteKind kind;
        uint16 amountBps;
        uint16 supportBps;
        bool resolved;
    }
}
