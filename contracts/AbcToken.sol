// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.13;

import {Router} from "@abacus-network/app/contracts/Router.sol";

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract AbcToken is Router, ERC20Upgradeable {
    error OnlyThis();

    modifier onlyThis() {
        if (msg.sender != address(this)) {
            revert OnlyThis();
        }
        _;
    }

    function transferRemote(
        uint32 domain,
        address recipient,
        uint256 amount
    ) external {
        _burn(msg.sender, amount);
        _dispatchToRemoteRouter(
            domain,
            abi.encodeCall(this.handleTransfer, (recipient, amount))
        );
    }

    function transferFromRemote(
        uint32 domain,
        address recipient,
        uint256 amount
    ) external {
        _dispatchToRemoteRouter(
            domain,
            abi.encodeCall(
                this.handleTransferFrom,
                (msg.sender, recipient, amount)
            )
        );
    }

    function handleTransfer(address recipient, uint256 amount) public onlyThis {
        _mint(recipient, amount);
    }

    function handleTransferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public onlyThis {
        _transfer(sender, recipient, amount);
    }

    function _handle(
        uint32,
        bytes32,
        bytes memory _message
    ) internal override {
        address(this).call(_message);
    }
}
