import { ethers } from 'ethers';

import { RouterConfig } from '@hyperlane-xyz/sdk';

enum TokenType {
  Collateral,
  Synthetic
}

export type SyntheticConfig = {
  type: TokenType.Synthetic;
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
};
export type CollateralConfig = {
  type: TokenType.Collateral;
  token: string;
}

export type TokenConfig = SyntheticConfig | CollateralConfig;

export const isCollateralConfig = (config: RouterConfig & TokenConfig): config is RouterConfig & CollateralConfig => {
  return config.type === TokenType.Collateral;
}

export type HypERC20Config = RouterConfig & TokenConfig;
export type HypERC20CollateralConfig = RouterConfig & CollateralConfig;

export type HypERC721Config = RouterConfig & TokenConfig;
export type HypERC721CollateralConfig = RouterConfig & CollateralConfig;
