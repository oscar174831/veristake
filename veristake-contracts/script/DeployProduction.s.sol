// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { console2 } from "forge-std/Script.sol";
import { Deploy } from "./Deploy.s.sol";
import { IVeristakeTypes } from "../src/interfaces/IVeristakeTypes.sol";

interface ProductionVmEnv {
    function envUint(string calldata name) external view returns (uint256 value);
    function envAddress(string calldata name) external view returns (address value);
    function envString(string calldata name) external view returns (string memory value);
}

contract DeployProduction is Deploy, IVeristakeTypes {
    uint256 internal constant SEED_RESERVE = 1_000e18;
    uint256 internal constant SEED_STAKE = 1_000e18;
    ProductionVmEnv internal constant vmEnv =
        ProductionVmEnv(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() public override returns (Deployment memory deployment) {
        uint256 deployerKey = vmEnv.envUint("PRODUCTION_DEPLOYER_KEY");
        string memory rpcUrl = vmEnv.envString("BASE_SEPOLIA_RPC_URL");
        address treasury = vmEnv.envAddress("PRODUCTION_TREASURY");
        require(bytes(rpcUrl).length != 0, "DeployProduction: BASE_SEPOLIA_RPC_URL missing");
        require(treasury != address(0), "DeployProduction: PRODUCTION_TREASURY missing");

        address deployer = vm.addr(deployerKey);
        deployment = _deploySystem(deployer, treasury, false);
        _seedActivity(deployment, deployerKey);
        _handoffSystem(
            deployment.registry,
            deployment.staking,
            deployment.voting,
            deployment.reputation,
            deployment.gateway,
            deployment.arbiter,
            deployment.slashing,
            deployment.timelock,
            deployer
        );

        _logDeploymentJson(deployment);
        _logVercelEnv(deployment);
    }

    function _seedActivity(Deployment memory deployment, uint256 deployerKey) internal {
        address deployer = vm.addr(deployerKey);
        bytes32 healthPolicy = keccak256("veristake.production.health.policy");
        bytes32 autoPolicy = keccak256("veristake.production.auto.policy");

        vm.startBroadcast(deployer);
        deployment.voting.setWindows(5 minutes, 5 minutes, 5 minutes);

        deployment.gateway.registerCarrier(deployer, keccak256("Pacific Mutual seed license"));
        deployment.gateway.registerCarrier(address(uint160(0xA11CE)), keccak256("Northstar Health seed license"));
        deployment.gateway.registerPolicy(autoPolicy, 2, uint128(10_000e18), address(deployment.vst));
        deployment.gateway.registerPolicy(healthPolicy, 1, uint128(10_000e18), address(deployment.vst));
        deployment.vst.approve(address(deployment.gateway), 2 * SEED_RESERVE);
        deployment.gateway.fundPayoutReserve(autoPolicy, uint128(SEED_RESERVE));
        deployment.gateway.fundPayoutReserve(healthPolicy, uint128(SEED_RESERVE));

        deployment.staking.setDomainCredential(deployer, 1, true);
        deployment.staking.setDomainCredential(deployer, 2, true);
        deployment.vst.approve(address(deployment.staking), 2 * SEED_STAKE);
        deployment.staking.registerDomainPool(1, uint128(SEED_STAKE));
        deployment.staking.registerDomainPool(2, uint128(SEED_STAKE));

        uint256 healthApprove = deployment.registry.submitClaim(1, keccak256("seed health approve"), uint128(420e18), healthPolicy);
        uint256 healthPartial = deployment.registry.submitClaim(1, keccak256("seed health partial"), uint128(610e18), healthPolicy);
        uint256 autoApprove = deployment.registry.submitClaim(2, keccak256("seed auto approve"), uint128(720e18), autoPolicy);
        deployment.registry.submitClaim(2, keccak256("seed auto partial queued"), uint128(830e18), autoPolicy);
        deployment.registry.submitClaim(2, keccak256("seed auto deny queued"), uint128(390e18), autoPolicy);

        _directFinalize(deployment, deployer, healthApprove, VoteKind.Approve, 0, true);
        _directFinalize(deployment, deployer, healthPartial, VoteKind.Partial, 6_800, true);
        _directFinalize(deployment, deployer, autoApprove, VoteKind.Approve, 0, true);
        deployment.reputation.updateAccuracy(deployer, 2, false);

        deployment.voting.setWindows(1 days, 1 days, 2 days);
        vm.stopBroadcast();
    }

    function _directFinalize(
        Deployment memory deployment,
        address verifier,
        uint256 claimId,
        VoteKind kind,
        uint16 amountBps,
        bool correct
    ) internal {
        deployment.registry.startVoting(claimId);
        deployment.registry.markResolved(claimId, kind, amountBps);
        deployment.registry.markFinalResolved(claimId, kind, amountBps);
        deployment.reputation.updateAccuracy(verifier, deployment.registry.getClaim(claimId).domainId, correct);
        deployment.gateway.releasePayout(claimId);
    }

    function _logVercelEnv(Deployment memory deployment) internal view {
        console2.log("Copy into Vercel:");
        console2.log(
            string.concat(
                "NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON='",
                "{",
                '"TimelockController":"', _addressToString(address(deployment.timelock)), '",',
                '"VST":"', _addressToString(address(deployment.vst)), '",',
                '"ClaimRegistry":"', _addressToString(address(deployment.registry)), '",',
                '"SoulboundReputation":"', _addressToString(address(deployment.reputation)), '",',
                '"VerifierStaking":"', _addressToString(address(deployment.staking)), '",',
                '"Voting":"', _addressToString(address(deployment.voting)), '",',
                '"CarrierGateway":"', _addressToString(address(deployment.gateway)), '",',
                '"ArbiterEscalation":"', _addressToString(address(deployment.arbiter)), '",',
                '"Slashing":"', _addressToString(address(deployment.slashing)), '"',
                "}'"
            )
        );
    }
}
