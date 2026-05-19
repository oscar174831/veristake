// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { Deploy } from "./Deploy.s.sol";

interface VmEnv {
    function envUint(string calldata name) external view returns (uint256 value);
    function envAddress(string calldata name) external view returns (address value);
}

contract DeployDemo is Deploy {
    uint256 internal constant DEMO_FAUCET_MINT = 10_000_000e18;
    VmEnv internal constant vmEnv = VmEnv(address(uint160(uint256(keccak256("hevm cheat code")))));

    /// @notice Deploys a demo-only system and configures minimum voting windows for Tenderly.
    function run() public override returns (Deployment memory deployment) {
        uint256 backendKey = vmEnv.envUint("DEMO_BACKEND_KEY");
        address backend = vm.addr(backendKey);
        address faucetWallet = vmEnv.envAddress("DEMO_VST_FAUCET_WALLET");
        address deployer = msg.sender;

        deployment = _deploySystem(deployer, deployer, false);

        vm.startBroadcast();
        deployment.voting.grantRole(deployment.voting.PARAMETER_ROLE(), backend);
        deployment.voting.setWindows(5 minutes, 5 minutes, 5 minutes);
        deployment.vst.mint(faucetWallet, DEMO_FAUCET_MINT);
        vm.stopBroadcast();

        _logDeploymentJson(deployment);
    }
}
