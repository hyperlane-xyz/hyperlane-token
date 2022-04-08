// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {TransferRouter} from "./TransferRouter.sol";

contract AbcToken is ERC20 {
    // The TransferRouter responsible for sending messages to mint ABC on remote chains.
    TransferRouter public router;

    error SenderNotRouter();

    modifier onlyRouter() {
        if (msg.sender != address(router)) {
            revert SenderNotRouter();
        }
        _;
    }

    constructor(
        address _router,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        router = TransferRouter(_router);
    }

    function transferRemote(
        uint32 domain,
        address recipient,
        uint256 amount
    ) external {
        _burn(msg.sender, amount);
        router.transferRemote(domain, recipient, amount);
    }

    function handleTransfer(address recipient, uint256 amount)
        external
        onlyRouter
    {
        _mint(recipient, amount);
    }

    function transferFromRemote(
        uint32 domain,
        address recipient,
        uint256 amount
    ) external {
        router.transferFromRemote(domain, msg.sender, recipient, amount);
    }

    function handleTransferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external onlyRouter {
        _transfer(sender, recipient, amount);
    }
}
