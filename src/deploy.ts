import {
  ChainMap,
  ChainName,
  GasRouterDeployer,
  HyperlaneContracts,
  MultiProvider,
  objMap,
} from '@hyperlane-xyz/sdk';
import { RouterConfig } from '@hyperlane-xyz/sdk/dist/router/types';

import {
  CollateralConfig,
  ERC20Metadata,
  TokenRouterConfig,
  SyntheticConfig,
  TokenConfig,
  TokenMetadata,
  TokenType,
  isCollateralConfig,
  isErc20Metadata,
  isSyntheticConfig,
  isUriConfig,
} from './config';
import { isTokenMetadata } from './config';
import { HypERC20Factories, HypERC721Factories, TokenFactories } from './contracts';
import {
  ERC20__factory,
  ERC721EnumerableUpgradeable__factory,
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
  HypNativeCollateral,
  HypNativeCollateral__factory,
  TokenRouter,
} from './types';

abstract class TokenDeployer extends GasRouterDeployer<
  TokenRouterConfig,
  any
> {
  abstract fetchMetadata(config: ChainMap<TokenConfig>): Promise<TokenMetadata>;

  abstract gasOverheadDefault(config: TokenConfig): number;

  abstract deployCollateral(
    chain: ChainName,
    config: CollateralConfig,
  ): Promise<TokenRouter>;

  abstract deploySynthetic(
    chain: ChainName,
    config: SyntheticConfig & TokenMetadata,
  ): Promise<TokenRouter>;

  async deployContracts(chain: ChainName, config: TokenConfig): Promise<HyperlaneContracts<TokenFactories>> {
    if (isCollateralConfig(config)) {
      const collateral = await this.deployCollateral(chain, config);
      return { collateral };
    } else if (isSyntheticConfig(config)) {
      const synthetic = await this.deploySynthetic(chain, config);
      return { synthetic };
    } else {
      throw new Error('Invalid token router config');
    }
  }

  async deploy(configMap: ChainMap<TokenConfig & RouterConfig>) {
    const tokenMetadata = await this.fetchMetadata(configMap);
    const mergedConfig = objMap(
      configMap,
      (_, config) => {
        return {
          ...tokenMetadata,
          gas: this.gasOverheadDefault(config),
          ...config, // override with chain-specific config
        };
      },
    );

    return super.deploy(mergedConfig);
  }
}


export class HypERC20Deployer extends TokenDeployer {
  constructor(multiProvider: MultiProvider) {
    super(multiProvider, {} as HypERC20Factories); // factories not used in deploy
  }

    async fetchMetadata(configMap: ChainMap<TokenRouterConfig>): Promise<ERC20Metadata> {
      for (const [chain, config] of Object.entries(configMap)) {
        if (isErc20Metadata(config)) {
          return config;
        } else if (isCollateralConfig(config)) {
          if (config.token) {
            const erc20 = ERC20__factory.connect(config.token, this.multiProvider.getProvider(chain));
            
            const [name, symbol, totalSupply, decimals] = await Promise.all([
              erc20.name(),
              erc20.symbol(),
              erc20.totalSupply(),
              erc20.decimals(),
            ]);
          return { name, symbol, totalSupply, decimals };
        } else { // native collateral
          const chainMetadata = this.multiProvider.getChainMetadata(chain);

          if (chainMetadata.nativeToken) {
            return {
              totalSupply: 0,
              ...chainMetadata.nativeToken
            }
          }
        }
      }
    }

    throw new Error('No ERC20 metadata found');
  }

  gasOverheadDefault(config: TokenConfig): number {
    switch (config.type) {
      case TokenType.synthetic:
        return 64_000;
      case TokenType.collateral:
        return config.token ? 68_000 : 44_000;
      default:
        throw new Error('Invalid token type');
    }
  }

  async deployCollateral(
    chain: ChainName,
    config: CollateralConfig & RouterConfig,
  ): Promise<HypERC20Collateral | HypNativeCollateral> {
    let collateral: HypERC20Collateral | HypNativeCollateral;
    if (config.token) {
      collateral = await this.deployContractFromFactory(
        chain,
        new HypERC20Collateral__factory(),
        'HypERC20Collateral',
        [config.token],
      );
    } else {
      collateral = await this.deployContractFromFactory(
        chain,
        new HypNativeCollateral__factory(),
        'HypNativeCollateral',
        [],
      );
    }
    await this.multiProvider.handleTx(
      chain,
      collateral.initialize(config.mailbox, config.interchainGasPaymaster),
    );
    return collateral;
  }

  async deploySynthetic(
    chain: ChainName,
    config: SyntheticConfig & ERC20Metadata & RouterConfig,
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

  router(contracts: HyperlaneContracts<HypERC20Factories>) {
    return Object.values<HypERC20 | HypERC20Collateral | HypNativeCollateral>(contracts)[0];
  }
}

export class HypERC721Deployer extends TokenDeployer {
  constructor(multiProvider: MultiProvider) {
    super(multiProvider, {} as HypERC721Factories); // factories not used in deploy
  }

  async fetchMetadata(configMap: ChainMap<TokenRouterConfig>): Promise<TokenMetadata> {
    for (const [chain, config] of Object.entries(configMap)) {
      if (isTokenMetadata(config)) {
        return config;
      } else if (isCollateralConfig(config)) {
        if (config.token) {
          const erc721 = ERC721EnumerableUpgradeable__factory.connect(
            config.token,
            this.multiProvider.getProvider(chain),
          );
          const [name, symbol, totalSupply] = await Promise.all([
            erc721.name(),
            erc721.symbol(),
            erc721.totalSupply(),
          ]);
      
          return { name, symbol, totalSupply };
        } 
      }
    }

    throw new Error('No ERC721 metadata found');
  }

  gasOverheadDefault(config: TokenConfig): number {
    switch (config.type) {
      case TokenType.synthetic:
        return 160_000;
      case TokenType.syntheticUri:
        return 163_000;
      case TokenType.collateral:
      case TokenType.collateralUri:
        return 80_000;
      default:
        throw new Error('Invalid ERC721 token type');
    }
  }

  async deployCollateral(
    chain: ChainName,
    config: CollateralConfig & RouterConfig,
  ): Promise<HypERC721Collateral> {
    if (!config.token) {
      throw new Error('Collateral config invalid');
    }

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

  async deploySynthetic(
    chain: ChainName,
    config: SyntheticConfig & RouterConfig,
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

  router(contracts: HyperlaneContracts<HypERC721Factories>) {
    return Object.values<HypERC721 | HypERC721Collateral>(contracts)[0];
  }
}
