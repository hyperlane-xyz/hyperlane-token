import {
  ChainMap,
  ChainName,
  HyperlaneCore,
  HyperlaneRouterDeployer,
  MultiProvider,
} from '@hyperlane-xyz/sdk';

import { HypERC20Config, HypERC721Config } from './config';
import {
  HypERC20Contracts,
  HypERC20Factories,
  HypERC721Contracts,
  HypERC721Factories,
  hypERC20Factories,
  hypERC721Factories,
} from './contracts';
import { HypWERC20__factory, HypERC20__factory } from './types';

export class HypERC20Deployer<
  Chain extends ChainName,
> extends HyperlaneRouterDeployer<
  Chain,
  HypERC20Config,
  HypERC20Contracts,
  HypERC20Factories
> {
  constructor(
    multiProvider: MultiProvider<Chain>,
    configMap: ChainMap<Chain, HypERC20Config>,
    protected core: HyperlaneCore<Chain>,
    protected collateral?: { chain: Chain, token: string }
  ) {
    super(multiProvider, configMap, hypERC20Factories);
  }

  async deployContracts(chain: Chain, config: HypERC20Config) {
    if (chain === this.collateral?.chain) {
      const router = await new HypWERC20__factory().deploy(this.collateral.token);
      await router.initialize(
        config.mailbox,
        config.interchainGasPaymaster,
        config.interchainSecurityModule
      )
      return { router };
    } else {
      const router = await new HypERC20__factory().deploy();
      await router.initialize(
        config.mailbox,
        config.interchainGasPaymaster,
        config.interchainSecurityModule,
        config.totalSupply,
        config.name,
        config.symbol,
      );
      return { router }
    }
  }
}

export class HypERC721Deployer<
  Chain extends ChainName,
> extends HyperlaneRouterDeployer<
  Chain,
  HypERC721Config,
  HypERC721Contracts,
  HypERC721Factories
> {
  constructor(
    multiProvider: MultiProvider<Chain>,
    configMap: ChainMap<Chain, HypERC721Config>,
    protected core: HyperlaneCore<Chain>,
  ) {
    super(multiProvider, configMap, hypERC721Factories);
  }

  async deployContracts(chain: Chain, config: HypERC721Config) {
    const router = await this.deployContract(chain, 'router', []);
    await router.initialize(
      config.mailbox,
      config.interchainGasPaymaster,
      config.interchainSecurityModule,
      config.mintAmount,
      config.name,
      config.symbol,
    );
    return {
      router,
    };
  }
}
