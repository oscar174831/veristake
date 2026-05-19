// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

interface IVerifierStaking {
    function registerDomainPool(uint256 domainId, uint128 amount) external;
    function requestUnstake(uint256 domainId, uint128 amount) external;
    function setDomainCredential(address verifier, uint256 domainId, bool approved) external;
    function lockClaimBond(address verifier, uint256 claimId, uint256 domainId, uint128 amount) external;
    function unlockClaimBond(address verifier, uint256 claimId, uint128 amount) external;
    function slashClaimBond(address verifier, uint256 claimId, uint128 amount, address recipient) external;
    function isRegistered(address verifier, uint256 domainId) external view returns (bool);
    function availableStake(address verifier, uint256 domainId) external view returns (uint256);
    function claimBond(uint256 claimId, address verifier) external view returns (uint128);
    function totalStaked() external view returns (uint256);
    function totalBondedForClaim(uint256 claimId) external view returns (uint256);
}
