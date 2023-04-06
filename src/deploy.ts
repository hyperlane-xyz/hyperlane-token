import {
  ChainMap,
  GasRouterDeployer,
  HyperlaneContracts,
  MultiProvider,
  objMap,
} from '@hyperlane-xyz/sdk';
import { RouterConfig } from '@hyperlane-xyz/sdk/dist/router/types';

import {
  ERC20Metadata,
  TokenConfig,
  TokenMetadata,
  TokenRouterConfig,
  TokenType,
  isCollateralConfig,
  isErc20Metadata,
  isSyntheticConfig,
} from './config';
import { isTokenMetadata } from './config';
import {
  HypERC20Factories,
  HypERC721Factories,
  TokenFactories,
  hypErc20Factories,
  hypErc721Factories,
} from './contracts';
import {
  ERC20__factory,
  ERC721EnumerableUpgradeable__factory,
  HypERC20,
  HypERC20Collateral,
  HypERC721,
  HypERC721Collateral,
  HypNativeCollateral,
} from './types';

abstract class TokenDeployer<
  Factories extends TokenFactories,
> extends GasRouterDeployer<TokenRouterConfig, Factories> {
  abstract fetchMetadata(config: ChainMap<TokenConfig>): Promise<TokenMetadata>;

  abstract gasOverheadDefault(config: TokenConfig): number;

  async deploy(configMap: ChainMap<TokenConfig & RouterConfig>) {
    const tokenMetadata = await this.fetchMetadata(configMap);
    const mergedConfig = objMap(configMap, (_, config) => {
      return {
        ...tokenMetadata,
        gas: this.gasOverheadDefault(config),
        ...config, // override with chain-specific config
      };
    });

    return super.deploy(mergedConfig);
  }
}

export class HypERC20Deployer extends TokenDeployer<HypERC20Factories> {
  constructor(multiProvider: MultiProvider) {
    super(multiProvider, hypErc20Factories);
  }

  async fetchMetadata(
    configMap: ChainMap<TokenRouterConfig>,
  ): Promise<ERC20Metadata> {
    for (const [chain, config] of Object.entries(configMap)) {
      if (isErc20Metadata(config)) {
        return config;
      } else if (isCollateralConfig(config)) {
        if (config.token) {
          const erc20 = ERC20__factory.connect(
            config.token,
            this.multiProvider.getProvider(chain),
          );

          const [name, symbol, totalSupply, decimals] = await Promise.all([
            erc20.name(),
            erc20.symbol(),
            erc20.totalSupply(),
            erc20.decimals(),
          ]);
          return { name, symbol, totalSupply, decimals };
        } else {
          // native collateral
          const chainMetadata = this.multiProvider.getChainMetadata(chain);

          if (chainMetadata.nativeToken) {
            return {
              totalSupply: 0,
              ...chainMetadata.nativeToken,
            };
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
        return 68_000;
      case TokenType.native:
        return 44_000;
      default:
        throw new Error('Invalid token type');
    }
  }

  router(contracts: HyperlaneContracts<HypERC20Factories>) {
    return Object.values<HypERC20 | HypERC20Collateral | HypNativeCollateral>(
      contracts,
    )[0];
  }

  async deployContracts(
    chain: string,
    config: TokenRouterConfig & ERC20Metadata,
  ): Promise<HyperlaneContracts<HypERC20Factories>> {
    if (
      config.type === TokenType.syntheticUri ||
      config.type === TokenType.collateralUri
    ) {
      throw new Error('Invalid token type');
    }

    const tokenRouter = await this.deployContract<typeof config.type>(
      chain,
      config.type,
      isSyntheticConfig(config)
        ? [config.decimals]
        : config.token ? [config.token] : [],
      isSyntheticConfig(config)
        ? [
            config.mailbox,
            config.interchainGasPaymaster,
            config.totalSupply,
            config.name,
            config.symbol,
          ]
        : [config.mailbox, config.interchainGasPaymaster],
    );

    return { [config.type]: tokenRouter } as any;
  }
}

export class HypERC721Deployer extends TokenDeployer<HypERC721Factories> {
  constructor(multiProvider: MultiProvider) {
    super(multiProvider, hypErc721Factories); // factories not used in deploy
  }

  async fetchMetadata(
    configMap: ChainMap<TokenRouterConfig>,
  ): Promise<TokenMetadata> {
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

  async deployContracts(
    chain: string,
    config: TokenRouterConfig & TokenMetadata,
  ): Promise<HyperlaneContracts<HypERC721Factories>> {
    if (config.type === TokenType.native) {
      throw new Error('Invalid token type');
    }

    const tokenRouter = await this.deployContract<typeof config.type>(
      chain,
      config.type,
      isCollateralConfig(config) ? [config.token!] : [],
      isCollateralConfig(config)
        ? [config.mailbox, config.interchainGasPaymaster]
        : [
            config.mailbox,
            config.interchainGasPaymaster,
            config.totalSupply,
            config.name,
            config.symbol,
          ],
    );

    return { [config.type]: tokenRouter } as any;
  }

  router(contracts: HyperlaneContracts<HypERC721Factories>) {
    return Object.values<HypERC721 | HypERC721Collateral>(contracts)[0];
  }
}
