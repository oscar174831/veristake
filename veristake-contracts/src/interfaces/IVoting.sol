// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { IVeristakeTypes } from "./IVeristakeTypes.sol";

interface IVoting is IVeristakeTypes {
    function commitVote(uint256 claimId, bytes32 commitHash) external;
    function revealVote(uint256 claimId, VoteKind kind, uint16 amountBps, bytes32 salt) external;
    function batchReveal(
        uint256[] calldata claimIds,
        VoteKind[] calldata kinds,
        uint16[] calldata amountBps,
        bytes32[] calldata salts
    ) external;
    function resolveClaim(uint256 claimId) external;
    function openAppealRound(uint256 claimId, uint128 claimBond) external;
    function finalizeClaim(uint256 claimId) external;
    function currentRound(uint256 claimId) external view returns (uint8);
    function roundResult(uint256 claimId, uint8 round) external view returns (RoundResult memory);
    function getReveal(uint256 claimId, uint8 round, address verifier)
        external
        view
        returns (RevealedVote memory);
    function voterAt(uint256 claimId, uint8 round, uint256 index) external view returns (address);
    function voterCount(uint256 claimId, uint8 round) external view returns (uint256);
    function roundChallengeDeadline(uint256 claimId, uint8 round) external view returns (uint64);
    function isRoundResolved(uint256 claimId, uint8 round) external view returns (bool);
    function claimBondAmount(uint256 claimId, uint8 round) external view returns (uint128);
}
