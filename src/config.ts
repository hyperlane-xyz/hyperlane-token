import { ethers } from 'ethers';

import { GasRouterConfig, RouterConfig } from '@hyperlane-xyz/sdk';

export enum TokenType {
  synthetic = 'synthetic',
  syntheticUri = 'syntheticUri',
  collateral = 'collateral',
  collateralUri = 'collateralUri',
}

export type SyntheticConfig = {
  type: TokenType.synthetic | TokenType.syntheticUri;
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
};
export type CollateralConfig = {
  type: TokenType.collateral | TokenType.collateralUri;
  token: string;
};

export type TokenConfig = SyntheticConfig | CollateralConfig;

export const isCollateralConfig = (
  config: RouterConfig & TokenConfig,
): config is RouterConfig & CollateralConfig => {
  return (
    config.type === TokenType.collateral ||
    config.type === TokenType.collateralUri
  );
};

export const isUriConfig = (config: RouterConfig & TokenConfig) =>
  config.type === TokenType.syntheticUri ||
  config.type === TokenType.collateralUri;

export type HypERC20Config = GasRouterConfig & TokenConfig;
export type HypERC20CollateralConfig = GasRouterConfig & CollateralConfig;

export type HypERC721Config = GasRouterConfig & TokenConfig;
export type HypERC721CollateralConfig = GasRouterConfig & CollateralConfig;
