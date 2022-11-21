// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {Router} from "@hyperlane-xyz/core/contracts/Router.sol";
import {OwnableSpecifiesISM} from "@hyperlane-xyz/core/contracts/OwnableSpecifiesISM.sol";

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/**
 * @title Hyperlane Token that extends the ERC20 token standard to enable native interchain transfers.
 * @author Abacus Works
 * @dev Supply on each chain is not constant but the aggregate supply across all chains is.
 */
contract HypERC20 is Router, ERC20Upgradeable, OwnableSpecifiesISM {
    /**
     * @dev Emitted on `transferRemote` when a transfer message is dispatched.
     * @param destination The identifier of the destination chain.
     * @param recipient The address of the recipient on the destination chain.
     * @param amount The amount of tokens burnt on the origin chain.
     */
    event SentTransferRemote(
        uint32 indexed destination,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @dev Emitted on `_handle` when a transfer message is processed.
     * @param origin The identifier of the origin chain.
     * @param recipient The address of the recipient on the destination chain.
     * @param amount The amount of tokens minted on the destination chain.
     */
    event ReceivedTransferRemote(
        uint32 indexed origin,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice Initializes the Hyperlane router, ERC20 metadata, and mints initial supply to deployer.
     * @param _interchainGasPaymaster The address of the interchain gas paymaster contract.
     * @param _interchainSecurityModule The address of the interchain security module contract.
     * @param _totalSupply The initial supply of the token.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     */
    function initialize(
        address _interchainGasPaymaster,
        address _interchainSecurityModule,
        uint256 _totalSupply,
        string memory _name,
        string memory _symbol
    ) external initializer {
        // Set ISM contract address and transfer ownership to `msg.sender`
        __OwnableSpecifiesISM_init(_interchainSecurityModule);
        // Set IGP contract address
        _setInterchainGasPaymaster(_interchainGasPaymaster);
        // Initialize ERC20 metadata
        __ERC20_init(_name, _symbol);
        _mint(msg.sender, _totalSupply);
    }

    /**
     * @notice Transfers `_amount` of tokens from `msg.sender` to `_recipient` on the `_destination` chain.
     * @dev Burns `_amount` of tokens from `msg.sender` on the origin chain and dispatches
     *      message to the `destination` chain to mint `_amount` of tokens to `recipient`.
     * @dev Emits `SentTransferRemote` event on the origin chain.
     * @param _destination The identifier of the destination chain.
     * @param _recipient The address of the recipient on the destination chain.
     * @param _amount The amount of tokens to be sent to the remote recipient.
     */
    function transferRemote(
        uint32 _destination,
        address _recipient,
        uint256 _amount
    ) external payable {
        _transferFromSender(_amount);
        _dispatchWithGas(
            _destination,
            abi.encodePacked(_recipient, _amount),
            msg.value
        );
        emit SentTransferRemote(_destination, _recipient, _amount);
    }

    function _transferFromSender(uint256 _amount) internal virtual {
        _burn(msg.sender, _amount);
    }

    /**
     * @dev Mints tokens to recipient when router receives transfer message.
     * @dev Emits `ReceivedTransferRemote` event on the destination chain.
     * @param _origin The identifier of the origin chain.
     * @param _message The encoded remote transfer message containing the recipient address and amount.
     */
    function _handle(
        uint32 _origin,
        bytes32,
        bytes calldata _message
    ) internal override {
        address recipient = address(bytes20(_message[0:20]));
        uint256 amount = uint256(bytes32(_message[20:52]));
        _transferTo(recipient, amount);
        emit ReceivedTransferRemote(_origin, recipient, amount);
    }

    function _transferTo(address _recipient, uint256 _amount) internal virtual {
        _mint(_recipient, _amount);
    }
}
