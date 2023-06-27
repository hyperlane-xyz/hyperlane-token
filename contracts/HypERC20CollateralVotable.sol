// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import "./HypERC20Collateral.sol";

interface IL1Token{
    function delegate(address delegatee) external;
}


contract HypERC20CollateralVotable is HypERC20Collateral{

    IL1Token L1Token;

    constructor(address _erc20) HypERC20Collateral(_erc20){
        L1Token = IL1Token(_erc20);
    }

    function delegateVotes(address _L1VoteDelegator) external {
        L1Token.delegate(_L1VoteDelegator);
    }
}