import { ChainName, GasRouterDeployer } from '@hyperlane-xyz/sdk';

import {
  HypERC20CollateralConfig,
  HypERC20Config,
  HypERC721CollateralConfig,
  HypERC721Config,
  isCollateralConfig,
  isUriConfig,
} from './config';
import { HypERC20Contracts, HypERC721Contracts } from './contracts';
import {
  HypERC20Collateral__factory,
  HypERC20__factory,
  HypERC721Collateral__factory,
  HypERC721URICollateral__factory,
  HypERC721URIStorage__factory,
  HypERC721__factory,
} from './types';

export class HypERC20Deployer extends GasRouterDeployer<
  HypERC20Config | HypERC20CollateralConfig,
  HypERC20Contracts,
  any // RouterFactories doesn't work well when router has multiple types
> {
  async deployContracts(
    chain: ChainName,
    config: HypERC20Config | HypERC20CollateralConfig,
  ) {
    if (isCollateralConfig(config)) {
      const router = await this.deployContractFromFactory(
        chain,
        new HypERC20Collateral__factory(),
        'HypERC20Collateral',
        [config.token],
      );
      await this.multiProvider.handleTx(
        chain,
        router.initialize(config.mailbox, config.interchainGasPaymaster),
      );
      return { router };
    } else {
      const router = await this.deployContractFromFactory(
        chain,
        new HypERC20__factory(),
        'HypERC20',
        [],
      );
      await this.multiProvider.handleTx(
        chain,
        router.initialize(
          config.mailbox,
          config.interchainGasPaymaster,
          config.totalSupply,
          config.name,
          config.symbol,
        ),
      );
      return { router };
    }
  }
}

// TODO: dedupe?
export class HypERC721Deployer extends GasRouterDeployer<
  HypERC721Config | HypERC721CollateralConfig,
  HypERC721Contracts,
  any
> {
  async deployContracts(
    chain: ChainName,
    config: HypERC721Config | HypERC721CollateralConfig,
  ) {
    if (isCollateralConfig(config)) {
      const router = await this.deployContractFromFactory(
        chain,
        isUriConfig(config)
          ? new HypERC721URICollateral__factory()
          : new HypERC721Collateral__factory(),
        `HypERC721${isUriConfig(config) ? 'URI' : ''}Collateral`,
        [config.token],
      );
      await this.multiProvider.handleTx(
        chain,
        router.initialize(config.mailbox, config.interchainGasPaymaster),
      );
      return { router };
    } else {
      const router = await this.deployContractFromFactory(
        chain,
        isUriConfig(config)
          ? new HypERC721URIStorage__factory()
          : new HypERC721__factory(),
        `HypERC721${isUriConfig(config) ? 'URIStorage' : ''}`,
        [],
      );
      await this.multiProvider.handleTx(
        chain,
        router.initialize(
          config.mailbox,
          config.interchainGasPaymaster,
          config.totalSupply,
          config.name,
          config.symbol,
        ),
      );
      return { router };
    }
  }
}
