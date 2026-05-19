// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { VeristakeTestBase } from "../VeristakeTestBase.sol";

contract SlashingMathFuzzTest is VeristakeTestBase {
    function testFuzzSlashingPoolNeverMints(uint16 slashBps) public {
        slashBps = uint16(bound(slashBps, 0, 10_000));
        slashing.setSlashingParameters(2_000, 7_500, slashBps);
        _setupVerifiers(4, 2_000e18);
        uint256 supplyBefore = vst.totalSupply();
        uint256 claimId = _submitClaim();

        VoteKind[10] memory kinds;
        uint16[10] memory bps;
        kinds[0] = VoteKind.Approve;
        kinds[1] = VoteKind.Approve;
        kinds[2] = VoteKind.Approve;
        kinds[3] = VoteKind.Deny;
        _voteRound(claimId, kinds, bps, 4);

        vm.warp(block.timestamp + voting.challengeWindow() + 1);
        voting.finalizeClaim(claimId);
        slashing.executeSlashing(claimId);

        assertTrue(vst.totalSupply() <= supplyBefore);
        assertEq(staking.totalBondedForClaim(claimId), 0);
    }
}
