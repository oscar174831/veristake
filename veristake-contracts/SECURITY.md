# Security

## Scope

This phase covers contracts only: VST, claim lifecycle state, verifier staking, commit-reveal voting, challenge escalation, reputation, slashing, and carrier-funded payout escrow.

## Threat Model

### Oracle / Ground Truth Assumption

Veristake does not introduce an external oracle in this phase. The oracle is the verifier and appeal mechanism itself: hidden votes, reveal accountability, bonded challenges, and a final high-consensus arbiter round.

### Bribery Resistance Bounds

Bribery resistance is bounded by claim bond size, appeal cost, verifier stake concentration, and the expected value of reputation. Parameters should be reviewed before audit because low bonds or weak credentialing can make collusion cheaper than honest review.

### MEV Considerations

Commit-reveal hides vote content during the commit phase. Reveal timing can still be griefed at the edges of the reveal window, so integrations should surface deadlines clearly and encourage batch reveal transactions.

### Carrier Insolvency Edge Cases

Carrier payout reserves are segregated by policy. If a reserve is underfunded at payout time, `releasePayout` reverts and the legal carrier relationship remains off-chain. This avoids Veristake paying benefits from its own balance sheet, but creates a product-level requirement for reserve monitoring.

### Challenge Spam

Challenges require a doubled bond. This deters low-cost griefing but does not eliminate strategic delays for high-value claims. Max appeals and challenge bonds are bounded on-chain and listed in `DECISIONS.md` for founder review.

### Domain Credentialing

The current implementation uses admin credentialing per verifier/domain. This is an explicit placeholder for a stronger off-chain credential workflow or attestations in a later phase.

### Upgrade / Admin Risk

Deployment hands default administration to a two-day timelock. Parameter roles are bounded in code, but role assignment and emergency pausing remain governance-sensitive.
