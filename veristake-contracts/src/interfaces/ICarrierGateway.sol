// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

interface ICarrierGateway {
    function registerCarrier(address carrierAdmin, bytes32 carrierLicenseHash) external;
    function registerPolicy(
        bytes32 policyId,
        uint256 domainId,
        uint128 coverageLimit,
        address payoutToken
    ) external;
    function fundPayoutReserve(bytes32 policyId, uint128 amount) external;
    function releasePayout(uint256 claimId) external returns (uint256 amount);
    function payoutReserve(bytes32 policyId) external view returns (uint256);
}
