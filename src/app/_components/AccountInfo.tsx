'use client';

import { Box } from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { useUserWallets } from '@dynamic-labs/sdk-react-core';
import { Fragment } from 'react';

export default function AccountInfo() {
  const { address, isConnected, chain } = useAccount();
  const userWallets = useUserWallets();

  return (
    <Box mt="24px">
      <p>wagmi connected: {isConnected ? 'true' : 'false'}</p>
      <p>wagmi address: {address}</p>
      <p>wagmi network: {chain?.id}</p>

      {userWallets.map((wallet) => (
        <Fragment key={wallet.id}>
          <p>-------</p>
          <p>dynamic connected: {isConnected ? 'true' : 'false'}</p>
          <p>dynamic address: {wallet.address}</p>
          <p>dynamic network: {wallet.chain}</p>
        </Fragment>
      ))}
    </Box>
  );
}
