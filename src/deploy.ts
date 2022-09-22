import {
  ChainMap,
  ChainName,
  HyperlaneCore,
  HyperlaneRouterDeployer,
  MultiProvider,
} from '@hyperlane-xyz/sdk';

import {
  HplERC20Contracts,
  HplERC20Factories,
  hplERC20Factories,
  HplERC721Contracts,
  hplERC721Factories,
  HplERC721Factories,
} from './contracts';

import { HplERC20Config, HplERC721Config } from './config';

export class HplERC20Deployer<
  Chain extends ChainName,
> extends HyperlaneRouterDeployer<
  Chain,
  HplERC20Config,
  HplERC20Contracts,
  HplERC20Factories
> {
  constructor(
    multiProvider: MultiProvider<Chain>,
    configMap: ChainMap<Chain, HplERC20Config>,
    protected core: HyperlaneCore<Chain>,
  ) {
    super(multiProvider, configMap, hplERC20Factories);
  }

  async deployContracts(chain: Chain, config: HplERC20Config) {
    const router = await this.deployContract(chain, 'router', []);
    await router.initialize(
      config.connectionManager,
      config.interchainGasPaymaster,
      config.totalSupply,
      config.name,
      config.symbol,
    );
    return {
      router,
    };
  }
}

export class HplERC721Deployer<
  Chain extends ChainName,
> extends HyperlaneRouterDeployer<
  Chain,
  HplERC721Config,
  HplERC721Contracts,
  HplERC721Factories
> {
  constructor(
    multiProvider: MultiProvider<Chain>,
    configMap: ChainMap<Chain, HplERC721Config>,
    protected core: HyperlaneCore<Chain>,
  ) {
    super(multiProvider, configMap, hplERC721Factories);
  }

  async deployContracts(chain: Chain, config: HplERC721Config) {
    const router = await this.deployContract(chain, 'router', []);
    await router.initialize(
      config.connectionManager,
      config.interchainGasPaymaster,
      config.mintAmount,
      config.name,
      config.symbol,
    );
    return {
      router,
    };
  }
}
