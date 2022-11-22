import { RouterContracts, RouterFactories } from '@hyperlane-xyz/sdk';

import {
  ERC20Router,
  HypERC20__factory,
  HypERC721,
  HypERC721__factory,
} from './types';

export type HypERC20Factories = RouterFactories<ERC20Router>;

export const hypERC20Factories: HypERC20Factories = {
  router: new HypERC20__factory(), // for non-collateral chains
};

export type HypERC20Contracts = RouterContracts<ERC20Router>;

export type HypERC721Factories = RouterFactories<HypERC721>;

export const hypERC721Factories: HypERC721Factories = {
  router: new HypERC721__factory(),
};

export type HypERC721Contracts = RouterContracts<HypERC721>;
