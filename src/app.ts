import { BigNumberish } from 'ethers';

import { ChainName, HyperlaneContracts, RouterApp } from '@hyperlane-xyz/sdk';
import { types } from '@hyperlane-xyz/utils';

import { TokenType } from './config';
import {
  HypERC20Factories,
  HypERC721Factories,
  TokenFactories,
} from './contracts';
import {
  HypERC20,
  HypERC20Collateral,
  HypERC721,
  HypERC721Collateral,
  HypNativeCollateral,
  TokenRouter,
} from './types';

abstract class HyperlaneTokenApp<
  Factories extends TokenFactories,
> extends RouterApp<Factories> {
  abstract router(contracts: HyperlaneContracts<Factories>): TokenRouter;

  async transfer(
    origin: ChainName,
    destination: ChainName,
    recipient: types.Address,
    amountOrId: BigNumberish,
  ) {
    const originRouter = this.router(this.getContracts(origin));
    const destProvider = this.multiProvider.getProvider(destination);
    const destinationNetwork = await destProvider.getNetwork();
    const gasPayment = await originRouter.quoteGasPayment(
      destinationNetwork.chainId,
    );
    return this.multiProvider.handleTx(
      origin,
      originRouter.transferRemote(
        destinationNetwork.chainId,
        recipient,
        amountOrId,
        {
          value: gasPayment,
        },
      ),
    );
  }
}

export class HypERC20App extends HyperlaneTokenApp<HypERC20Factories> {
  router(
    contracts: HyperlaneContracts<HypERC20Factories>,
  ): HypERC20 | HypERC20Collateral | HypNativeCollateral {
    return (
      contracts[TokenType.synthetic] ||
      contracts[TokenType.collateral] ||
      contracts[TokenType.native]
    );
  }

  async transfer(
    origin: ChainName,
    destination: ChainName,
    recipient: types.Address,
    amount: BigNumberish,
  ) {
    const originRouter = this.router(this.getContracts(origin));
    const signerAddress = await this.multiProvider.getSignerAddress(origin);
    const balance = await originRouter.balanceOf(signerAddress);
    if (balance.lt(amount))
      console.warn(
        `Signer ${signerAddress} has insufficient balance ${balance}, needs ${amount} on ${origin}`,
      );
    return super.transfer(origin, destination, recipient, amount);
  }
}

export class HypERC721App extends HyperlaneTokenApp<HypERC721Factories> {
  router(
    contracts: HyperlaneContracts<HypERC721Factories>,
  ): HypERC721 | HypERC721Collateral {
    return contracts[TokenType.synthetic] || contracts[TokenType.collateral];
  }

  async transfer(
    origin: ChainName,
    destination: ChainName,
    recipient: types.Address,
    tokenId: BigNumberish,
  ) {
    const originRouter = this.router(this.getContracts(origin));
    const signerAddress = await this.multiProvider.getSignerAddress(origin);
    const owner = await originRouter.ownerOf(tokenId);
    if (signerAddress != owner)
      console.warn(
        `Signer ${signerAddress} not owner of token ${tokenId} on ${origin}`,
      );
    return super.transfer(origin, destination, recipient, tokenId);
  }
}
