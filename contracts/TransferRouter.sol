// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.13;

import {Router} from "@abacus-network/core/contracts/router/Router.sol";

import {AbcToken} from "./AbcToken.sol";

contract TransferRouter is Router {
    // The address of the token contract.
    AbcToken public token;

    constructor(address _token) {
        token = AbcToken(_token);
    }

    error SenderNotToken();

    modifier onlyToken() {
        if (msg.sender != address(token)) {
            revert SenderNotToken();
        }
        _;
    }

    function transferRemote(
        uint32 domain,
        address recipient,
        uint256 amount
    ) external onlyToken {
        _dispatchToRemoteRouter(
            domain,
            abi.encodeCall(AbcToken.handleTransfer, (recipient, amount))
        );
    }

    function transferFromRemote(
        uint32 domain,
        address sender,
        address recipient,
        uint256 amount
    ) external onlyToken {
        _dispatchToRemoteRouter(
            domain,
            abi.encodeCall(
                AbcToken.handleTransferFrom,
                (sender, recipient, amount)
            )
        );
    }

    function _handle(bytes calldata _message)
        internal
        override
        returns (bool, bytes memory)
    {
        return address(token).call(_message);
    }
}
