// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

interface IArbiterEscalation {
    function challenge(uint256 claimId) external;
    function challengeBond(uint256 claimId) external view returns (uint256);
    function appealRound(uint256 claimId) external view returns (uint8);
}
