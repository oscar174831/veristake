// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { VeristakeTestBase } from "../VeristakeTestBase.sol";

contract EndToEndScenarioTest is VeristakeTestBase {
    function testEndToEndCarrierClaimTwoAppealsAndSlashing() public {
        _setupVerifiers(10, 5_000e18);
        uint256 claimId = _submitClaim();
        uint256 supplyBefore = vst.totalSupply();

        (VoteKind[10] memory round1, uint16[10] memory bps1) = _approveKinds(4);
        _voteRound(claimId, round1, bps1, 10);
        vm.prank(challenger);
        arbiter.challenge(claimId);

        (VoteKind[10] memory round2, uint16[10] memory bps2) = _approveKinds(6);
        _voteRound(claimId, round2, bps2, 10);
        vm.prank(challenger);
        arbiter.challenge(claimId);

        (VoteKind[10] memory round3, uint16[10] memory bps3) = _approveKinds(8);
        _voteRound(claimId, round3, bps3, 10);

        vm.warp(block.timestamp + voting.challengeWindow() + 1);
        voting.finalizeClaim(claimId);
        slashing.executeSlashing(claimId);

        uint256 claimantBefore = vst.balanceOf(claimant);
        gateway.releasePayout(claimId);

        assertEq(vst.balanceOf(claimant) - claimantBefore, REQUESTED);
        assertEq(uint256(registry.stateOf(claimId)), uint256(ClaimState.FinalResolved));
        assertEq(staking.totalBondedForClaim(claimId), 0);
        assertTrue(vst.totalSupply() <= supplyBefore);
        assertTrue(vst.balanceOf(treasury) > 0);
    }
}
