// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ICarrierGateway } from "./interfaces/ICarrierGateway.sol";
import { IClaimRegistry } from "./interfaces/IClaimRegistry.sol";
import { IVeristakeTypes } from "./interfaces/IVeristakeTypes.sol";

contract CarrierGateway is ICarrierGateway, IVeristakeTypes, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant CARRIER_ADMIN_ROLE = keccak256("CARRIER_ADMIN_ROLE");

    IClaimRegistry public immutable registry;

    struct Carrier {
        bool registered;
        bytes32 licenseHash;
    }

    struct Policy {
        bool registered;
        address carrierAdmin;
        uint256 domainId;
        uint128 coverageLimit;
        IERC20 payoutToken;
        uint128 reserve;
    }

    mapping(address => Carrier) public carriers;
    mapping(bytes32 => Policy) public policies;
    mapping(uint256 => bool) public payoutReleased;

    event CarrierRegistered(address indexed carrierAdmin, bytes32 carrierLicenseHash);
    event PolicyRegistered(
        bytes32 indexed policyId,
        address indexed carrierAdmin,
        uint256 indexed domainId,
        uint128 coverageLimit,
        address payoutToken
    );
    event PayoutReserveFunded(bytes32 indexed policyId, uint128 amount);
    event PayoutReleased(uint256 indexed claimId, bytes32 indexed policyId, address indexed claimant, uint256 amount);

    /// @notice Deploys the licensed-carrier gateway and payout escrow.
    /// @param registry_ Claim registry used to read final claim outcomes.
    /// @param admin Timelock or setup address receiving all initial roles.
    constructor(IClaimRegistry registry_, address admin) {
        require(address(registry_) != address(0), "CarrierGateway: registry zero");
        require(admin != address(0), "CarrierGateway: admin zero");
        registry = registry_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CARRIER_ADMIN_ROLE, admin);
    }

    /// @notice Registers a licensed carrier admin by hashed off-chain license evidence.
    /// @param carrierAdmin Carrier admin address.
    /// @param carrierLicenseHash Hash of off-chain license documentation.
    function registerCarrier(address carrierAdmin, bytes32 carrierLicenseHash)
        external
        onlyRole(CARRIER_ADMIN_ROLE)
    {
        require(carrierAdmin != address(0), "CarrierGateway: carrier zero");
        require(carrierLicenseHash != bytes32(0), "CarrierGateway: license zero");
        carriers[carrierAdmin] = Carrier({ registered: true, licenseHash: carrierLicenseHash });
        emit CarrierRegistered(carrierAdmin, carrierLicenseHash);
    }

    /// @notice Registers a carrier policy template that claims can reference.
    /// @param policyId Carrier-defined policy id.
    /// @param domainId Verification domain used for related claims.
    /// @param coverageLimit Maximum payout per claim.
    /// @param payoutToken Token used for payouts from the carrier-funded reserve.
    function registerPolicy(
        bytes32 policyId,
        uint256 domainId,
        uint128 coverageLimit,
        address payoutToken
    ) external {
        require(carriers[msg.sender].registered, "CarrierGateway: not carrier");
        require(policyId != bytes32(0), "CarrierGateway: policy zero");
        require(!policies[policyId].registered, "CarrierGateway: policy exists");
        require(domainId != 0, "CarrierGateway: domain zero");
        require(coverageLimit != 0, "CarrierGateway: coverage zero");
        require(payoutToken != address(0), "CarrierGateway: token zero");
        policies[policyId] = Policy({
            registered: true,
            carrierAdmin: msg.sender,
            domainId: domainId,
            coverageLimit: coverageLimit,
            payoutToken: IERC20(payoutToken),
            reserve: 0
        });
        emit PolicyRegistered(policyId, msg.sender, domainId, coverageLimit, payoutToken);
    }

    /// @notice Funds a carrier policy payout reserve.
    /// @param policyId Policy id.
    /// @param amount Amount of payout token to escrow.
    function fundPayoutReserve(bytes32 policyId, uint128 amount) external nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.registered, "CarrierGateway: unknown policy");
        require(msg.sender == policy.carrierAdmin, "CarrierGateway: not policy admin");
        require(amount != 0, "CarrierGateway: amount zero");
        policy.reserve += amount;
        policy.payoutToken.safeTransferFrom(msg.sender, address(this), amount);
        emit PayoutReserveFunded(policyId, amount);
    }

    /// @notice Releases an approved or partial final claim payout from carrier escrow.
    /// @param claimId Finalized claim id.
    /// @return amount Amount released to the claimant.
    function releasePayout(uint256 claimId) external nonReentrant returns (uint256 amount) {
        require(!payoutReleased[claimId], "CarrierGateway: already released");
        IClaimRegistry.ClaimView memory claim = registry.getClaim(claimId);
        require(claim.state == ClaimState.FinalResolved, "CarrierGateway: not final");
        Policy storage policy = policies[claim.policyId];
        require(policy.registered, "CarrierGateway: unknown policy");
        require(policy.domainId == claim.domainId, "CarrierGateway: domain mismatch");

        if (claim.finalKind == VoteKind.Approve) {
            amount = claim.requestedPayoutAmount;
        } else if (claim.finalKind == VoteKind.Partial) {
            amount = (uint256(claim.requestedPayoutAmount) * claim.finalAmountBps) / 10_000;
        } else {
            payoutReleased[claimId] = true;
            emit PayoutReleased(claimId, claim.policyId, claim.claimant, 0);
            return 0;
        }

        require(amount <= policy.coverageLimit, "CarrierGateway: over coverage");
        require(amount <= policy.reserve, "CarrierGateway: reserve shortfall");
        payoutReleased[claimId] = true;
        policy.reserve -= uint128(amount);
        policy.payoutToken.safeTransfer(claim.claimant, amount);
        emit PayoutReleased(claimId, claim.policyId, claim.claimant, amount);
    }

    /// @notice Returns the current payout reserve for a policy.
    /// @param policyId Policy id.
    /// @return Reserve amount.
    function payoutReserve(bytes32 policyId) external view returns (uint256) {
        return policies[policyId].reserve;
    }
}
