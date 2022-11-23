// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {TransferRemoteRouter} from "./libs/TransferRemoteRouter.sol";

import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

/**
 * @title Hyperlane Token that extends the ERC721 token standard to enable native interchain transfers.
 * @author Abacus Works
 */
contract HypERC721 is ERC721EnumerableUpgradeable, TransferRemoteRouter {
    /**
     * @notice Initializes the Hyperlane router, ERC721 metadata, and mints initial supply to deployer.
     * @param _mailbox The address of the mailbox contract.
     * @param _interchainGasPaymaster The address of the interchain gas paymaster contract.
     * @param _interchainSecurityModule The address of the interchain security module contract.
     * @param _mintAmount The amount of NFTs to mint to `msg.sender`.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     */
    function initialize(
        address _mailbox,
        address _interchainGasPaymaster,
        address _interchainSecurityModule,
        uint256 _mintAmount,
        string memory _name,
        string memory _symbol
    ) external initializer {
        __HyperlaneConnectionClient_initialize(
            _mailbox,
            _interchainGasPaymaster,
            _interchainSecurityModule
        );

        __ERC721_init(_name, _symbol);
        for (uint256 i = 0; i < _mintAmount; i++) {
            _mint(msg.sender, i);
        }
    }

    function _transferFromSender(uint256 _tokenId) internal override {
        require(ownerOf(_tokenId) == msg.sender, "!owner");
        _burn(_tokenId);
    }

    function _transferTo(address _recipient, uint256 _tokenId)
        internal
        override
    {
        _mint(_recipient, _tokenId);
    }
}
