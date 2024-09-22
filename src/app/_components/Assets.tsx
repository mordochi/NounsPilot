'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export default function Assets() {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const { address } = useAccount();

  useEffect(() => {
    if (address)
      fetch(`/api/1inch/balance/${address}`)
        .then((res) => res.json())
        .then(setBalances);
  }, [address]);

  return (
    <Box mt="24px">
      {Object.keys(balances).map((tokenAddress) => (
        <Flex
          key={tokenAddress}
          flex="1"
          justifyContent="space-between"
          padding="12px"
        >
          <Box>
            <Text>Token: </Text>
            <Text>{tokenAddress}</Text>
          </Box>
          <Box>
            <Text>Balance: </Text>
            <Text>{balances[tokenAddress]}</Text>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
