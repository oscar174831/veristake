// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { ERC20Capped } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

contract VST is ERC20, ERC20Burnable, ERC20Capped, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Deploys the capped verifier staking token.
    /// @param timelock Address that will own admin and minting authority.
    /// @param cap_ Maximum VST supply.
    /// @param initialRecipient Address receiving the optional initial mint.
    /// @param initialMint Amount minted at deployment.
    constructor(address timelock, uint256 cap_, address initialRecipient, uint256 initialMint)
        ERC20("Verifier Staking Token", "VST")
        ERC20Capped(cap_)
    {
        require(timelock != address(0), "VST: timelock zero");
        _grantRole(DEFAULT_ADMIN_ROLE, timelock);
        _grantRole(MINTER_ROLE, timelock);
        if (initialMint != 0) {
            require(initialRecipient != address(0), "VST: recipient zero");
            _mint(initialRecipient, initialMint);
        }
    }

    /// @notice Mints VST within the immutable cap.
    /// @param to Token recipient.
    /// @param amount Amount to mint.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
