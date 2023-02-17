import { BigNumberish } from 'ethers';

import { ChainName, GasRouterApp, RouterContracts } from '@hyperlane-xyz/sdk';
import { Address } from '@hyperlane-xyz/utils/dist/src/types';

import { HypERC20Contracts, HypERC721Contracts } from './contracts';
import { TokenRouter } from './types';

class HyperlaneTokenApp<
  Contracts extends RouterContracts<TokenRouter>,
> extends GasRouterApp<Contracts> {
  async transfer(
    origin: ChainName,
    destination: ChainName,
    recipient: Address,
    amountOrId: BigNumberish,
  ) {
    const originRouter = this.getContracts(origin).router;
    const destinationDomain = this.multiProvider.getDomainId(destination);
    const gasPayment = await originRouter.quoteGasPayment(destinationDomain);
    return this.multiProvider.handleTx(
      origin,
      originRouter.transferRemote(destinationDomain, recipient, amountOrId, {
        value: gasPayment,
      }),
    );
  }
}

export class HypERC20App extends HyperlaneTokenApp<HypERC20Contracts> {
  async transfer(
    origin: ChainName,
    destination: ChainName,
    recipient: Address,
    amount: BigNumberish,
  ) {
    const originRouter = this.getContracts(origin).router;
    const signerAddress = await this.multiProvider.getSignerAddress(origin);
    const balance = await originRouter.balanceOf(signerAddress);
    if (balance.lt(amount))
      throw new Error(
        `Signer ${signerAddress} has insufficient balance ${balance}, needs ${amount} on ${origin}`,
      );
    return super.transfer(origin, destination, recipient, amount);
  }
}

export class HypERC721App extends HyperlaneTokenApp<HypERC721Contracts> {
  async transfer(
    origin: ChainName,
    destination: ChainName,
    recipient: Address,
    tokenId: BigNumberish,
  ) {
    const originRouter = this.getContracts(origin).router;
    const signerAddress = await this.multiProvider.getSignerAddress(origin);
    const owner = await originRouter.ownerOf(tokenId);
    if (signerAddress != owner)
      throw new Error(
        `Signer ${signerAddress} not owner of token ${tokenId} on ${origin}`,
      );
    return super.transfer(origin, destination, recipient, tokenId);
  }
}
