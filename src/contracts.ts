import {
  HypERC20,
  HypERC20Collateral,
  HypERC721,
  HypERC721Collateral,
  HypERC721URICollateral,
  HypNative,
} from './types';

export type HypERC20Contracts = {
  router: HypERC20 | HypERC20Collateral | HypNative;
};
export type HypERC721Contracts = {
  router: HypERC721 | HypERC721Collateral | HypERC721URICollateral;
};

export type TokenContracts = HypERC20Contracts | HypERC721Contracts;
