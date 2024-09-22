// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {NonusBridgePilot} from "../src/NonusBridgePilot.sol";

contract DeployComposerScript is Script {
    // Endpoint addresses
    address constant optimismSepoliaEndpoint =
        0x6EDCE65403992e310A62460808c4b910D972f10f;

    address constant usdtOptimismSepolia =
        0x9352001271a0af0d09a4e7F6C431663A2D5AA9d2;

    address constant stargateUSDTOAppOptimismSepolia =
        0x0d7aB83370b492f2AB096c80111381674456e8d8; // StargatePoolUSDT Optimism Sepolia

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        UniversalComposer universalComposer = new UniversalComposer(
            optimismSepoliaEndpoint,
            stargateUSDTOAppOptimismSepolia
        );

        address owner = universalComposer.owner();
        console.log(owner);

        vm.stopBroadcast();
    }
}