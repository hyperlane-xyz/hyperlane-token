// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.13;

import {Router} from "@abacus-network/app/contracts/Router.sol";

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract AbcToken is Router, ERC20Upgradeable {
    // Burns `amount` of tokens from `msg.sender` on the origin chain and dispatches
    // message to the `destination` chain to mint `amount` of tokens to `recipient`.
    function transferRemote(
        uint32 destination,
        address recipient,
        uint256 amount
    ) external {
        _burn(msg.sender, amount);
        _dispatchToRemoteRouter(destination, abi.encode(recipient, amount));
    }

    // Mints `amount` of tokens to `recipient` when router receives transfer `message`.
    function _handle(
        uint32,
        bytes32,
        bytes memory message
    ) internal override {
        (address recipient, uint256 amount) = abi.decode(
            message,
            (address, uint256)
        );
        _mint(recipient, amount);
    }
}
