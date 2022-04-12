// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.13;

import {Router} from "@abacus-network/app/contracts/Router.sol";

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract AbcToken is Router, ERC20Upgradeable {
    function initialize(
        address _xAppConnectionManager,
        uint256 _totalSupply,
        string memory _name,
        string memory _symbol
    ) external initializer {
        __Router_initialize(_xAppConnectionManager);
        __ERC20_init(_name, _symbol);
        _mint(msg.sender, _totalSupply);
    }

    // Burns `amount` of tokens from `msg.sender` on the origin chain and dispatches
    // message to the `destination` chain to mint `amount` of tokens to `recipient`.
    function transferRemote(
        uint32 _destination,
        address _recipient,
        uint256 _amount
    ) external {
        _burn(msg.sender, _amount);
        _dispatchToRemoteRouter(_destination, abi.encode(_recipient, _amount));
    }

    // Mints `amount` of tokens to `recipient` when router receives transfer `message`.
    function _handle(
        uint32,
        bytes32,
        bytes memory _message
    ) internal override {
        (address recipient, uint256 amount) = abi.decode(
            _message,
            (address, uint256)
        );
        _mint(recipient, amount);
    }
}
