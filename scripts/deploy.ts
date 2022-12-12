import { Wallet } from 'ethers';

import {
  Chains,
  HyperlaneCore,
  MultiProvider,
  objMap,
} from '@hyperlane-xyz/sdk';
import { RouterConfig, chainConnectionConfigs } from '@hyperlane-xyz/sdk';

import { CollateralConfig, SyntheticConfig } from '../src/config';
import { HypERC721Deployer } from '../src/deploy';

const prodConfigs = {
  celo: chainConnectionConfigs.celo,
  ethereum: chainConnectionConfigs.ethereum,
};

async function deployNFTWrapper() {
  console.info('Getting signer');
  const signer = new Wallet(
    'pkey',
  );

  console.log(prodConfigs);
  console.info('Preparing utilities');
  const chainProviders = objMap(prodConfigs, (_, config) => ({
    provider: config.provider,
    confirmations: config.confirmations,
    overrides: config.overrides,
    signer: new Wallet(
      'pkey',
      config.provider,
    ),
  }));

  const multiProvider = new MultiProvider(chainProviders);

  const core = HyperlaneCore.fromEnvironment('mainnet', multiProvider);
  const config = {
    celo: {
      type: 'SYNTHETIC_URI',
      name: 'Flow3rs 2022',
      symbol: 'FLOW3',
      totalSupply: 0,
      owner: signer.address,
      mailbox: '0x1d3aAC239538e6F1831C8708803e61A9EA299Eec',
      interchainGasPaymaster: core.getContracts(Chains.celo)
        .interchainGasPaymaster.address,
    } as SyntheticConfig & RouterConfig,
    ethereum: {
      type: 'COLLATERAL_URI',
      token: '0x0b23Be9f71d57B06F125cF88D5bF063b0e23ACEc',
      owner: signer.address,
      mailbox: '0x1d3aAC239538e6F1831C8708803e61A9EA299Eec',
      interchainGasPaymaster: core.getContracts(Chains.ethereum)
        .interchainGasPaymaster.address,
    } as CollateralConfig & RouterConfig,
  };

  const deployer = new HypERC721Deployer(multiProvider, config, core);

  await deployer.deploy();
}

deployNFTWrapper().then(console.log).catch(console.error);
