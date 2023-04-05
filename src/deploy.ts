import { providers } from 'ethers';

import {
  ChainMap,
  ChainName,
  GasRouterDeployer,
  HyperlaneContracts
} from '@hyperlane-xyz/sdk';

import {
  CollateralConfig,
  ERC20Metadata,
  HypERC20CollateralConfig,
  HypERC20Config,
  HypERC721CollateralConfig,
  HypERC721Config,
  HypNativeConfig,
  TokenMetadata,
  isCollateralConfig,
  isErc20Metadata,
  isNativeConfig,
  isSyntheticConfig,
  isUriConfig,
} from './config';
import { HypERC20Factories, HypERC721Factories } from './contracts';
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
  HypNative,
  HypNative__factory,
} from './types';
import { isTokenMetadata } from './config';

export class HypERC20Deployer extends GasRouterDeployer<
  HypERC20Config,
  HypERC20Factories
> {
  tokenMetadata: ERC20Metadata | undefined;

  static async fetchMetadata(
    provider: providers.Provider,
    config: CollateralConfig,
  ): Promise<ERC20Metadata> {
    const erc20 = ERC20__factory.connect(config.token, provider);
    const name = await erc20.name();
    const symbol = await erc20.symbol();
    const totalSupply = await erc20.totalSupply();
    const decimals = await erc20.decimals();

    return { name, symbol, totalSupply, decimals };
  }

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
    metadata: ERC20Metadata
  ): Promise<HypERC20> {
    const router = await this.deployContractFromFactory(
      chain,
      new HypERC20__factory(),
      'HypERC20',
      [metadata.decimals],
    );
    await this.multiProvider.handleTx(
      chain,
      router.initialize(
        config.mailbox,
        config.interchainGasPaymaster,
        metadata.totalSupply,
        metadata.name,
        metadata.symbol,
      ),
    );
    return router;
  }

  router(contracts: HyperlaneContracts<HypERC20Factories>) {
    return contracts.router;
  }

  async deployContracts(chain: ChainName, config: HypERC20Config) {
    let router: HypERC20 | HypERC20Collateral | HypNative;
    if (isCollateralConfig(config)) {
      router = await this.deployCollateral(chain, config);
    } else if (isNativeConfig(config)) {
      router = await this.deployNative(chain, config);
    } else if (isSyntheticConfig(config)) {
      if (!isErc20Metadata(this.tokenMetadata)) {
        throw new Error('Invalid synthetic token metadata');
      }
      router = await this.deploySynthetic(chain, config, this.tokenMetadata);
    } else {
      throw new Error('Invalid ERC20 token router config');
    }
    return { router };
  }

  async buildTokenMetadata(configMap: ChainMap<HypERC20Config>): Promise<ERC20Metadata | undefined> {
    let tokenMetadata: ERC20Metadata | undefined;

    for (const [chain, config] of Object.entries(configMap)) {
      if (isCollateralConfig(config)) {
        const collateralMetadata = await HypERC20Deployer.fetchMetadata(
          this.multiProvider.getProvider(chain),
          config,
        );
        tokenMetadata = {
          ...collateralMetadata,
          totalSupply: 0,
        }
      } else if (isNativeConfig(config)) {
        const chainMetadata = this.multiProvider.getChainMetadata(chain);
        if (chainMetadata.nativeToken) {
          tokenMetadata = {
            totalSupply: 0,
            ...chainMetadata.nativeToken,
          };
        }
      } else if (isErc20Metadata(config)) {
        tokenMetadata = config;
      }
    }

    return tokenMetadata;
  }

  async deploy(configMap: ChainMap<HypERC20Config>) {
    this.tokenMetadata = await this.buildTokenMetadata(configMap);

    if (!this.tokenMetadata) {
      throw new Error('No ERC20 token metadata found');
    } else {
      this.logger('Found synthetic token metadata:', this.tokenMetadata);
    }

    return super.deploy(configMap);
  }
}

export class HypERC721Deployer extends GasRouterDeployer<
  HypERC721Config,
  HypERC721Factories
> {
  tokenMetadata: TokenMetadata | undefined;

  static async fetchMetadata(
    provider: providers.Provider,
    config: CollateralConfig,
  ): Promise<TokenMetadata> {
    const erc721 = ERC721EnumerableUpgradeable__factory.connect(
      config.token,
      provider,
    );
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
    config: HypERC721Config,
    metadata: TokenMetadata,
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
        metadata.totalSupply,
        metadata.name,
        metadata.symbol,
      ),
    );
    return router;
  }

  router(contracts: HyperlaneContracts<HypERC721Factories>) {
    return contracts.router;
  }

  async deployContracts(chain: ChainName, config: HypERC721Config) {
    let router: HypERC721 | HypERC721Collateral;
    if (isCollateralConfig(config)) {
      router = await this.deployCollateral(chain, config);
    } else if (isSyntheticConfig(config)) {
      if (!isTokenMetadata(this.tokenMetadata)) {
        throw new Error('Invalid synthetic token metadata');
      }
      router = await this.deploySynthetic(chain, config, this.tokenMetadata);
    } else {
      throw new Error('Invalid ERC721 token router config');
    }
    return { router };
  }

  async buildTokenMetadata(configMap: ChainMap<HypERC20Config>): Promise<TokenMetadata | undefined> {
    let tokenMetadata: TokenMetadata | undefined;

    for (const [chain, config] of Object.entries(configMap)) {
      if (isCollateralConfig(config)) {
        const collateralMetadata = await HypERC20Deployer.fetchMetadata(
          this.multiProvider.getProvider(chain),
          config,
        );
        tokenMetadata = {
          ...collateralMetadata,
          totalSupply: 0,
        }
      } else if (isTokenMetadata(config)) {
        tokenMetadata = config;
      }
    }

    return tokenMetadata;
  }

  async deploy(configMap: ChainMap<HypERC721Config>) {
    this.tokenMetadata = await this.buildTokenMetadata(configMap);
  
    if (!this.tokenMetadata) {
      throw new Error('No ERC20 token metadata found');
    } else {
      this.logger('Found synthetic token metadata:', this.tokenMetadata);
    }

    return super.deploy(configMap);
  }
}
