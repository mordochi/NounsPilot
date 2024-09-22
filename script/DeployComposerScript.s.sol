// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script, console} from 'forge-std/Script.sol';
import {NonusBridgePilot} from '../src/NonusBridgePilot.sol';

contract DeployComposerScript is Script {
  // Endpoint addresses
  address constant arbitrumEndpoint =
    0x1a44076050125825900e736c501f859c50fE728c;

  // StargatePoolUSDC Arbitrum
  address constant stargateUSDCAppArbitrum =
    0xe8CDF27AcD73a434D661C84887215F7598e7d0d3;

  function setUp() public {}

  function run() public {
    uint256 deployerPrivateKey = vm.envUint('PRIVATE_KEY');
    vm.startBroadcast(deployerPrivateKey);

    NonusBridgePilot nonusBridgePilot = new NonusBridgePilot(
      arbitrumEndpoint,
      stargateUSDCAppArbitrum
    );

    address owner = nonusBridgePilot.owner();
    console.log(owner);

    vm.stopBroadcast();
  }
}
