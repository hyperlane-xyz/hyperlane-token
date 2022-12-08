import { ethers } from 'ethers';

import { RouterConfig } from '@hyperlane-xyz/sdk';

export type SyntheticConfig = {
  type: "SYNTHETIC" | "SYNTHETIC_URI";
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
};
export type CollateralConfig = {
  type: "COLLATERAL" | "COLLATERAL_URI";
  token: string;
}

export type TokenConfig = SyntheticConfig | CollateralConfig;

export const isCollateralConfig = (config: RouterConfig & TokenConfig): config is RouterConfig & CollateralConfig => {
  return config.type.startsWith("COLLATERAL");
}

export const isUriConfig = (config: RouterConfig & TokenConfig) => config.type.endsWith("URI");

export type HypERC20Config = RouterConfig & TokenConfig;
export type HypERC20CollateralConfig = RouterConfig & CollateralConfig;

export type HypERC721Config = RouterConfig & TokenConfig;
export type HypERC721CollateralConfig = RouterConfig & CollateralConfig;
