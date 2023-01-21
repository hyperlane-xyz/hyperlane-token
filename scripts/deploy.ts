/**
 * Script to deploy warp routes
 * Accepts 3 arguments:
 *   - private-key : Hex string of private key. Note: deployment requires funds on all chains
 *   - token-config : Path to token config JSON file (see example in ./configs)
 *   - chain-config : (Optional) Path to chain config JSON file (see example in ./configs)
 * Example: yarn ts-node scripts/deploy.ts --private-key $PRIVATE_KEY --token-config ./configs/warp-route-token-config.json
 */
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';

import {
  ChainMap,
  IChainConnection,
  MultiProvider,
  chainConnectionConfigs,
  objMap,
  serializeContracts,
} from '@hyperlane-xyz/sdk';

import { HypERC20Deployer } from '../src/deploy';

async function deployWarpRoute() {
  const argv = await yargs
    .option('private-key', {
      type: 'string',
      describe: 'Private key for signing transactions',
      demandOption: true,
    })
    .option('token-config', {
      type: 'string',
      describe: 'Path to token config JSON file',
      demandOption: true,
    })
    .option('chain-config', {
      type: 'string',
      describe: 'Path to chain config JSON file',
    }).argv;

  const privateKey = argv['private-key'];
  const tokenConfigPath = argv['token-config'];
  const chainConfigPath = argv['chain-config'];

  console.log('Reading warp route configs');

  const tokenConfig = JSON.parse(
    fs.readFileSync(path.resolve(tokenConfigPath), 'utf-8'),
  );
  const targetChains = Object.keys(tokenConfig);
  console.log(
    `Found token configs for ${targetChains.length} chains:`,
    targetChains.join(', '),
  );

  const chainConfig = chainConfigPath
    ? JSON.parse(fs.readFileSync(path.resolve(chainConfigPath), 'utf-8'))
    : null;
  if (chainConfig) {
    const customChains = Object.keys(chainConfig);
    console.log(
      `Found custom configs for ${customChains.length} chains:`,
      customChains.join(', '),
    );
  }

  let multiProviderConfig: ChainMap<any, IChainConnection> = {};
  for (const chain of targetChains) {
    if (chainConfig && chainConfig[chain]) {
      // Use custom config
      multiProviderConfig[chain] = {
        provider: new ethers.providers.JsonRpcProvider(
          chainConfig[chain].rpcUrl,
          chainConfig[chain].id,
        ),
        confirmations: chainConfig[chain].confirmations || 1,
        blockExplorerUrl: chainConfig[chain].blockExplorerUrl,
        blockExplorerApiUrl: chainConfig[chain].blockExplorerApiUrl,
      };
    } else {
      // Use SDK default
      multiProviderConfig[chain] = chainConnectionConfigs[chain];
    }
  }

  console.log('Preparing wallet');
  const signer = new ethers.Wallet(privateKey);

  console.log('Preparing chain providers');
  const multiProvider = new MultiProvider(
    objMap(chainConnectionConfigs, (_chain, conf) => ({
      ...conf,
      signer: signer.connect(conf.provider),
    })),
  );

  console.log('Starting deployments');
  const deployer = new HypERC20Deployer(multiProvider, tokenConfig, undefined);
  await deployer.deploy();

  console.log('Deployments successful. Deployed contracts:');
  // @ts-ignore
  console.log(serializeContracts(deployer.deployedContracts));
}

deployWarpRoute()
  .then(() => console.log('Warp Route deployment done'))
  .catch((e) => console.error('Warp Route deployment error:', e));
