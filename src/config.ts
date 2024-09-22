import { createConfig } from 'wagmi';
import { http } from 'viem';
import { mainnet, polygon } from 'viem/chains';

const config = createConfig({
  chains: [mainnet, polygon],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
});

export default config;
