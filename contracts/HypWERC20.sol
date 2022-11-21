// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {ERC20Router} from "./ERC20Router.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Extension of the Hyperlane Token that wraps a canonical ERC20 token.
 * @author Abacus Works
 */
contract HypWERC20 is ERC20Router {
    // TODO: consider implementing ERC20 interface and passing through balanceOf, etc.
    IERC20 public immutable wrappedToken;

    constructor(address erc20) {
        wrappedToken = IERC20(erc20);
    }

    function initialize(
        address _mailbox,
        address _interchainGasPaymaster,
        address _interchainSecurityModule
    ) external initializer {
        __HyperlaneConnectionClient_initialize(
            _mailbox,
            _interchainGasPaymaster,
            _interchainSecurityModule
        );
    }

    function _transferFromSender(uint256 _amount) internal override {
        require(wrappedToken.transferFrom(msg.sender, address(this), _amount));
    }

    function _transferTo(address _recipient, uint256 _amount)
        internal
        override
    {
        require(wrappedToken.transfer(_recipient, _amount));
    }
}
