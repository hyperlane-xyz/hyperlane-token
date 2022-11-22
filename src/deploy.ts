import {
  ChainMap,
  ChainName,
  HyperlaneCore,
  HyperlaneRouterDeployer,
  MultiProvider,
} from '@hyperlane-xyz/sdk';

import { HypERC20Config, HypERC721Config, HypWERC20Config } from './config';
import {
  HypERC20Contracts,
  HypERC20Factories,
  HypERC721Contracts,
  HypERC721Factories,
  hypERC20Factories,
  hypERC721Factories,
} from './contracts';
import { HypWERC20__factory, HypERC20__factory } from './types';

const isCollateralConfig = (config: HypERC20Config | HypWERC20Config): config is HypWERC20Config => {
  return (config as HypWERC20Config).token !== undefined;
}

export class HypERC20Deployer<
  Chain extends ChainName
> extends HyperlaneRouterDeployer<
  Chain,
  HypERC20Config | HypWERC20Config,
  HypERC20Contracts,
  HypERC20Factories
> {
  constructor(
    multiProvider: MultiProvider<Chain>,
    configMap: ChainMap<Chain, HypERC20Config | HypWERC20Config>,
    protected core: HyperlaneCore<Chain>
  ) {
    super(multiProvider, configMap, hypERC20Factories);
  }

  async deployContracts(_: Chain, config: HypERC20Config | HypWERC20Config) {
    if (isCollateralConfig(config))  {
      const router = await new HypWERC20__factory().deploy(config.token);
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
