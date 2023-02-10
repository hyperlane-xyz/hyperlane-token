// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {TokenRouter} from "./libs/TokenRouter.sol";
import {IHypToken} from "../interfaces/IHypToken.sol";
import {Message} from "./libs/Message.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title Hyperlane Native Token Router that extends ERC20 with remote transfer functionality.
 * @author Abacus Works
 * @dev Supply on each chain is not constant but the aggregate supply across all chains is.
 */
contract HypNative is TokenRouter {
    /**
     * @notice Constructor
     * @param gasAmount Amount of destination gas to be paid for processing
     */
    constructor(uint256 gasAmount) TokenRouter(gasAmount) {}

    /**
     * @notice Initializes the Hyperlane router, ERC20 metadata, and mints initial supply to deployer.
     * @param _mailbox The address of the mailbox contract.
     * @param _interchainGasPaymaster The address of the interchain gas paymaster contract.
     */
    function initialize(
        address _mailbox,
        address _interchainGasPaymaster
    ) external initializer {
        // transfers ownership to `msg.sender`
        __HyperlaneConnectionClient_initialize(
            _mailbox,
            _interchainGasPaymaster
        );
    }

    /**
     * @inheritdoc TokenRouter
     * @dev uses (`msg.value` - `_amount`) as interchain gas payment and `msg.sender` as refund address.
     */
    function transferRemote(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _amount
    ) external override payable {
        require(msg.value >= _amount, "msg.value < amount");
        uint256 gasPayment = msg.value - _amount;
        _dispatchWithGas(
            _destination,
            Message.format(_recipient, _amount, ""),
            gasAmount,
            gasPayment,
            msg.sender
        );
        emit SentTransferRemote(_destination, _recipient, _amount);
    }

    /**
     * @inheritdoc IHypToken
     */
    function balanceOf(address _account)
        external
        view
        override
        returns (uint256)
    {
        return _account.balance;
    }

    /**
     * @dev No-op because native amount is transferred in `msg.value`
     * @dev Compiler will not include this in the bytecode.
     * @inheritdoc TokenRouter
     */
    function _transferFromSender(uint256)
        internal
        pure
        override
        returns (bytes memory)
    {
        return bytes(""); // no metadata
    }

    /**
     * @dev Sends `_amount` of native token to `_recipient` balance.
     * @inheritdoc TokenRouter
     */
    function _transferTo(
        address _recipient,
        uint256 _amount,
        bytes calldata // no metadata
    ) internal override {
        Address.sendValue(payable(_recipient), _amount);
    }
}
