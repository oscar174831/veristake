// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { VeristakeTestBase } from "../VeristakeTestBase.sol";

contract CoreInvariantsTest is VeristakeTestBase {
    uint256 internal claimId;

    function setUp() public override {
        super.setUp();
        _setupVerifiers(5, 1_000e18);
        claimId = _submitClaim();
    }

    function invariant_StakeTreasuryCirculatingEqualsTotalSupply() public {
        uint256 knownBalances = vst.balanceOf(address(staking)) + vst.balanceOf(address(slashing))
            + vst.balanceOf(address(gateway)) + vst.balanceOf(treasury) + vst.balanceOf(address(this))
            + vst.balanceOf(carrier) + vst.balanceOf(challenger) + vst.balanceOf(claimant);
        for (uint256 i; i < verifiers.length; ++i) {
            knownBalances += vst.balanceOf(verifiers[i]);
        }
        assertTrue(knownBalances <= vst.totalSupply());
    }

    function invariant_ClaimStateIsForwardLifecycleValue() public {
        uint256 stateValue = uint256(registry.stateOf(claimId));
        assertTrue(stateValue >= uint256(ClaimState.Submitted));
        assertTrue(stateValue <= uint256(ClaimState.FinalResolved));
    }

    function invariant_SlashingOnlyAfterFinalResolved() public {
        if (slashing.hasExecuted(claimId)) {
            assertEq(uint256(registry.stateOf(claimId)), uint256(ClaimState.FinalResolved));
        }
    }

    function invariant_NoRewardMintingPath() public {
        assertTrue(vst.totalSupply() <= VST_CAP);
    }

    function invariant_UnregisteredVerifierHasNoAvailableVoteBond() public {
        assertEq(staking.availableStake(address(0xDEAD), DOMAIN), 0);
    }

    function invariant_PayoutReserveNonNegative() public {
        assertTrue(gateway.payoutReserve(POLICY) >= 0);
    }

    function invariant_PerClaimBondedNotAboveTotalStaked() public {
        assertTrue(staking.totalBondedForClaim(claimId) <= staking.totalStaked());
    }
}
