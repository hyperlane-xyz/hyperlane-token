import { RouterConfig } from '@hyperlane-xyz/sdk';
import { ethers } from 'ethers';

export type Erc20TokenConfig = {
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
};

export type HplERC20Config = RouterConfig & Erc20TokenConfig;

export type Erc721TokenConfig = {
  name: string;
  symbol: string;
  mintAmount: ethers.BigNumberish;
};

export type HplERC721Config = RouterConfig & Erc721TokenConfig;
