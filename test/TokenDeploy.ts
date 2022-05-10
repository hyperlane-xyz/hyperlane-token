import { TestAbacusDeploy, TestRouterDeploy } from '@abacus-network/hardhat';
import { types } from '@abacus-network/utils';
import { ethers } from 'ethers';
import {
  AbcERC20,
  AbcERC20__factory,
  AbcERC721,
  AbcERC721__factory,
} from '../types';

export type TokenConfig = {
  signer: ethers.Signer;
  name: string;
  symbol: string;
  totalSupply: ethers.BigNumberish;
};

type ERC721 = {
  contract: AbcERC721;
  factory: AbcERC721__factory;
};
type ERC20 = {
  contract: AbcERC20;
  factory: AbcERC20__factory;
};
type TokenType = ERC721 | ERC20;

abstract class TokenDeploy<Token extends TokenType> extends TestRouterDeploy<
  Token['contract'],
  TokenConfig
> {
  abstract factory(signer: ethers.Signer): Token['factory'];
  async deployInstance(
    domain: types.Domain,
    abacus: TestAbacusDeploy,
    config = this.config,
  ): Promise<Token['contract']> {
    const tokenFactory = this.factory(config.signer);
    const token = await tokenFactory.deploy();
    await token.initialize(
      abacus.abacusConnectionManager(domain).address,
      config.totalSupply,
      config.name,
      config.symbol,
    );
    return token;
  }

  router(domain: types.Domain) {
    return this.instances[domain];
  }
}

export class ERC20Deploy extends TokenDeploy<ERC20> {
  factory(signer: ethers.Signer) {
    return new AbcERC20__factory(signer);
  }
}

export class ERC721Deploy extends TokenDeploy<ERC721> {
  constructor(readonly configMap: { [domain: number]: TokenConfig }) {
    super({} as TokenConfig);
  }
  deployInstance(domain: number, abacus: TestAbacusDeploy): Promise<AbcERC721> {
    return super.deployInstance(domain, abacus, this.configMap[domain]);
  }
  factory(signer: ethers.Signer) {
    return new AbcERC721__factory(signer);
  }
}
