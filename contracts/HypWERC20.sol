// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {HypERC20} from "./HypERC20.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Extension of the Hyperlane Token that wraps a canonical ERC20 token.
 * @author Abacus Works
 */
contract HypWERC20 is HypERC20 {
    IERC20 public wrappedToken;

    /**
     * @notice Initializes the Hyperlane router, ERC20, and mints initial supply to deployer.
     * @param _interchainGasPaymaster The address of the interchain gas paymaster contract.
     * @param _interchainSecurityModule The address of the interchain security module contract.
     * @param _erc20 canonical ERC20 token address.
     */
    function initialize(
        address _interchainGasPaymaster,
        address _interchainSecurityModule,
        address _erc20
    ) external initializer {
        // Set ISM contract address and transfer ownership to `msg.sender`
        __OwnableSpecifiesISM_init(_interchainSecurityModule);
        // Set IGP contract address
        _setInterchainGasPaymaster(_interchainGasPaymaster);
        wrappedToken = IERC20(_erc20);
    }

    function _transferFromSender(uint256 _amount) internal override {
        wrappedToken.transferFrom(msg.sender, address(this), _amount);
    }

    function _transferTo(address _recipient, uint256 _amount) internal override {
        wrappedToken.transfer(_recipient, _amount);
    }
}
