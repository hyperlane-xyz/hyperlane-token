// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {TokenRouter} from "./libs/TokenRouter.sol";

import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";

/**
 * @title Hyperlane Token that extends the ERC721 token standard to enable native interchain transfers.
 * @author Abacus Works
 */
contract HypERC721 is ERC721URIStorageUpgradeable, TokenRouter {
    /**
     * @notice Initializes the Hyperlane router, ERC20 metadata, and mints initial supply to deployer.
     * @param _connectionManager The address of the connectionManager contract.
     * @param _interchainGasPaymaster The address of the interchain gas paymaster contract.
     * @param _mintAmount The amount of NFTs to mint to `msg.sender`.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     */
    function initialize(
        address _connectionManager,
        address _interchainGasPaymaster,    
        uint256 _mintAmount,
        string memory _name,
        string memory _symbol
    ) external initializer {
        // transfers ownership to `msg.sender`
        __AbacusConnectionClient_initialize(
            _connectionManager,
            _interchainGasPaymaster
        );

        __ERC721_init(_name, _symbol);
        for (uint256 i = 0; i < _mintAmount; i++) {
            _mint(msg.sender, i);
        }
    }

    // called in `TokenRouter.transferRemote` before `Mailbox.dispatch`
    function _transferFromSender(uint256 _tokenId) internal override {
        require(ownerOf(_tokenId) == msg.sender, "!owner");
        _burn(_tokenId);
    }

    // called by `TokenRouter.handle`
    function _transferTo(address _recipient, uint256 _tokenId)
        internal
        override
    {
        _mint(_recipient, _tokenId);
    }
}
