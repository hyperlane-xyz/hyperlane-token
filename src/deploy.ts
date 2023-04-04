import {
  ChainMap,
  ChainName,
  GasRouterConfig,
  GasRouterDeployer,
  MultiProvider,
  objMap,
} from '@hyperlane-xyz/sdk';
import { DeployerOptions } from '@hyperlane-xyz/sdk/dist/deploy/HyperlaneDeployer';
import { objFilter } from '@hyperlane-xyz/sdk/dist/utils/objects';

import {
  CollateralConfig,
  ERC20Metadata,
  HypERC20CollateralConfig,
  HypERC20Config,
  HypERC721CollateralConfig,
  HypERC721Config,
  HypNativeConfig,
  NativeConfig,
  SyntheticConfig,
  TokenConfig,
  TokenMetadata,
  isCollateralConfig,
  isErc20Metadata,
  isNativeConfig,
  isSyntheticConfig,
  isTokenMetadata,
  isUriConfig,
} from './config';
import { HypERC20Contracts, HypERC721Contracts } from './contracts';
import {
  ERC20__factory,
  ERC721EnumerableUpgradeable__factory,
  ERC721__factory,
  HypERC20,
  HypERC20Collateral,
  HypERC20Collateral__factory,
  HypERC20__factory,
  HypERC721,
  HypERC721Collateral,
  HypERC721Collateral__factory,
  HypERC721URICollateral__factory,
  HypERC721URIStorage__factory,
  HypERC721__factory,
  HypNative,
  HypNative__factory,
  TokenRouter,
} from './types';
import { providers } from 'ethers';

enum TokenType {
  erc20 = 'erc20',
  erc721 = 'erc721',
}

const gasDefaults = (config: TokenConfig, tokenType: TokenType) => {
  switch (tokenType) {
    case TokenType.erc721:
      switch (config.type) {
        case 'synthetic':
          return 160_000;
        case 'syntheticUri':
          return 163_000;
        case 'collateral':
        case 'collateralUri':
        default:
          return 80_000;
      }
    default:
    case TokenType.erc20:
      switch (config.type) {
        case 'synthetic':
          return 64_000;
        case 'native':
          return 44_000;
        case 'collateral':
        default:
          return 69_000;
      }
  }
};

export class HypERC20Deployer extends GasRouterDeployer<
  HypERC20Config,
  HypERC20Contracts,
  any
> {
  protected async deployCollateral(
    chain: ChainName,
    config: HypERC20CollateralConfig,
  ): Promise<HypERC20Collateral> {
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
    return router;
  }

  protected async deployNative(
    chain: ChainName,
    config: HypNativeConfig,
  ): Promise<HypNative> {
    const router = await this.deployContractFromFactory(
      chain,
      new HypNative__factory(),
      'HypNative',
      [],
    );
    await this.multiProvider.handleTx(
      chain,
      router.initialize(config.mailbox, config.interchainGasPaymaster),
    );
    return router;
  }

  protected async deploySynthetic(
    chain: ChainName,
    config: HypERC20Config,
  ): Promise<HypERC20> {
    const router = await this.deployContractFromFactory(
      chain,
      new HypERC20__factory(),
      'HypERC20',
      [config.decimals],
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
    return router;
  }

  async deployContracts(chain: ChainName, config: HypERC20Config) {
    let router: HypERC20 | HypERC20Collateral | HypNative;
    if (isCollateralConfig(config)) {
      router = await this.deployCollateral(chain, config);
    } else if (isNativeConfig(config)) {
      router = await this.deployNative(chain, config);
    } else if (isSyntheticConfig(config)) {
      router = await this.deploySynthetic(chain, config);
    } else {
      throw new Error('Invalid ERC20 token router config');
    }
    return { router };
  }
}

export class HypERC721Deployer extends GasRouterDeployer<
  HypERC721Config,
  HypERC721Contracts,
  any
> {
  static async fetchMetadata(provider: providers.Provider, config: CollateralConfig): Promise<TokenMetadata> {
    const erc721 = ERC721EnumerableUpgradeable__factory.connect(config.token, provider);
    const name = await erc721.name();
    const symbol = await erc721.symbol();
    const totalSupply = await erc721.totalSupply();
    return { name, symbol, totalSupply };
  }

  protected async deployCollateral(
    chain: ChainName,
    config: HypERC721CollateralConfig,
  ): Promise<HypERC721Collateral> {
    let router: HypERC721Collateral;
    if (isUriConfig(config)) {
      router = await this.deployContractFromFactory(
        chain,
        new HypERC721URICollateral__factory(),
        'HypERC721URICollateral',
        [config.token],
      );
    } else {
      router = await this.deployContractFromFactory(
        chain,
        new HypERC721Collateral__factory(),
        'HypERC721Collateral',
        [config.token],
      );
    }
    await this.multiProvider.handleTx(
      chain,
      router.initialize(config.mailbox, config.interchainGasPaymaster),
    );
    return router;
  }

  protected async deploySynthetic(
    chain: ChainName,
    config: HypERC721Config
  ): Promise<HypERC721> {
    let router: HypERC721;
    if (isUriConfig(config)) {
      router = await this.deployContractFromFactory(
        chain,
        new HypERC721URIStorage__factory(),
        'HypERC721URIStorage',
        [],
      );
    } else {
      router = await this.deployContractFromFactory(
        chain,
        new HypERC721__factory(),
        'HypERC721',
        [],
      );
    }
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
    return router;
  }

  async deployContracts(chain: ChainName, config: HypERC721Config) {
    let router: HypERC721 | HypERC721Collateral;
    if (isCollateralConfig(config)) {
      router = await this.deployCollateral(chain, config);
    } else if (isSyntheticConfig(config)) {
      router = await this.deploySynthetic(chain, config);
    } else {
      throw new Error('Invalid ERC721 token router config');
    }
    return { router };
  }
}
