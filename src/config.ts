import { ethers } from 'ethers';

import { RouterConfig } from '@hyperlane-xyz/sdk';

export type TokenConfig = {
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
};
export type CollateralConfig = {
  token: string;
}

export const isCollateralConfig = (config: RouterConfig & TokenConfig | CollateralConfig): config is RouterConfig & CollateralConfig => {
  return (config as CollateralConfig).token !== undefined;
}

export type HypERC20Config = RouterConfig & TokenConfig;
export type HypERC20CollateralConfig = RouterConfig & CollateralConfig;

export type HypERC721Config = RouterConfig & TokenConfig;
export type HypERC721CollateralConfig = RouterConfig & CollateralConfig;
