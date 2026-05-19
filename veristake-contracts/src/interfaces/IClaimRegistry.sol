// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { IVeristakeTypes } from "./IVeristakeTypes.sol";

interface IClaimRegistry is IVeristakeTypes {
    function submitClaim(
        uint256 domainId,
        bytes32 ipfsMetadataHash,
        uint128 requestedPayoutAmount,
        bytes32 policyId
    ) external returns (uint256 claimId);

    function startVoting(uint256 claimId) external;
    function markResolved(uint256 claimId, VoteKind kind, uint16 amountBps) external;
    function markEscalated(uint256 claimId) external;
    function markFinalResolved(uint256 claimId, VoteKind kind, uint16 amountBps) external;
    function getClaim(uint256 claimId) external view returns (ClaimView memory);
    function stateOf(uint256 claimId) external view returns (ClaimState);
    function finalOutcome(uint256 claimId) external view returns (VoteKind kind, uint16 amountBps);
}
