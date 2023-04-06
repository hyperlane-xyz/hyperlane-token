import { HyperlaneFactories } from '@hyperlane-xyz/sdk';
import { TokenType } from './config';
import {
  HypERC20Collateral__factory,
  HypERC20__factory,
  HypERC721Collateral__factory,
  HypERC721URICollateral__factory,
  HypERC721URIStorage__factory,
  HypERC721__factory,
  HypNativeCollateral__factory,
  TokenRouter,
} from './types';

type TokenRouterFactory = { deploy(...args: any[]): Promise<TokenRouter>; };

export type TokenFactories = Partial<Record<TokenType, TokenRouterFactory>> & HyperlaneFactories;

export const hypErc20Factories = {
  [TokenType.synthetic]: new HypERC20__factory(),
  [TokenType.collateral]: new HypERC20Collateral__factory(),
  [TokenType.native]: new HypNativeCollateral__factory(),
};

export type HypERC20Factories = typeof hypErc20Factories;

export const hypErc721Factories = {
  [TokenType.synthetic]: new HypERC721__factory(),
  [TokenType.syntheticUri]: new HypERC721URIStorage__factory(),
  [TokenType.collateral]: new HypERC721Collateral__factory(),
  [TokenType.collateralUri]: new HypERC721URICollateral__factory(),
};

export type HypERC721Factories = typeof hypErc721Factories;
