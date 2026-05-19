// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ArbiterEscalation } from "../src/ArbiterEscalation.sol";
import { CarrierGateway } from "../src/CarrierGateway.sol";
import { ClaimRegistry } from "../src/ClaimRegistry.sol";
import { Slashing } from "../src/Slashing.sol";
import { SoulboundReputation } from "../src/SoulboundReputation.sol";
import { VerifierStaking } from "../src/VerifierStaking.sol";
import { Voting } from "../src/Voting.sol";
import { VST } from "../src/VST.sol";
import { IVeristakeTypes } from "../src/interfaces/IVeristakeTypes.sol";

abstract contract VeristakeTestBase is Test, IVeristakeTypes {
    uint256 internal constant DOMAIN = 1;
    bytes32 internal constant POLICY = bytes32(uint256(0xA11CE));
    bytes32 internal constant LICENSE_HASH = bytes32(uint256(0xBEEF));
    bytes32 internal constant METADATA = bytes32(uint256(0xCAFE));
    uint128 internal constant COVERAGE = 10_000e18;
    uint128 internal constant REQUESTED = 1_000e18;
    uint256 internal constant VST_CAP = 1_000_000_000e18;

    address internal treasury = address(0x7777);
    address internal carrier = address(0xCA22);
    address internal claimant = address(0xC1A1);
    address internal challenger = address(0xC4A11);
    address[10] internal verifiers;

    VST internal vst;
    ClaimRegistry internal registry;
    SoulboundReputation internal reputation;
    VerifierStaking internal staking;
    Voting internal voting;
    CarrierGateway internal gateway;
    ArbiterEscalation internal arbiter;
    Slashing internal slashing;

    function setUp() public virtual {
        for (uint256 i; i < verifiers.length; ++i) {
            verifiers[i] = address(uint160(0x1000 + i));
        }

        vst = new VST(address(this), VST_CAP, address(this), 20_000_000e18);
        registry = new ClaimRegistry(address(this));
        reputation = new SoulboundReputation(address(this));
        staking = new VerifierStaking(vst, address(this));
        voting = new Voting(registry, staking, reputation, address(this));
        gateway = new CarrierGateway(registry, address(this));
        arbiter = new ArbiterEscalation(vst, registry, voting, address(this));
        slashing = new Slashing(vst, registry, staking, voting, reputation, treasury, address(this));

        registry.grantRole(registry.VOTING_ROLE(), address(voting));
        staking.grantRole(staking.BOND_MANAGER_ROLE(), address(voting));
        staking.grantRole(staking.BOND_MANAGER_ROLE(), address(slashing));
        staking.grantRole(staking.SLASHER_ROLE(), address(slashing));
        voting.grantRole(voting.ESCALATION_ROLE(), address(arbiter));
        reputation.grantRole(reputation.UPDATER_ROLE(), address(slashing));

        gateway.registerCarrier(carrier, LICENSE_HASH);
        vst.transfer(carrier, 100_000e18);
        vm.startPrank(carrier);
        gateway.registerPolicy(POLICY, DOMAIN, COVERAGE, address(vst));
        vst.approve(address(gateway), type(uint256).max);
        gateway.fundPayoutReserve(POLICY, 50_000e18);
        vm.stopPrank();

        vst.transfer(challenger, 20_000e18);
        vm.prank(challenger);
        vst.approve(address(arbiter), type(uint256).max);
    }

    function _setupVerifier(address verifier, uint128 stakeAmount) internal {
        staking.setDomainCredential(verifier, DOMAIN, true);
        vst.transfer(verifier, stakeAmount);
        vm.startPrank(verifier);
        vst.approve(address(staking), type(uint256).max);
        staking.registerDomainPool(DOMAIN, stakeAmount);
        vm.stopPrank();
    }

    function _setupVerifiers(uint256 count, uint128 stakeAmount) internal {
        for (uint256 i; i < count; ++i) {
            _setupVerifier(verifiers[i], stakeAmount);
        }
    }

    function _submitClaim() internal returns (uint256 claimId) {
        vm.prank(claimant);
        claimId = registry.submitClaim(DOMAIN, METADATA, REQUESTED, POLICY);
    }

    function _commit(address verifier, uint256 claimId, VoteKind kind, uint16 amountBps, bytes32 salt)
        internal
    {
        bytes32 commitHash = keccak256(abi.encode(kind, amountBps, salt));
        vm.prank(verifier);
        voting.commitVote(claimId, commitHash);
    }

    function _reveal(address verifier, uint256 claimId, VoteKind kind, uint16 amountBps, bytes32 salt)
        internal
    {
        vm.prank(verifier);
        voting.revealVote(claimId, kind, amountBps, salt);
    }

    function _voteRound(uint256 claimId, VoteKind[10] memory kinds, uint16[10] memory bps, uint256 count)
        internal
    {
        bytes32[10] memory salts;
        for (uint256 i; i < count; ++i) {
            salts[i] = keccak256(abi.encode("salt", claimId, voting.currentRound(claimId), i));
            _commit(verifiers[i], claimId, kinds[i], bps[i], salts[i]);
        }
        vm.warp(block.timestamp + voting.commitWindow() + 1);
        for (uint256 i; i < count; ++i) {
            _reveal(verifiers[i], claimId, kinds[i], bps[i], salts[i]);
        }
        vm.warp(block.timestamp + voting.revealWindow() + 1);
        voting.resolveClaim(claimId);
    }

    function _approveKinds(uint256 approveCount) internal pure returns (VoteKind[10] memory kinds, uint16[10] memory bps) {
        for (uint256 i; i < 10; ++i) {
            kinds[i] = i < approveCount ? VoteKind.Approve : VoteKind.Deny;
            bps[i] = 0;
        }
    }
}
