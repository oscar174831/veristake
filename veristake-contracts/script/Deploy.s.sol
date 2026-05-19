// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { TimelockController } from "@openzeppelin/contracts/governance/TimelockController.sol";
import { ArbiterEscalation } from "../src/ArbiterEscalation.sol";
import { CarrierGateway } from "../src/CarrierGateway.sol";
import { ClaimRegistry } from "../src/ClaimRegistry.sol";
import { Slashing } from "../src/Slashing.sol";
import { SoulboundReputation } from "../src/SoulboundReputation.sol";
import { VerifierStaking } from "../src/VerifierStaking.sol";
import { Voting } from "../src/Voting.sol";
import { VST } from "../src/VST.sol";

contract Deploy is Script {
    uint256 internal constant VST_CAP = 1_000_000_000e18;
    uint256 internal constant INITIAL_MINT = 100_000_000e18;

    struct Deployment {
        TimelockController timelock;
        VST vst;
        ClaimRegistry registry;
        SoulboundReputation reputation;
        VerifierStaking staking;
        Voting voting;
        CarrierGateway gateway;
        ArbiterEscalation arbiter;
        Slashing slashing;
        address treasury;
    }

    /// @notice Deploys the full Veristake contract system and prints addresses.
    function run() public virtual returns (Deployment memory deployment) {
        address deployer = msg.sender;
        deployment = _deploySystem(deployer, deployer, true);
        _logDeployment(deployment);
    }

    function _deploySystem(address deployer, address treasury, bool handoffToTimelock)
        internal
        returns (Deployment memory deployment)
    {
        address[] memory proposers = new address[](1);
        proposers[0] = deployer;
        address[] memory executors = new address[](1);
        executors[0] = address(0);

        vm.startBroadcast();

        TimelockController timelock = new TimelockController(2 days, proposers, executors, deployer);
        address vstAdmin = handoffToTimelock ? address(timelock) : deployer;
        VST vst = new VST(vstAdmin, VST_CAP, deployer, INITIAL_MINT);
        ClaimRegistry registry = new ClaimRegistry(deployer);
        SoulboundReputation reputation = new SoulboundReputation(deployer);
        VerifierStaking staking = new VerifierStaking(vst, deployer);
        Voting voting = new Voting(registry, staking, reputation, deployer);
        CarrierGateway gateway = new CarrierGateway(registry, deployer);
        ArbiterEscalation arbiter = new ArbiterEscalation(vst, registry, voting, deployer);
        Slashing slashing = new Slashing(vst, registry, staking, voting, reputation, treasury, deployer);

        registry.grantRole(registry.VOTING_ROLE(), address(voting));
        staking.grantRole(staking.BOND_MANAGER_ROLE(), address(voting));
        staking.grantRole(staking.BOND_MANAGER_ROLE(), address(slashing));
        staking.grantRole(staking.SLASHER_ROLE(), address(slashing));
        voting.grantRole(voting.ESCALATION_ROLE(), address(arbiter));
        reputation.grantRole(reputation.UPDATER_ROLE(), address(slashing));

        if (handoffToTimelock) {
            _handoffRegistry(registry, timelock, deployer);
            _handoffStaking(staking, timelock, deployer);
            _handoffVoting(voting, timelock, deployer);
            _handoffReputation(reputation, timelock, deployer);
            _handoffGateway(gateway, timelock, deployer);
            _handoffArbiter(arbiter, timelock, deployer);
            _handoffSlashing(slashing, timelock, deployer);
        }

        vm.stopBroadcast();

        deployment = Deployment({
            timelock: timelock,
            vst: vst,
            registry: registry,
            reputation: reputation,
            staking: staking,
            voting: voting,
            gateway: gateway,
            arbiter: arbiter,
            slashing: slashing,
            treasury: treasury
        });
    }

    function _logDeployment(Deployment memory deployment) internal view {
        console2.log("TimelockController", address(deployment.timelock));
        console2.log("VST", address(deployment.vst));
        console2.log("ClaimRegistry", address(deployment.registry));
        console2.log("SoulboundReputation", address(deployment.reputation));
        console2.log("VerifierStaking", address(deployment.staking));
        console2.log("Voting", address(deployment.voting));
        console2.log("CarrierGateway", address(deployment.gateway));
        console2.log("ArbiterEscalation", address(deployment.arbiter));
        console2.log("Slashing", address(deployment.slashing));
        console2.log("Treasury", deployment.treasury);
    }

    function _logDeploymentJson(Deployment memory deployment) internal view {
        console2.log("{");
        console2.log(string.concat('  "TimelockController": "', _addressToString(address(deployment.timelock)), '",'));
        console2.log(string.concat('  "VST": "', _addressToString(address(deployment.vst)), '",'));
        console2.log(string.concat('  "ClaimRegistry": "', _addressToString(address(deployment.registry)), '",'));
        console2.log(string.concat('  "SoulboundReputation": "', _addressToString(address(deployment.reputation)), '",'));
        console2.log(string.concat('  "VerifierStaking": "', _addressToString(address(deployment.staking)), '",'));
        console2.log(string.concat('  "Voting": "', _addressToString(address(deployment.voting)), '",'));
        console2.log(string.concat('  "CarrierGateway": "', _addressToString(address(deployment.gateway)), '",'));
        console2.log(string.concat('  "ArbiterEscalation": "', _addressToString(address(deployment.arbiter)), '",'));
        console2.log(string.concat('  "Slashing": "', _addressToString(address(deployment.slashing)), '"'));
        console2.log("}");
    }

    function _addressToString(address account) internal pure returns (string memory) {
        bytes20 value = bytes20(account);
        bytes16 symbols = "0123456789abcdef";
        bytes memory buffer = new bytes(42);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i; i < 20; ++i) {
            buffer[2 + i * 2] = symbols[uint8(value[i] >> 4)];
            buffer[3 + i * 2] = symbols[uint8(value[i] & 0x0f)];
        }
        return string(buffer);
    }

    function _handoffRegistry(ClaimRegistry registry, TimelockController timelock, address deployer) private {
        registry.grantRole(registry.DEFAULT_ADMIN_ROLE(), address(timelock));
        registry.revokeRole(registry.PAUSER_ROLE(), deployer);
        registry.revokeRole(registry.VOTING_ROLE(), deployer);
        registry.revokeRole(registry.DEFAULT_ADMIN_ROLE(), deployer);
    }

    function _handoffStaking(VerifierStaking staking, TimelockController timelock, address deployer) private {
        staking.grantRole(staking.DEFAULT_ADMIN_ROLE(), address(timelock));
        staking.revokeRole(staking.PAUSER_ROLE(), deployer);
        staking.revokeRole(staking.DOMAIN_ADMIN_ROLE(), deployer);
        staking.revokeRole(staking.BOND_MANAGER_ROLE(), deployer);
        staking.revokeRole(staking.SLASHER_ROLE(), deployer);
        staking.revokeRole(staking.DEFAULT_ADMIN_ROLE(), deployer);
    }

    function _handoffVoting(Voting voting, TimelockController timelock, address deployer) private {
        voting.grantRole(voting.DEFAULT_ADMIN_ROLE(), address(timelock));
        voting.revokeRole(voting.PAUSER_ROLE(), deployer);
        voting.revokeRole(voting.PARAMETER_ROLE(), deployer);
        voting.revokeRole(voting.ESCALATION_ROLE(), deployer);
        voting.revokeRole(voting.DEFAULT_ADMIN_ROLE(), deployer);
    }

    function _handoffReputation(SoulboundReputation reputation, TimelockController timelock, address deployer)
        private
    {
        reputation.grantRole(reputation.DEFAULT_ADMIN_ROLE(), address(timelock));
        reputation.revokeRole(reputation.PARAMETER_ROLE(), deployer);
        reputation.revokeRole(reputation.UPDATER_ROLE(), deployer);
        reputation.revokeRole(reputation.DEFAULT_ADMIN_ROLE(), deployer);
    }

    function _handoffGateway(CarrierGateway gateway, TimelockController timelock, address deployer) private {
        gateway.grantRole(gateway.DEFAULT_ADMIN_ROLE(), address(timelock));
        gateway.revokeRole(gateway.CARRIER_ADMIN_ROLE(), deployer);
        gateway.revokeRole(gateway.DEFAULT_ADMIN_ROLE(), deployer);
    }

    function _handoffArbiter(ArbiterEscalation arbiter, TimelockController timelock, address deployer) private {
        arbiter.grantRole(arbiter.DEFAULT_ADMIN_ROLE(), address(timelock));
        arbiter.revokeRole(arbiter.PARAMETER_ROLE(), deployer);
        arbiter.revokeRole(arbiter.DEFAULT_ADMIN_ROLE(), deployer);
    }

    function _handoffSlashing(Slashing slashing, TimelockController timelock, address deployer) private {
        slashing.grantRole(slashing.DEFAULT_ADMIN_ROLE(), address(timelock));
        slashing.revokeRole(slashing.PARAMETER_ROLE(), deployer);
        slashing.revokeRole(slashing.DEFAULT_ADMIN_ROLE(), deployer);
    }
}
