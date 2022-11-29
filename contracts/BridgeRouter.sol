// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {Router} from "@hyperlane-xyz/core/contracts/Router.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import {HypERC20} from "./HypERC20.sol";
import {HypERC20Collateral} from "./HypERC20Collateral.sol";

contract TokenBridge is Router {
    using TypeCasts for address;

    function initialize(
        address _mailbox,
        address _interchainGasPaymaster,
        address _interchainSecurityModule
    ) external initializer {
        // transfers ownership to `msg.sender`
        __HyperlaneConnectionClient_initialize(
            _mailbox,
            _interchainGasPaymaster,
            _interchainSecurityModule
        );
    }

    function collateralize(
        address erc20
    ) public returns (HypERC20Collateral) {
        // TODO: CREATE2
        HypERC20Collateral collateral = new HypERC20Collateral(erc20);
        collateral.initialize(
            address(mailbox),
            address(interchainGasPaymaster),
            address(interchainSecurityModule)
        );
        return collateral;
    }

    function bridge(
        address erc20,
        uint32[] calldata destinations
    ) external {
        // 1. deploy collateral contract
        HypERC20Collateral collateral = collateralize(erc20);
        
        string memory name = IERC20Metadata(erc20).name();
        string memory symbol = IERC20Metadata(erc20).symbol();
        bytes memory message = abi.encode(
            collateral,
            name,
            symbol
        );

        // 2. dispatch deployments on destination chains
        for (uint256 i = 0; i < destinations.length; i++) {
            uint32 destination = destinations[i];

            // if synth doesn't already exist for destination, create it
            bytes32 router = collateral.routers(destination);
            if (router != bytes32(0)) {
                _dispatch(destination, message);
                // TODO: compute router address and enroll
                // _enrollRemoteRouter(destination, )
            }
        }
    }

    function synthesize(
        uint32 origin,
        bytes32 collateral,
        string memory name,
        string memory symbol
    ) internal returns (HypERC20) {
        // TODO: CREATE2 
        HypERC20 synth = new HypERC20();
        synth.initialize(
            address(mailbox),
            address(interchainGasPaymaster),
            address(interchainSecurityModule),
            0, //total supply
            name,
            symbol
        );
        synth.enrollRemoteRouter(origin, collateral);
        return synth;
    }

    function _handle(
        uint32 _origin,
        bytes32,
        bytes calldata _message
    ) internal override {
        (bytes32 collateral, string memory name, string memory symbol) = abi.decode(
            _message,
            (bytes32, string, string)
        );
        HypERC20 synth = synthesize(_origin, collateral, name, symbol);
    }
}
