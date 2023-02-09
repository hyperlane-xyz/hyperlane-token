// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {Router} from "@hyperlane-xyz/core/contracts/Router.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import {Message} from "./Message.sol";
import {IHypToken} from "../../interfaces/IHypToken.sol";

/**
 * @title Hyperlane Token Router that extends Router with abstract token (ERC20/ERC721) remote transfer functionality.
 * @author Abacus Works
 */
abstract contract TokenRouter is Router, IHypToken {
    using TypeCasts for bytes32;
    using Message for bytes;

    /**
     * @notice Gas amount to use for destination chain processing, should be overriden by implementors
     */
    uint256 internal immutable gasAmount;

    constructor(uint256 _gasAmount) {
        gasAmount = _gasAmount;
    }

    // @inheritdoc IHypToken
    function transferRemote(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _amountOrId
    ) external virtual payable {
        bytes memory metadata = _transferFromSender(_amountOrId);
        _dispatchWithGas(
            _destination,
            Message.format(_recipient, _amountOrId, metadata),
            gasAmount,
            msg.value,
            msg.sender
        );
        emit SentTransferRemote(_destination, _recipient, _amountOrId);
    }

    /**
     * @dev Should transfer `_amountOrId` of tokens from `msg.sender` to this token router.
     * @dev Called by `transferRemote` before message dispatch.
     * @dev Optionally returns `metadata` associated with the transfer to be passed in message.
     */
    function _transferFromSender(uint256 _amountOrId)
        internal
        virtual
        returns (bytes memory metadata);

    /**
     * @dev Should transfer `_amountOrId` of tokens from this token router to `_recipient`.
     * @dev Called by `handle` after message decoding.
     * @dev Optionally handles `metadata` associated with transfer passed in message.
     */
    function _transferTo(
        address _recipient,
        uint256 _amountOrId,
        bytes calldata metadata
    ) internal virtual;

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
        bytes32 recipient = _message.recipient();
        uint256 amount = _message.amount();
        bytes calldata metadata = _message.metadata();
        _transferTo(recipient.bytes32ToAddress(), amount, metadata);
        emit ReceivedTransferRemote(_origin, recipient, amount);
    }
}
