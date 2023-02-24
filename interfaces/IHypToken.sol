// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

interface IHypToken {
      /**
     * @notice Transfers `_amountOrId` token to `_recipient` on `_destination` domain.
     * @param _destination The identifier of the destination chain.
     * @param _recipient The address of the recipient on the destination chain.
     * @param _amountOrId The amount or identifier of tokens to be sent to the remote recipient.
     * @return messageId The identifier of the dispatched message.
     */
    function transferRemote(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _amountOrId
    ) external payable returns (bytes32 messageId);
}
