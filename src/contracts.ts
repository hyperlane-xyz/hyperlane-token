import { RouterContracts, RouterFactories } from '@hyperlane-xyz/sdk';

import {
  HplERC20,
  HplERC20__factory,
  HplERC721,
  HplERC721__factory,
} from './types';

export type HplERC20Factories = RouterFactories<HplERC20>;

export const hplERC20Factories: HplERC20Factories = {
  router: new HplERC20__factory(),
};

export type HplERC20Contracts = RouterContracts<HplERC20>;

export type HplERC721Factories = RouterFactories<HplERC721>;

export const hplERC721Factories: HplERC721Factories = {
  router: new HplERC721__factory(),
};

export type HplERC721Contracts = RouterContracts<HplERC721>;
