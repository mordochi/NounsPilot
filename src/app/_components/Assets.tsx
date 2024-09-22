'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Strategy } from '../api/strategy/[chainId]/types';

export default function Assets() {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const { address } = useAccount();

  useEffect(() => {
    if (!address) return;
    fetch(`/api/1inch/balance/${address}`)
      .then((res) => res.json())
      .then((addressBalances) => {
        setBalances(
          Object.fromEntries(
            Object.entries<string>(addressBalances).filter(
              ([_, balance]) => balance !== '0'
            )
          )
        );
      });
  }, [address]);

  useEffect(() => {
    if (!address) return;
    if (Object.keys(balances).length === 0) return;

    const balanceExists = Object.keys(balances).filter(
      (address) => balances[address] !== '0'
    );
    if (balanceExists.length === 0) return;

    const query = new URLSearchParams(
      balanceExists.map((address) => ['tokenAddress', address])
    );
    query.append('chainId', '1');

    fetch(`/api/strategy/1?` + query)
      .then((res) => res.json())
      .then((res: Record<string, Strategy[]>) => {
        console.log(res);
      });
  }, [balances, address]);

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
