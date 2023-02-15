import { ethers } from 'ethers';

import { RouterConfig } from '@hyperlane-xyz/sdk';

export enum TokenType {
  synthetic = 'synthetic',
  syntheticUri = 'syntheticUri',
  collateral = 'collateral',
  collateralUri = 'collateralUri',
  native = 'native'
}

export type SyntheticConfig = {
  type: TokenType.synthetic | TokenType.syntheticUri;
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
  gasAmount?: ethers.BigNumberish;
};
export type CollateralConfig = {
  type: TokenType.collateral | TokenType.collateralUri;
  token: string;
  gasAmount?: ethers.BigNumberish;
};
export type NativeConfig = {
  type: TokenType.native;
  gasAmount?: ethers.BigNumberish;
};

export type TokenConfig = SyntheticConfig | CollateralConfig | NativeConfig;

export const isCollateralConfig = (
  config: RouterConfig & TokenConfig,
): config is RouterConfig & CollateralConfig => 
    config.type === TokenType.collateral ||
    config.type === TokenType.collateralUri;

export const isSyntheticConfig = (
  config: RouterConfig & TokenConfig,
): config is RouterConfig & SyntheticConfig => config.type === TokenType.synthetic || config.type === TokenType.syntheticUri;

export const isNativeConfig = (config: TokenConfig): config is NativeConfig => config.type === TokenType.native;

export const isUriConfig = (config: RouterConfig & TokenConfig) =>
  config.type === TokenType.syntheticUri ||
  config.type === TokenType.collateralUri;

export type HypERC20Config = RouterConfig & TokenConfig;
export type HypERC20CollateralConfig = RouterConfig & CollateralConfig;
export type HypNativeConfig = RouterConfig & NativeConfig;

export type HypERC721Config = RouterConfig & TokenConfig;
export type HypERC721CollateralConfig = RouterConfig & CollateralConfig;
