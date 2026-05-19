# Demo Scenarios

This file is written for sales and founder talk-track training. The demo runs in a Tenderly Base Sepolia virtual testnet, while the public dashboard reads the production-grade Base Sepolia deployment.

## Wallet Roles

| Role | Owner | Purpose |
| --- | --- | --- |
| Faucet wallet | Backend | Sends native test token and demo VST to visitors. |
| Demo carrier wallet | Backend / embedded visitor wallet | Registers carrier, policies, and reserves in the sandbox. |
| Demo claimant wallet | Embedded visitor wallet | Submits claim packets in the sandbox. |
| Demo verifier wallets | Backend | Ten pre-funded wallets used for deterministic commit/reveal voting. |
| Visitor verifier wallet | Embedded visitor wallet | Lets the visitor experience staking, voting, rewards, and slashing. |

## HEALTH - Claimant: ER Visit Denial Appeal

Patient went to the ER for chest pain. Insurer denied the $4,820 visit citing "not medically necessary." Cardiology workup confirmed unstable angina.

Evidence shown:

- ICD-10 I20.0
- CPT 99285
- ED notes
- Cardiology consult

Expected outcome: verifier pool votes APPROVE 4-1. One contrarian verifier votes DENY, remains within tolerance, and is not slashed. Payout releases from the carrier reserve.

## HEALTH - Verifier: Three Claims, One Fraud

Claims shown:

1. Routine annual physical, $385: clearly legitimate, APPROVE.
2. ER visit denial appeal: APPROVE.
3. Duplicate-billed PT sessions: eighteen sessions billed in the same calendar day across different provider NPIs, DENY.

Expected visitor outcome:

- Correct fraud vote: rewards and accuracy improve.
- APPROVE on fraud: 50 VST bond slashed and redistributed to correct verifiers.
- Grey-area dissent: no slashing if within tolerance.

## AUTO - Claimant: Rear-End Collision, Delayed Payout

Insured was rear-ended at a stoplight. Police report attached, repair shop estimate $7,140, photographs geo-tagged. Insurer offered $3,200 arguing "pre-existing damage."

Expected outcome: verifier pool votes PARTIAL with a $6,800 median payout. Payout releases from carrier reserve.

## AUTO - Carrier: Pacific Mutual Onboarding

Visitor acts as Pacific Mutual, a regional auto carrier with 1,000 claims/month.

Flow:

1. Register Pacific Mutual.
2. Register auto-collision policy.
3. Fund $10k payout reserve.
4. Watch three claims resolve from the reserve.

Final screen contrasts the manual adjustment timeline, 4-18 weeks, with the demo timeline.

## AUTO - Verifier Flow

Claims shown:

1. Clean fender-bender claim: APPROVE.
2. Rear-end claim: PARTIAL.
3. Staged-collision fraud pattern: multiple recent claims with the same VIN, same body shop, and same plaintiff attorney, DENY.

Expected visitor outcome mirrors the HEALTH verifier flow.
