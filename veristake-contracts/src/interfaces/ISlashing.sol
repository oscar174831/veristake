// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

interface ISlashing {
    function executeSlashing(uint256 claimId) external;
    function hasExecuted(uint256 claimId) external view returns (bool);
    function disagrees(uint256 claimId, uint8 round, address verifier) external view returns (bool);
}
