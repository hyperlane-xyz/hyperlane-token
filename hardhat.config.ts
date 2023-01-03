import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import * as ethers from 'ethers';
import 'hardhat-gas-reporter';
import { task, types } from 'hardhat/config';
import 'solidity-coverage';
import path from "path";
import fs from "fs";
import {
  MultiProvider,
  chainConnectionConfigs,
  objMap,
} from '@hyperlane-xyz/sdk';
import { HypERC20Deployer } from './src/deploy';

task('deploy-trade-route', 'Deploy a trade route')
  .addParam(
    'privateKey',
    'The private key to use to deploy the trade route on all the networks',
    undefined,
    types.string,
    false,
  )
  .addParam(
    'tokenConfig',
    'The configuration file for this trade route.',
    undefined,
    types.inputFile,
    false,
  )
  .setAction(async (taskArgs) => {
    const signer = new ethers.Wallet(taskArgs.privateKey);
    const config = JSON.parse(fs.readFileSync(path.resolve(taskArgs.tokenConfig), "utf-8"))
    const multiProvider = new MultiProvider(
      objMap(chainConnectionConfigs, (_chain, conf) => ({
        ...conf,
        signer: signer.connect(conf.provider),
      })),
    );

    const deployer = new HypERC20Deployer(multiProvider, config, undefined);
    await deployer.deploy();

    console.log('Deployment successful. Deployed contracts:')
    console.log(deployer.deployedContracts)
  });

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.16',
      },
    ],
  },
  gasReporter: {
    currency: 'USD',
  },
  typechain: {
    outDir: './src/types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  },
};
