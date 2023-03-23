import { ethers } from 'ethers';

import { GasRouterConfig, RouterConfig } from '@hyperlane-xyz/sdk';

export enum TokenType {
  synthetic = 'synthetic',
  syntheticUri = 'syntheticUri',
  collateral = 'collateral',
  collateralUri = 'collateralUri',
  native = 'native',
}

export type TokenMetadata = {
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
}

export type ERC20Metadata = TokenMetadata & {
  decimals: number;
}

export const isTokenMetadata = (metadata: any): metadata is TokenMetadata => 
    metadata.name !== undefined && metadata.symbol !== undefined && metadata.totalSupply !== undefined;

export const isErc20Metadata = (metadata: any): metadata is ERC20Metadata => metadata.decimals !== undefined && isTokenMetadata(metadata);

export type SyntheticConfig = Partial<ERC20Metadata> & {
  type: TokenType.synthetic | TokenType.syntheticUri;
};
export type CollateralConfig = {
  type: TokenType.collateral | TokenType.collateralUri;
  token: string;
};
export type NativeConfig = {
  type: TokenType.native;
};

export type TokenConfig = SyntheticConfig | CollateralConfig | NativeConfig;

export const isCollateralConfig = (
  config: TokenConfig,
): config is CollateralConfig =>
  config.type === TokenType.collateral ||
  config.type === TokenType.collateralUri;

export const isSyntheticConfig = (
  config: TokenConfig,
): config is SyntheticConfig =>
  config.type === TokenType.synthetic || config.type === TokenType.syntheticUri;

export const isNativeConfig = (config: TokenConfig): config is NativeConfig =>
  config.type === TokenType.native;

export const isUriConfig = (config: TokenConfig) =>
  config.type === TokenType.syntheticUri ||
  config.type === TokenType.collateralUri;

export type HypERC20Config = Partial<GasRouterConfig> &
  RouterConfig &
  TokenConfig;
export type HypERC20CollateralConfig = Partial<GasRouterConfig> &
  RouterConfig &
  CollateralConfig;
export type HypNativeConfig = Partial<GasRouterConfig> &
  RouterConfig &
  NativeConfig;

export type HypERC721Config = Partial<GasRouterConfig> &
  RouterConfig &
  TokenConfig;
export type HypERC721CollateralConfig = Partial<GasRouterConfig> &
  RouterConfig &
  CollateralConfig;
