// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {HypERC721Collateral} from "../HypERC721Collateral.sol";

import {IERC721MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol";

/**
 * @title Collateralize ERC20 token and route messages to HypERC20 tokens.
 * @author Abacus Works
 */
contract HypERC721URICollateral is HypERC721Collateral {
    constructor(address erc721) HypERC721Collateral(erc721) {}

    function _transferFromSender(uint256 _tokenId) internal override returns (bytes memory) {
        HypERC721Collateral._transferFromSender(_tokenId);
        return bytes(IERC721MetadataUpgradeable(wrappedToken).tokenURI(_tokenId));
    }
}
