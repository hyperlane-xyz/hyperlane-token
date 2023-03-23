import {
  ChainMap,
  ChainName,
  GasRouterConfig,
  GasRouterDeployer,
  MultiProvider,
  objMap,
} from '@hyperlane-xyz/sdk';
import { DeployerOptions } from '@hyperlane-xyz/sdk/dist/deploy/HyperlaneDeployer';

import {
  CollateralConfig,
  HypERC20Config,
  HypERC721Config,
  SyntheticConfig,
  TokenConfig,
  isCollateralConfig,
  isNativeConfig,
  isSyntheticConfig,
  isUriConfig,
  NativeConfig,
  isTokenMetadata,
  ERC20Metadata,
  isErc20Metadata,
  TokenMetadata,
} from './config';
import { HypERC20Contracts, HypERC721Contracts } from './contracts';
import {
  ERC20__factory,
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
} from './types';

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
  HypERC20Config & GasRouterConfig,
  HypERC20Contracts,
  any // RouterFactories doesn't work well when router has multiple types
> {
  tokenMetadata?: ERC20Metadata;

  constructor(
    multiProvider: MultiProvider,
    configMap: ChainMap<HypERC20Config>,
    factories: any,
    options?: DeployerOptions,
  ) {
    super(
      multiProvider,
      objMap(
        configMap,
        (_, config): HypERC20Config & GasRouterConfig =>
          ({
            ...config,
            gas: config.gas ?? gasDefaults(config, TokenType.erc20),
          } as HypERC20Config & GasRouterConfig),
      ),
      factories,
      options,
    );
  }

  protected async deployCollateral(
    chain: ChainName,
    config: CollateralConfig & HypERC20Config,
  ): Promise<HypERC20Collateral> {
    this.logger(`Deploying collateral router on ${chain}...`);
    const erc20 = new ERC20__factory()
      .attach(config.token)
      .connect(this.multiProvider.getProvider(chain));

    const decimals = await erc20.decimals();
    const name = await erc20.name();
    const symbol = await erc20.symbol();
    const totalSupply = 0; // synthetic tokens are minted on demand

    this.tokenMetadata = { decimals, name, symbol, totalSupply };

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
    config: NativeConfig & HypERC20Config,
  ): Promise<HypNative> {
    this.logger(`Deploying native router on ${chain}...`);
    const nativeToken = this.multiProvider.getChainMetadata(chain).nativeToken;

    if (nativeToken) {
      this.tokenMetadata = { ...nativeToken, totalSupply: 0 };
    }

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
    config: SyntheticConfig & HypERC20Config,
    tokenMetadata: ERC20Metadata
  ): Promise<HypERC20> {
    this.logger(`Deploying synthetic router on ${chain}...`);
    const router = await this.deployContractFromFactory(
      chain,
      new HypERC20__factory(),
      'HypERC20',
      [tokenMetadata.decimals],
    );
    await this.multiProvider.handleTx(
      chain,
      router.initialize(
        config.mailbox,
        config.interchainGasPaymaster,
        tokenMetadata.totalSupply,
        tokenMetadata.name,
        tokenMetadata.symbol,
      ),
    );
    return router;
  }

  async deploy(
    partialDeployment?: ChainMap<HypERC20Contracts>,
  ): Promise<ChainMap<HypERC20Contracts>> {
    // deploy collateral or native first to populate token metadata for synthetics
    for (const [chain, config] of Object.entries(this.configMap)) {
      if (isCollateralConfig(config)) {
        this.deployedContracts[chain] = {
          router: await this.deployCollateral(chain as ChainName, config)
        };
      } else if (isNativeConfig(config)) {
        this.deployedContracts[chain] = {
          router: await this.deployNative(chain as ChainName, config)
        };
      }
    }

    // deploy synthetics
    return super.deploy({ ...partialDeployment, ...this.deployedContracts });
  }

  async deployContracts(chain: ChainName, config: HypERC20Config) {
    // skip if already deployed
    if (this.deployedContracts[chain]) {
      return this.deployedContracts[chain];
    }

    if (!isSyntheticConfig(config)) {
      throw new Error('Expect only synthetic configs');
    }

    const erc20Metadata = {...this.tokenMetadata, ...config };
    if (!isErc20Metadata(erc20Metadata)) {
      throw new Error(`ERC20 metadata not populated for ${chain}`);
    }

    const router = await this.deploySynthetic(chain, config, erc20Metadata);
    return { router };
  }
}

// TODO: dedupe?
export class HypERC721Deployer extends GasRouterDeployer<
  HypERC721Config & GasRouterConfig,
  HypERC721Contracts,
  any
> {
  tokenMetadata?: TokenMetadata;

  constructor(
    multiProvider: MultiProvider,
    configMap: ChainMap<HypERC721Config>,
    factories: any,
    options?: DeployerOptions,
  ) {
    super(
      multiProvider,
      objMap(
        configMap,
        (_, config): HypERC721Config & GasRouterConfig =>
          ({
            ...config,
            gas: config.gas ?? gasDefaults(config, TokenType.erc721),
          } as HypERC721Config & GasRouterConfig),
      ),
      factories,
      options,
    );
  }

  protected async deployCollateral(
    chain: ChainName,
    config: CollateralConfig & HypERC721Config,
  ): Promise<HypERC721Collateral> {
    this.logger(`Deploying collateral router on ${chain}...`);

    const erc721 = ERC721__factory.connect(config.token, this.multiProvider.getProvider(chain));
    const name = await erc721.name();
    const symbol = await erc721.symbol();
    const totalSupply = 0; // synthetic tokens are minted on demand
    this.tokenMetadata = { name, symbol, totalSupply };

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
    return router;
  }

  protected async deploySynthetic(
    chain: ChainName,
    config: HypERC721Config & SyntheticConfig,
    tokenMetadata: TokenMetadata
  ): Promise<HypERC721> {
    this.logger(`Deploying synthetic router on ${chain}...`);
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
        tokenMetadata.totalSupply,
        tokenMetadata.name,
        tokenMetadata.symbol,
      ),
    );
    return router;
  }

  async deploy(
    partialDeployment?: ChainMap<HypERC721Contracts>,
  ): Promise<ChainMap<HypERC721Contracts>> {
    // deploy collateral first to populate token metadata for synthetics
    for (const [chain, config] of Object.entries(this.configMap)) {
      if (isCollateralConfig(config)) {
        this.deployedContracts[chain] = {
          router: await this.deployCollateral(chain as ChainName, config)
        };
      }
    }

    // deploy synthetics
    return super.deploy({ ...partialDeployment, ...this.deployedContracts });
  }

  async deployContracts(chain: ChainName, config: HypERC721Config) {
    // skip if already deployed
    if (this.deployedContracts[chain]) {
      return this.deployedContracts[chain];
    }

    if (!isSyntheticConfig(config)) {
      throw new Error('Expect only synthetic configs');
    }
  
    const erc721Metadata = {...this.tokenMetadata, ...config };
    if (!isTokenMetadata(erc721Metadata)) {
      throw new Error(`Token metadata not populated for ${chain}`);
    }
    
    const router = await this.deploySynthetic(chain, config, erc721Metadata);
    return { router };
  }
}
