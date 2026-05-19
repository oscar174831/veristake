// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IArbiterEscalation } from "./interfaces/IArbiterEscalation.sol";
import { IClaimRegistry } from "./interfaces/IClaimRegistry.sol";
import { IVeristakeTypes } from "./interfaces/IVeristakeTypes.sol";
import { IVoting } from "./interfaces/IVoting.sol";

contract ArbiterEscalation is IArbiterEscalation, IVeristakeTypes, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant PARAMETER_ROLE = keccak256("PARAMETER_ROLE");

    uint8 public constant MIN_APPEALS = 1;
    uint8 public constant MAX_APPEALS_BOUND = 5;

    IERC20 public immutable vst;
    IClaimRegistry public immutable registry;
    IVoting public immutable voting;

    uint8 public maxAppeals = 3;

    mapping(uint256 => uint8) public override appealRound;
    mapping(uint256 => uint256) public challengeBondPaid;

    event MaxAppealsUpdated(uint8 maxAppeals);
    event ClaimChallenged(uint256 indexed claimId, address indexed challenger, uint8 appealRound, uint256 bond);

    /// @notice Deploys the appeal/challenge coordinator.
    /// @param vst_ VST token used for challenge bonds.
    /// @param registry_ Claim registry.
    /// @param voting_ Voting engine.
    /// @param admin Timelock or setup address receiving all initial roles.
    constructor(IERC20 vst_, IClaimRegistry registry_, IVoting voting_, address admin) {
        require(address(vst_) != address(0), "ArbiterEscalation: token zero");
        require(address(registry_) != address(0), "ArbiterEscalation: registry zero");
        require(address(voting_) != address(0), "ArbiterEscalation: voting zero");
        require(admin != address(0), "ArbiterEscalation: admin zero");
        vst = vst_;
        registry = registry_;
        voting = voting_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PARAMETER_ROLE, admin);
    }

    /// @notice Updates the maximum number of appeal rounds within hardcoded bounds.
    /// @param newMaxAppeals New maximum appeals.
    function setMaxAppeals(uint8 newMaxAppeals) external onlyRole(PARAMETER_ROLE) {
        require(newMaxAppeals >= MIN_APPEALS && newMaxAppeals <= MAX_APPEALS_BOUND, "ArbiterEscalation: bad max");
        maxAppeals = newMaxAppeals;
        emit MaxAppealsUpdated(newMaxAppeals);
    }

    /// @notice Challenges a provisional result and opens the next doubled-bond appeal round.
    /// @param claimId Claim being challenged.
    function challenge(uint256 claimId) external {
        IClaimRegistry.ClaimView memory claim = registry.getClaim(claimId);
        require(
            claim.state == ClaimState.Resolved || claim.state == ClaimState.Escalated,
            "ArbiterEscalation: not challengeable"
        );
        uint8 roundId = voting.currentRound(claimId);
        require(voting.isRoundResolved(claimId, roundId), "ArbiterEscalation: unresolved");
        require(block.timestamp <= voting.roundChallengeDeadline(claimId, roundId), "ArbiterEscalation: window closed");
        require(appealRound[claimId] < maxAppeals, "ArbiterEscalation: max appeals");

        uint256 bond = challengeBond(claimId);
        challengeBondPaid[claimId] += bond;
        appealRound[claimId] += 1;
        vst.safeTransferFrom(msg.sender, address(this), bond);
        voting.openAppealRound(claimId, uint128(bond));
        emit ClaimChallenged(claimId, msg.sender, appealRound[claimId], bond);
    }

    /// @notice Returns the bond required to challenge the active resolved round.
    /// @param claimId Claim id.
    /// @return Required challenge bond.
    function challengeBond(uint256 claimId) public view returns (uint256) {
        uint8 roundId = voting.currentRound(claimId);
        uint256 currentBond = voting.claimBondAmount(claimId, roundId);
        return currentBond * 2;
    }
}
