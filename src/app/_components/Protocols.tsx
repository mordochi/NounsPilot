'use client';

import {
  Box,
  Flex,
  Text,
  keyframes,
  usePrefersReducedMotion,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Address, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import AlertTriangleSharp from '@/components/icons/AlertTriangleSharp';
import TrendingUpSharp from '@/components/icons/TrendingUpSharp';
import type { DefiToken } from '@/types';
import { Strategy } from '../api/strategy/[chainId]/types';
import ProcessBar from './ProcessBar';
import ProtocolTags from './ProtocolTags';
import TokenIcon from './TokenIcon';

const spin = keyframes`
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
`;

const TEMP: Record<Address, Strategy[]> = {
  '0x6b175474e89094c44da98b954eedeac495271d0f': [
    {
      apr: 0.07,
      chainId: 1,
      contract: {
        contractAddress: '0x028eC7330ff87667b6dfb0D94b954c820195336c',
        abi: [],
      },
      input: {
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
      },
      name: 'Yearn Vault DAI',
      output: {
        name: 'DAI-1 yVault',
        symbol: 'yvDAI-1',
        address: '0x028eC7330ff87667b6dfb0D94b954c820195336c',
        decimals: 18,
      },
      platformIcon:
        'https://seeklogo.com/images/Y/yearn-finance-logo-A46504E937-seeklogo.com.png',
      riskLevel: 1,
      tvl: 4731769.167609766,
    },
    {
      apr: 0.061689450401205576,
      chainId: 42161,
      contract: {
        contractAddress: '0x9FA306b1F4a6a83FEC98d8eBbaBEDfF78C407f6B',
        abi: [],
      },
      input: {
        name: 'USD Coin (Arb1)',
        symbol: 'USDC',
        address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        decimals: 6,
      },
      name: 'Yearn Vault USDC.e-2',
      output: {
        name: 'USDC.e-2',
        symbol: 'yvUSDC-2',
        address: '0x9FA306b1F4a6a83FEC98d8eBbaBEDfF78C407f6B',
        decimals: 6,
      },
      platformIcon:
        'https://seeklogo.com/images/Y/yearn-finance-logo-A46504E937-seeklogo.com.png',
      riskLevel: 2,
      tvl: 699766.223093,
    },
  ],
};

export default function Protocols() {
  const [ownedTokenInfos, setOwnedTokenInfos] = useState<
    Record<Address, DefiToken>
  >({});
  const [strategies, setStrategies] =
    useState<Record<Address, Strategy[]>>(TEMP);
  const { address, chain } = useAccount();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!address || !chain?.id) return;
    fetch(`/api/1inch/${chain.id}/balance/${address}`)
      .then((res) => res.json())
      .then((addressTokenInfos) => {
        const result = Object.fromEntries(
          Object.entries<DefiToken>(addressTokenInfos).filter(
            ([_, tokenInfo]) => tokenInfo.balance !== '0'
          )
        );
        setOwnedTokenInfos(result);

        if (!Object.keys(result).length) return;
        const query = new URLSearchParams(
          Object.keys(result).map((address) => ['tokenAddress', address])
        );

        fetch(`/api/strategy/${chain.id.toString()}?` + query)
          .then((res) => res.json())
          .then((res: Record<string, Strategy[]>) => {
            setStrategies(res);
          });
      });
  }, [address, chain?.id]);

  let order = -1;

  const animation = prefersReducedMotion
    ? undefined
    : `${spin} infinite 1.5s linear`;

  return (
    <Box width="100%" mt="16px">
      {(Object.keys(strategies) as Address[]).map((tokenAddress) => {
        const tokenStrategies = strategies[tokenAddress];
        const currentToken =
          ownedTokenInfos[tokenAddress.toLowerCase() as Address] || {};
        const balanceString = formatUnits(
          BigInt(currentToken.balance || 0),
          currentToken.decimals
        );
        return tokenStrategies.map((strategy) => {
          order++;
          return (
            <Box
              key={`${tokenAddress}-${strategy.contract.contractAddress}`}
              width="100%"
              padding="16px"
              pb="calc(16px + 22px)"
              my="16px"
              bg={`brand.${order % 3 === 0 ? 'light' : order % 3 === 1 ? 'dark' : 'regular'}`}
              borderRadius="10px"
            >
              <Flex justifyContent="space-between" fontFamily="silkscreen">
                <Text
                  fontWeight="bold"
                  color={`risk.${strategy.riskLevel + 1}`}
                >
                  <AlertTriangleSharp
                    boxSize="20px"
                    mr="4px"
                    fill={`risk.${strategy.riskLevel + 1}`}
                  />
                  Risk Level: {strategy.riskLevel}
                </Text>

                <Text fontSize="14px" color="secondary">
                  {strategy.apr > 0.2 ? (
                    <TrendingUpSharp
                      boxSize="26px"
                      fill="secondary"
                      mr="4px"
                      animation={animation}
                    />
                  ) : null}

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

              <ProtocolTags
                isBridgeNeeded={!!chain?.id && chain.id !== strategy.chainId}
                isSwapNeeded={
                  tokenAddress !== strategy.input.address.toLowerCase()
                }
                mt={
                  (chain?.id && chain.id !== strategy.chainId) ||
                  tokenAddress !== strategy.input.address.toLowerCase()
                    ? '4px'
                    : '0'
                }
                mb={
                  (chain?.id && chain.id !== strategy.chainId) ||
                  tokenAddress !== strategy.input.address.toLowerCase()
                    ? '32px'
                    : '0'
                }
              />

              <Flex
                justifyContent="space-between"
                alignItems="center"
                mt="32px"
              >
                <Flex alignItems="center" width="20%">
                  <TokenIcon
                    name={currentToken.name}
                    symbol={currentToken.symbol || 'j'}
                    url={currentToken.logoURI}
                  />
                  <Box ml="8px">
                    {currentToken.balance ? (
                      <Text>
                        {balanceString.split('.')[0] +
                          (balanceString.split('.')[1]
                            ? '.' + balanceString.split('.')[1].slice(0, 6)
                            : '')}{' '}
                        {currentToken.symbol} (Max)
                      </Text>
                    ) : null}
                  </Box>
                </Flex>

                <ProcessBar
                  strategyChainId={strategy.chainId}
                  strategyName={strategy.name}
                  isSwapNeeded={
                    tokenAddress !== strategy.input.address.toLowerCase()
                  }
                />

                <Flex justifyContent="flex-end" alignItems="center" width="20%">
                  <Box mr="8px">
                    <Text>
                      Receive{' '}
                      <Text as="span" fontWeight="bold">
                        {strategy.output.symbol}
                      </Text>
                    </Text>
                  </Box>
                  <TokenIcon
                    name={strategy.output.name}
                    symbol={strategy.output.symbol}
                  />
                </Flex>
              </Flex>
            </Box>
          );
        });
      })}
    </Box>
  );
}
