import { ethers } from 'ethers';
import {
  HypERC20Collateral__factory,
  HypERC20__factory,
  HypERC721Collateral__factory,
  HypERC721URICollateral__factory,
  HypERC721URIStorage__factory,
  HypERC721__factory,
  HypNativeCollateral__factory,
  TokenRouter__factory,
} from './types';

export type TokenFactories = { synthetic: TokenRouter__factory & ethers.ContractFactory } | { collateral: TokenRouter__factory & ethers.ContractFactory };

export type HypERC20Factories =
  | {
      synthetic: HypERC20__factory;
    }
  | { collateral: HypERC20Collateral__factory | HypNativeCollateral__factory };

export type HypERC721Factories =
  | {
      synthetic: HypERC721__factory | HypERC721URIStorage__factory;
    }
  | {
      collateral:
        | HypERC721Collateral__factory
        | HypERC721URICollateral__factory;
    };
