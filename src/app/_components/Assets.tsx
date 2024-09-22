'use client';

import {
  Box,
  Center,
  Image as ChakraImage,
  Flex,
  Text,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import AlertTriangleDotted from '@/components/icons/AlertTriangleDotted';
import { Strategy } from '../api/strategy/[chainId]/types';
import ProcessBar from './ProcessBar';

export default function Assets() {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [strategies, setStrategies] = useState<Record<string, Strategy[]>>({});
  const { address, chain } = useAccount();
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
    if (!address || !chain?.id) return;
    fetch(`/api/1inch/${chain.id}/balance/${address}`)
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
  }, [address, chain?.id]);

  useEffect(() => {
    if (!Object.keys(balances).length || !chain?.id) return;
    const query = new URLSearchParams(
      Object.keys(balances).map((address) => ['tokenAddress', address])
    );
    fetch(`/api/strategy/${chain.id.toString()}?` + query)
      .then((res) => res.json())
      .then((res: Record<string, Strategy[]>) => {
        setStrategies(res);
      });
  }, [balances, chain?.id]);

  return (
    <Box width="100%" mt="16px">
      {allStrategies.map((strategy, index) => {
        return (
          <Box
            key={strategy.contract.contractAddress}
            width="100%"
            padding="16px"
            pb="calc(16px + 22px)"
            my="16px"
            bg={`brand.${index % 2 === 0 ? 'light' : 'regular'}`}
            borderRadius="10px"
          >
            <Flex justifyContent="space-between" fontFamily="silkscreen">
              <Text fontWeight="bold">
                <AlertTriangleDotted boxSize="20px" mr="4px" />
                Risk Level: {strategy.riskLevel}
              </Text>

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
                  {strategy.input.tokenIconURL ? (
                    <ChakraImage
                      src={strategy.input.tokenIconURL}
                      alt={strategy.input.name}
                      fallback={
                        <Text>{strategy.input.symbol[0].toUpperCase()}</Text>
                      }
                    />
                  ) : (
                    strategy.input.symbol[0].toUpperCase()
                  )}
                </Center>
                <Box ml="12px">
                  {balances[strategy.input.address.toLowerCase()] ? (
                    <Text>
                      {formatUnits(
                        BigInt(balances[strategy.input.address.toLowerCase()]),
                        strategy.input.decimals
                      )}{' '}
                      {strategy.input.symbol} (Max)
                    </Text>
                  ) : null}
                </Box>
              </Flex>

              <ProcessBar
                strategyChainId={strategy.chainId}
                strategyName={strategy.name}
              />

              <Flex alignItems="center">
                <Box mr="12px">
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
                  {strategy.output.symbol[0].toUpperCase()}
                </Center>
              </Flex>
            </Flex>
          </Box>
        );
      })}
    </Box>
  );
}
