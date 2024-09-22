'use client';

import { Box, Center, Flex, Text } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { Strategy } from '../api/strategy/[chainId]/types';

export default function Assets() {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [strategies, setStrategies] = useState<Record<string, Strategy[]>>({});
  const { address, chain } = useAccount();
  console.log(chain);
  const allStrategies = useMemo(
    () => Object.values(strategies).flat(),
    // () => [
    //   {
    //     apr: 0.036334,
    //     chainId: 1,
    //     contract: { contractAddress: '0x123', abi: [] },
    //     input: {
    //       address: '0x23878914efe38d27c4d67ab83ed1b93a74d4086a',
    //       decimals: 6,
    //       name: 'USD Coin',
    //       symbol: 'USDC',
    //     },
    //     name: 'aave',
    //     output: {
    //       address: '0x123',
    //       decimals: 6,
    //       name: 'USDC yVault',
    //       symbol: 'yvUSDC',
    //     },
    //     riskLevel: 1,
    //     tvl: 3709134.44,
    //   },
    //   {
    //     apr: 0.036334,
    //     chainId: 1,
    //     contract: { contractAddress: '0x1223', abi: [] },
    //     input: {
    //       address: '0x23878914efe38d27c4d67ab83ed1b93a74d4086a',
    //       decimals: 6,
    //       name: 'USD Coin',
    //       symbol: 'USDC',
    //     },
    //     name: 'aave',
    //     output: {
    //       address: '0x123',
    //       decimals: 6,
    //       name: 'USDC yVault',
    //       symbol: 'yvUSDC',
    //     },
    //     riskLevel: 1,
    //     tvl: 3709134.44,
    //   },
    // ],
    [strategies]
  );

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
    if (!Object.keys(balances).length) return;
    const query = new URLSearchParams(
      Object.keys(balances).map((address) => ['tokenAddress', address])
    );
    query.append('chainId', '1');
    fetch(`/api/strategy/1?` + query)
      .then((res) => res.json())
      .then((res: Record<string, Strategy[]>) => {
        setStrategies(res);
      });
  }, [balances]);

  return (
    <Box width="100%" mt="24px">
      {allStrategies.map((strategy, index) => {
        return (
          <Box
            key={strategy.contract.contractAddress}
            width="100%"
            padding="16px"
            my="16px"
            bg={`brand.${index % 2 === 0 ? 'light' : 'regular'}`}
            borderRadius="10px"
          >
            <Flex justifyContent="space-between">
              <Text fontWeight="bold">Risk Level: {strategy.riskLevel}</Text>
              <Text fontSize="14px" color="secondary">
                <Text as="span" fontWeight="bold">
                  APR:{' '}
                  {new Intl.NumberFormat('en', {
                    style: 'percent',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(strategy.apr)}
                </Text>
                <Text as="span" fontWeight="bold" ml="8px">
                  TVL: {strategy.tvl}
                </Text>
              </Text>
            </Flex>
            <Flex justifyContent="space-between" alignItems="center" mt="8px">
              <Flex alignItems="center">
                <Center
                  width="24px"
                  height="24px"
                  bg="brand.lighter"
                  borderRadius="50%"
                >
                  {strategy.input.symbol[0].toUpperCase()}
                </Center>
                <Box ml="8px">
                  <Text>From: {chain?.name}</Text>
                  {balances[strategy.input.address] ? (
                    <Text>
                      {formatUnits(
                        BigInt(balances[strategy.input.address]),
                        strategy.input.decimals
                      )}{' '}
                      {strategy.input.symbol} (Max)
                    </Text>
                  ) : null}
                </Box>
              </Flex>

              <Center
                width="50%"
                height="0px"
                borderBottom="2px dashed"
                borderColor="brand.lighter"
                position="relative"
                _before={{
                  display: 'block',
                  content: '""',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  bg: 'brand.lighter',
                  position: 'absolute',
                  top: '50%',
                  left: '0',
                  transform: 'translate(-50%, calc(-50% + 1px))',
                }}
                _after={{
                  display: 'block',
                  content: '""',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  bg: 'brand.lighter',
                  position: 'absolute',
                  top: '50%',
                  right: '0',
                  transform: 'translate(50%, calc(-50% + 1px))',
                }}
              >
                <Text
                  display="inline-block"
                  padding="0 8px"
                  lineHeight="22px"
                  bg="brand.lighter"
                  borderRadius="4px"
                  transform="translate(0, 1px)"
                >
                  {strategy.name}
                </Text>
              </Center>

              <Flex alignItems="center">
                <Box mr="8px">
                  <Text>To: {chain?.name}</Text>
                  <Text>
                    Receive{' '}
                    <Text as="span" fontWeight="bold">
                      {strategy.output.symbol}
                    </Text>
                  </Text>
                </Box>
                <Center
                  width="24px"
                  height="24px"
                  bg="brand.lighter"
                  borderRadius="50%"
                >
                  {strategy.input.symbol[0].toUpperCase()}
                </Center>
              </Flex>
            </Flex>
          </Box>
        );
      })}
      {/* {Object.keys(balances).map((tokenAddress) => (
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
      ))} */}
    </Box>
  );
}
