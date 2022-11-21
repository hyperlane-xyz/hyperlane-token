// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {ERC20Router} from "./ERC20Router.sol";

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/**
 * @title Hyperlane Token that extends the ERC20 token standard to enable native interchain transfers.
 * @author Abacus Works
 * @dev Supply on each chain is not constant but the aggregate supply across all chains is.
 */
contract HypERC20 is ERC20Router, ERC20Upgradeable {
    /**
     * @notice Initializes the Hyperlane router, ERC20 metadata, and mints initial supply to deployer.
     * @param _mailbox The address of the mailbox contract.
     * @param _interchainGasPaymaster The address of the interchain gas paymaster contract.
     * @param _interchainSecurityModule The address of the interchain security module contract.
     * @param _totalSupply The initial supply of the token.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     */
    function initialize(
        address _mailbox,
        address _interchainGasPaymaster,
        address _interchainSecurityModule,
        uint256 _totalSupply,
        string memory _name,
        string memory _symbol
    ) external initializer {
        __HyperlaneConnectionClient_initialize(
            _mailbox,
            _interchainGasPaymaster,
            _interchainSecurityModule
        );

        // Initialize ERC20 metadata
        __ERC20_init(_name, _symbol);
        _mint(msg.sender, _totalSupply);
    }

    function _transferFromSender(uint256 _amount) internal override {
        _burn(msg.sender, _amount);
    }

    function _transferTo(address _recipient, uint256 _amount)
        internal
        override
    {
        _mint(_recipient, _amount);
    }
}
