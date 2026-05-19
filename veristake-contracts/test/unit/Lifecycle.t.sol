// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { VeristakeTestBase } from "../VeristakeTestBase.sol";

contract LifecycleTest is VeristakeTestBase {
    function testCarrierPayoutAfterUnchallengedApproval() public {
        _setupVerifiers(3, 1_000e18);
        uint256 claimId = _submitClaim();

        (VoteKind[10] memory kinds, uint16[10] memory bps) = _approveKinds(3);
        _voteRound(claimId, kinds, bps, 3);

        vm.warp(block.timestamp + voting.challengeWindow() + 1);
        voting.finalizeClaim(claimId);

        uint256 beforeBalance = vst.balanceOf(claimant);
        gateway.releasePayout(claimId);

        assertEq(vst.balanceOf(claimant) - beforeBalance, REQUESTED);
        assertEq(uint256(registry.stateOf(claimId)), uint256(ClaimState.FinalResolved));
        assertEq(staking.totalBondedForClaim(claimId), 0);
    }

    function testUnregisteredVerifierCannotCommit() public {
        uint256 claimId = _submitClaim();
        bytes32 salt = keccak256("salt");
        bytes32 commitHash = keccak256(abi.encode(VoteKind.Approve, uint16(0), salt));
        vm.expectRevert("VerifierStaking: unregistered");
        vm.prank(verifiers[0]);
        voting.commitVote(claimId, commitHash);
    }

    function testCarrierReserveDoesNotDecreaseBeforeFinalPayout() public {
        _setupVerifiers(3, 1_000e18);
        uint256 claimId = _submitClaim();
        uint256 reserveBefore = gateway.payoutReserve(POLICY);

        (VoteKind[10] memory kinds, uint16[10] memory bps) = _approveKinds(3);
        _voteRound(claimId, kinds, bps, 3);

        assertEq(gateway.payoutReserve(POLICY), reserveBefore);
        vm.warp(block.timestamp + voting.challengeWindow() + 1);
        voting.finalizeClaim(claimId);
        gateway.releasePayout(claimId);
        assertEq(gateway.payoutReserve(POLICY), reserveBefore - REQUESTED);
    }
}
