// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

interface ISoulboundReputation {
    function ensureAttestation(address verifier, uint256 domainId) external returns (uint256 tokenId);
    function updateAccuracy(address verifier, uint256 domainId, bool correct) external;
    function accuracyBps(address verifier, uint256 domainId) external view returns (uint16);
    function votingWeight(address verifier, uint256 domainId, uint256 stakeAmount)
        external
        view
        returns (uint256);
}
