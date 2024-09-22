import { http } from 'viem';
import { arbitrum, mainnet, polygon } from 'viem/chains';
import { createConfig } from 'wagmi';

const config = createConfig({
  chains: [mainnet, polygon, arbitrum],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});

export default config;
