// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Create2Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/Create2Upgradeable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import {Router} from "@hyperlane-xyz/core/contracts/Router.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import {HypERC20} from "./HypERC20.sol";
import {HypERC20Collateral} from "./HypERC20Collateral.sol";

contract TokenBridge is Router {
    using TypeCasts for address;
    using TypeCasts for bytes32;

    event CollateralCreated(
        address indexed canonical,
        address collateral
    );

    event SyntheticCreated(
        uint32 indexed canonical,
        address indexed collateral,
        address synthetic
    );

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
        bytes32 salt = erc20.addressToBytes32();
        bytes memory bytecode = abi.encodePacked(
            type(HypERC20Collateral).creationCode,
            abi.encode(erc20)
        );
        bytes32 bytecodeHash = keccak256(bytecode);
        address collateral = Create2Upgradeable.computeAddress(salt, bytecodeHash);

        if (!Address.isContract(collateral)) {
            collateral = Create2Upgradeable.deploy(0, salt, bytecode);
            HypERC20Collateral(collateral).initialize(
                address(mailbox),
                address(interchainGasPaymaster),
                address(interchainSecurityModule)
            );
            emit CollateralCreated(erc20, collateral);
        }

        return HypERC20Collateral(collateral);
    }

    function _syntheticSalt(
        uint32 canonical,
        address collateral
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(collateral, canonical));
    }

    function _synthetic(
        uint32 canonical,
        address collateral,
        uint32 destination
    ) internal view returns (address) {
        return Create2Upgradeable.computeAddress({
            salt: _syntheticSalt(canonical, collateral),
            bytecodeHash: keccak256(type(HypERC20).creationCode),
            deployer: routers[destination].bytes32ToAddress()
        });
    }

    function bridge(
        address erc20,
        uint32 destination
    ) external payable {
        _mustHaveRemoteRouter(destination);

        HypERC20Collateral collateral = collateralize(erc20);

        bytes32 router = collateral.routers(destination);
        require(router == bytes32(0), "destination not new");
        
        // fetch token metadata
        string memory name = IERC20Metadata(erc20).name();
        string memory symbol = IERC20Metadata(erc20).symbol();
        bytes memory message = abi.encode(
            address(collateral),
            name,
            symbol
        );

        // dispatch synthetic deployment
        _dispatchWithGas(destination, message, msg.value);

        // *optimistically* update router with synthetic deployment
        address synthetic = _synthetic(mailbox.localDomain(), address(collateral), destination);
        collateral.enrollRemoteRouter(destination, synthetic.addressToBytes32());
    }

    function synthesize(
        uint32 origin,
        bytes32 collateral, // HypERC20Collateral on origin chain
        string memory name,
        string memory symbol
    ) internal {
        address collateralAddress = collateral.bytes32ToAddress();
        bytes32 salt = _syntheticSalt({
            canonical: origin,
            collateral: collateralAddress
        });
        HypERC20 synthetic = new HypERC20{salt: salt}();
        synthetic.initialize(
            address(mailbox),
            address(interchainGasPaymaster),
            address(interchainSecurityModule),
            0, //total supply
            name,
            symbol
        );
        synthetic.enrollRemoteRouter(origin, collateral);
        emit SyntheticCreated(origin, collateralAddress, address(synthetic));
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
        synthesize(_origin, collateral, name, symbol);
    }
}
