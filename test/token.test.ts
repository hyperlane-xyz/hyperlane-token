import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { abacus, ethers } from 'hardhat';
import { AbcToken } from '../types';
import { TokenConfig, TokenDeploy } from './lib/TokenDeploy';

const localDomain = 1000;
const remoteDomain = 2000;
const totalSupply = 3000;
const domains = [localDomain, remoteDomain];

describe('AbcToken', async () => {
  let owner: SignerWithAddress,
    recipient: SignerWithAddress,
    router: AbcToken,
    remote: AbcToken,
    token: TokenDeploy;

  before(async () => {
    [owner, recipient] = await ethers.getSigners();
    await abacus.deploy(domains, owner);
  });

  beforeEach(async () => {
    const config: TokenConfig = {
      signer: owner,
      name: 'AbcToken',
      symbol: 'ABC',
      totalSupply,
    };
    token = new TokenDeploy(config);
    await token.deploy(abacus);
    router = token.router(localDomain);
    remote = token.router(remoteDomain);
  });

  it('should not be initializeable again', async () => {
    await expect(
      router.initialize(ethers.constants.AddressZero, 0, '', ''),
    ).to.be.revertedWith('Initializable: contract is already initialized');
  });

  it('should mint all supply to deployer', async () => {
    const balance = await router.balanceOf(owner.address);
    expect(balance).to.eq(totalSupply);
  });

  it('should allow for local transfers', async () => {
    const amount = 10;
    await router.transfer(recipient.address, amount);
    const balance = await router.balanceOf(recipient.address);
    expect(balance).to.eq(amount);
  });

  it('should allow for remote transfers', async () => {
    const amount = 10;
    await router.transferRemote(remoteDomain, recipient.address, amount);
    const balanceBeforeProcess = await remote.balanceOf(recipient.address);
    expect(balanceBeforeProcess).to.eq(0);

    await abacus.processMessages();
    const balanceAfterProcess = await remote.balanceOf(recipient.address);
    expect(balanceAfterProcess).to.eq(amount);
  });
});
