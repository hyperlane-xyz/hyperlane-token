import { BigNumberish } from 'ethers';

import {
  ChainName,
  ChainNameToDomainId,
  GasRouterApp,
  RouterContracts,
} from '@hyperlane-xyz/sdk';
import { Address } from '@hyperlane-xyz/utils/dist/src/types';

import { HypERC20Contracts, HypERC721Contracts } from './contracts';
import { TokenRouter } from './types';

class HyperlaneTokenApp<
  Contracts extends RouterContracts<TokenRouter>,
  Chain extends ChainName,
> extends GasRouterApp<Contracts, Chain> {
  async transfer<Origin extends Chain>(
    origin: Origin,
    destination: Exclude<Chain, Origin>,
    recipient: Address,
    amountOrId: BigNumberish,
  ) {
    const originRouter = this.getContracts(origin).router;
    const destinationDomain = ChainNameToDomainId[destination];
    const gasPayment = await originRouter.quoteGasPayment(destinationDomain);
    const chainConnection = this.multiProvider.getChainConnection(origin);
    return chainConnection.handleTx(
      originRouter.transferRemote(destinationDomain, recipient, amountOrId, {
        value: gasPayment,
      }),
    );
  }
}

export class HypERC20App<Chain extends ChainName> extends HyperlaneTokenApp<
  HypERC20Contracts,
  Chain
> {
  async transfer<Origin extends Chain>(
    origin: Origin,
    destination: Exclude<Chain, Origin>,
    recipient: Address,
    amount: BigNumberish,
  ) {
    const originRouter = this.getContracts(origin).router;
    const chainConnection = this.multiProvider.getChainConnection(origin);
    const signerAddress = await chainConnection.signer!.getAddress();
    const balance = await originRouter.balanceOf(signerAddress);
    if (balance.lt(amount))
      throw new Error(
        `Signer ${signerAddress} has insufficient balance ${balance}, needs ${amount} on ${origin}`,
      );
    return super.transfer(origin, destination, recipient, amount);
  }
}

export class HypERC721App<Chain extends ChainName> extends HyperlaneTokenApp<
  HypERC721Contracts,
  Chain
> {
  async transfer<Origin extends Chain>(
    origin: Origin,
    destination: Exclude<Chain, Origin>,
    recipient: Address,
    tokenId: BigNumberish,
  ) {
    const originRouter = this.getContracts(origin).router;
    const chainConnection = this.multiProvider.getChainConnection(origin);
    const signerAddress = await chainConnection.signer!.getAddress();
    const owner = await originRouter.ownerOf(tokenId);
    if (signerAddress != owner)
      throw new Error(`Signer ${signerAddress} not owner of token ${tokenId} on ${origin}`);
    return super.transfer(origin, destination, recipient, tokenId);
  }
}
