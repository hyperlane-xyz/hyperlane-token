// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {NFTRouter} from "./libs/NFTRouter.sol";

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title Collateralize ERC20 token and route messages to HypERC20 tokens.
 * @author Abacus Works
 */
contract HypERC721Collateral is NFTRouter {
    ERC721URIStorage public immutable wrappedToken;

    constructor(address erc721) {
        wrappedToken = ERC721URIStorage(erc721);
    }

    function initialize(
        address _connectionManager,
        address _interchainGasPaymaster
    ) external initializer {
        __AbacusConnectionClient_initialize(
            _connectionManager,
            _interchainGasPaymaster
        );
    }

    function _transferFromSender(uint256 _tokenId) internal override {
        wrappedToken.transferFrom(msg.sender, address(this), _tokenId);
    }

    function _transferTo(address _recipient, uint256 _tokenId, string calldata)
        internal
        override
    {
        wrappedToken.transferFrom(address(this), _recipient, _tokenId);
    }
}
